import {
    useState,
    useEffect,
} from "react";
import { Modal, Button } from "react-bootstrap";
import {
    upgradeAccount,
    signOut,
    publishDictionary,
    upgradeToStudentRequest,
} from "../lib/backend-calls";
import LoadingElipses from "../components/LoadingElipses";
import { Helmet } from "react-helmet";
import * as AT from "../types/account-types";

const providers: ("google" | "twitter" | "github")[] = ["google", "twitter", "github"];

const capitalize = (s: string): string => {
    // if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

let popupRef: Window | null = null;

const Account = ({ user, loadUser }: { user: AT.LingdocsUser | undefined, loadUser: () => void }) => {
    const [showingUpgradePrompt, setShowingUpgradePrompt] = useState<boolean>(false);
    const [upgradePassword, setUpgradePassword] = useState<string>("");
    const [upgradeError, setUpgradeError] = useState<string>("");
    const [waiting, setWaiting] = useState<boolean>(false);
    const [publishingStatus, setPublishingStatus] = useState<undefined | "publishing" | any>(undefined);
    useEffect(() => {
        setShowingUpgradePrompt(false);
        setUpgradeError("");
        setWaiting(false);
        window.addEventListener("message", handleIncomingMessage);
        return () => {
            window.removeEventListener("message", handleIncomingMessage);
        };
        // eslint-disable-next-line
    }, []);
    // TODO put the account url in an imported constant
    function handleIncomingMessage(event: MessageEvent<any>) {
        if (event.origin === "https://account.lingdocs.com" && event.data === "signed in" && popupRef) {
            loadUser();
            popupRef.close();
        }
    }
    async function handleSignOut() {
        await signOut();
        loadUser();
    }
    function closeUpgrade() {
        setShowingUpgradePrompt(false);
        setUpgradePassword("");
        setUpgradeError("");
    }
    async function handleUpgradeRequest() {
        setUpgradeError("");
        setWaiting(true);
        upgradeToStudentRequest().then((res) => {
            setWaiting(false);
            if (res.ok) {
                loadUser();
                closeUpgrade();
            } else {
                setUpgradeError("Error requesting upgrade");
            }
        }).catch((err) => {
            setWaiting(false);
            setUpgradeError(err.message);
        });
    }
    async function handleUpgrade() {
        setUpgradeError("");
        setWaiting(true);
        upgradeAccount(upgradePassword).then((res) => {
            setWaiting(false);
            if (res.ok) {
                loadUser();
                closeUpgrade();
            } else {
                setUpgradeError("Incorrect password");
            }
        }).catch((err) => {
            setWaiting(false);
            setUpgradeError(err.message);
        });
    }
    function handleOpenSignup() {
        popupRef = window.open("https://account.lingdocs.com", "account", "height=800,width=500,top=50,left=400");
    }
    function handlePublish() {
        setPublishingStatus("publishing");
        publishDictionary().then((response) => {
            setPublishingStatus(response);
        }).catch((err) => {
            console.error(err);
            setPublishingStatus("Offline or connection error");
        });
    }
    if (!user) {
        return <div className="text-center mt-3">
            <Helmet>
                <link rel="canonical" href="https://dictionary.lingdocs.com/account" />
                <meta name="description" content="Sign in to the LingDocs Pashto Dictionary" />
                <title>Sign In - LingDocs Pashto Dictionary</title>
            </Helmet>
            <h2 className="my-4">Sign in to LingDocs</h2>
            <p className="lead mb-4">When you sign in or make a LingDocs account you can:</p>
            <div className="mb-3"><i className="fas fa-pen mr-2" /> contribute by suggesting corrections and new words</div>
            <div className="mb-3"><i className="fas fa-star mr-2" /> upgrade your account and start collecting a personal <strong>wordlist</strong></div>
            <button className="btn btn-lg btn-primary my-4" onClick={handleOpenSignup}><i className="fas fa-sign-in-alt mr-2" /> Sign In</button>
        </div>
    }
    return (
        <div style={{ marginBottom: "100px", maxWidth: "40rem" }}>
            <Helmet>
                <link rel="canonical" href="https://dictionary.lingdocs.com/account" />
                <meta name="description" content="Account for the LingDocs Pashto Dictionary" />
                <title>Account - LingDocs Pashto Dictionary</title>
            </Helmet>
            <h2 className="mb-4">Account</h2>   
            {user.level === "editor" &&
                <div className="mb-3">
                    <h4>Editor Tools</h4>
                    {publishingStatus !== "publishing" &&
                        <button type="button" className="btn btn-secondary" onClick={handlePublish}>Publish Dictionary</button>
                    }
                    {publishingStatus &&
                        <>
                            <h6 className="mt-3">Publishing response:</h6>
                            <pre className="pre-scrollable"><code>
                                {publishingStatus === "publishing" ?
                                    "processing..."
                                :
                                    JSON.stringify(publishingStatus, null, "\t")
                                }
                            </code></pre>
                        </>
                    }
                </div>
            }
            <div>
                {/* {user.p && <div className="mb-4 mt-3" style={{ textAlign: "center" }}>
                    <img src={user.photoURL} data-testid="userAvatar" alt="avatar" style={{ borderRadius: "50%", width: "5rem", height: "5rem" }}/>
                </div>} */}
                <div className="card mb-4">
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item">Name: {user.name}</li>
                        {user.email && <li className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div>Email: {user.email}</div>
                                </div>
                            </div>
                        </li>}
                        <li className="list-group-item">Account Level: {capitalize(user.level)} {user.upgradeToStudentRequest === "waiting"
                            ? "(Upgrade Requested)"
                            : ""}</li>
                        <li className="list-group-item">Signs in with: 
                            {(user.password && user.email) && <span>
                                <i className="fas fa-key ml-2"></i> <span className="small mr-1">Password</span>
                            </span>}
                            {providers.map((provider) => (
                                <span key={provider}>
                                    {user[provider] && <i className={`fab fa-${provider} mx-1`}></i>}
                                </span>
                            ))}
                        </li>
                    </ul>
                </div>
            </div>
            <h4 className="mb-3">Account Admin</h4>
            <div className="row mb-4">
                {user.level === "basic" && <div className="col-sm mb-3">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowingUpgradePrompt(true)}
                        data-testid="upgradeButton"
                    >
                        <i className="fa fa-level-up-alt"></i> Upgrade Account
                    </button>
                </div>}
                <div className="col-sm mb-3">
                    <a className="btn btn-outline-secondary" href="https://account.lingdocs.com/user">
                        <i className="fas fa-user mr-2"></i> Edit Account
                    </a>
                </div>
                <div className="col-sm mb-3">
                    <button className="btn btn-outline-secondary" onClick={handleSignOut}>
                        <i className="fas fa-sign-out-alt mr-2"></i> Sign Out
                    </button>
                </div>
            </div>
            <Modal show={showingUpgradePrompt} onHide={closeUpgrade}>
                <Modal.Header closeButton>
                    <Modal.Title>Upgrade to Student Account</Modal.Title>
                </Modal.Header>
                <Modal.Body>Enter the secret upgrade password to upgrade your account or <button className="btn btn-sm btn-outline-secondary my-2" onClick={handleUpgradeRequest}>request an upgrade</button></Modal.Body>
                <div className="form-group px-3">
                    <label htmlFor="upgradePasswordForm">Upgrade password:</label>
                    <input
                        type="text"
                        className="form-control"
                        id="upgradePasswordForm"
                        data-lpignore="true"
                        value={upgradePassword}
                        onChange={(e) => setUpgradePassword(e.target.value)}
                    />
                </div>
                {upgradeError && <div className="mt-3 alert alert-warning mx-3">
                    <p>
                        <strong>{upgradeError}</strong>
                    </p>
                </div>}
                <Modal.Footer>
                    {waiting && <LoadingElipses />}
                    <Button variant="secondary" onClick={closeUpgrade}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleUpgrade}>
                        Upgrade my account
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Account;