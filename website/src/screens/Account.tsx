import {
    useState,
    useEffect,
} from "react";
import { Modal, Button } from "react-bootstrap";
import {
    upgradeAccount,
    // publishDictionary,
} from "../lib/backend-calls";
import LoadingElipses from "../components/LoadingElipses";
import { Helmet } from "react-helmet";
import * as AT from "../lib/account-types";

const capitalize = (s: string): string => {
    // if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const Account = ({ user, loadUser }: { user: AT.LingdocsUser | undefined, loadUser: () => void }) => {
    const [showingUpgradePrompt, setShowingUpgradePrompt] = useState<boolean>(false);
    const [upgradePassword, setUpgradePassword] = useState<string>("");
    const [upgradeError, setUpgradeError] = useState<string>("");
    const [waiting, setWaiting] = useState<boolean>(false);
    // const [publishingStatus, setPublishingStatus] = useState<undefined | "publishing" | any>(undefined);
    useEffect(() => {
        setShowingUpgradePrompt(false);
        setUpgradePassword("");
        setUpgradeError("");
        setWaiting(false);
    }, []);
    function closeUpgrade() {
        setShowingUpgradePrompt(false);
        setUpgradePassword("");
        setUpgradeError("");
    }
    async function handleUpgrade() {
        setUpgradeError("");
        setWaiting(true);
        upgradeAccount(upgradePassword).then((res) => {
            setWaiting(false);
            console.log(res);
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
    // function handlePublish() {
    //     setPublishingStatus("publishing");
    //     publishDictionary().then((response) => {
    //         setPublishingStatus(response);
    //     }).catch((err) => {
    //         console.error(err);
    //         setPublishingStatus("Offline or connection error");
    //     });
    // }
    if (!user) {
        return <div className="text-center mt-3">
            <Helmet>
                <link rel="canonical" href="https://dictionary.lingdocs.com/account" />
                <meta name="description" content="Sign in to the LingDocs Pashto Dictionary" />
                <title>Sign In - LingDocs Pashto Dictionary</title>
            </Helmet>
            <h4 className="mb-4">Sign in to be able to suggest words/edits</h4>
        </div>
    }
    return (
        <div style={{ marginBottom: "100px" }}>
            <Helmet>
                <link rel="canonical" href="https://dictionary.lingdocs.com/account" />
                <meta name="description" content="Account for the LingDocs Pashto Dictionary" />
                <title>Account - LingDocs Pashto Dictionary</title>
            </Helmet>
            <h2 className="mb-4">Account</h2>   
            {/* {user.level === "editor" &&
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
            } */}
            <div style={{ maxWidth: "35rem" }}>
                {/* {user.p && <div className="mb-4 mt-3" style={{ textAlign: "center" }}>
                    <img src={user.photoURL} data-testid="userAvatar" alt="avatar" style={{ borderRadius: "50%", width: "5rem", height: "5rem" }}/>
                </div>} */}
                <div className="card mb-4">
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item">Name: {user.name}</li>
                        <li className="list-group-item">
                            {user.email && <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div>Email: {user.email}</div>
                                </div>
                            </div>}
                        </li>
                        <li className="list-group-item">Account Level: {capitalize(user.level)}</li>
                    </ul>
                </div>
            </div>
            {/* <button
                type="button"
                className="btn btn-secondary mr-3 mb-4"
                onClick={handleSignOut}
                data-testid="signoutButton"
            >
                <i className="fa fa-sign-out-alt"></i> Sign Out
            </button> */}
            <h4 className="mb-3">Account Admin</h4>
            <div className="mb-4">
                {user.level === "basic" && <button
                    type="button"
                    className="btn btn-outline-secondary mr-3 mb-3"
                    onClick={() => setShowingUpgradePrompt(true)}
                    data-testid="upgradeButton"
                >
                    <i className="fa fa-level-up-alt"></i> Upgrade Account
                </button>}
            </div>
            <Modal show={showingUpgradePrompt} onHide={closeUpgrade}>
                <Modal.Header closeButton>
                    <Modal.Title>Upgrade Account</Modal.Title>
                </Modal.Header>
                <Modal.Body>Enter the secret upgrade password to upgrade your account.</Modal.Body>
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