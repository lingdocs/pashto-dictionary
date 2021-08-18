import { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { auth, authUiConfig } from "../lib/firebase";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import {
    upgradeAccount,
    publishDictionary,
} from "../lib/backend-calls";
import LoadingElipses from "../components/LoadingElipses";
import { Helmet } from "react-helmet";

const capitalize = (s: string): string => {
    // if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const Account = ({ handleSignOut, level, loadUserInfo }: {
    handleSignOut: () => void,
    loadUserInfo: () => void,
    level: UserLevel,
}) => {
    const [showingDeleteConfirmation, setShowingDeleteConfirmation] = useState<boolean>(false);
    const [showingUpgradePrompt, setShowingUpgradePrompt] = useState<boolean>(false);
    const [upgradePassword, setUpgradePassword] = useState<string>("");
    const [upgradeError, setUpgradeError] = useState<string>("");
    const [accountDeleted, setAccountDeleted] = useState<boolean>(false);
    const [accountDeleteError, setAccountDeleteError] = useState<string>("");
    const [emailVerification, setEmailVerification] = useState<"unverified" | "sent" | "verified">("verified");
    const [waiting, setWaiting] = useState<boolean>(false);
    const [publishingStatus, setPublishingStatus] = useState<undefined | "publishing" | any>(undefined);
    const [showingPasswordChange, setShowingPasswordChange] = useState<boolean>(false);
    const [password, setPassword] = useState<string>("");
    const [passwordConfirmed, setPasswordConfirmed] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");
    const [showingUpdateEmail, setShowingUpdateEmail] = useState<boolean>(false);
    const [updateEmailError, setUpdateEmailError] = useState<string>("");
    const [newEmail, setNewEmail] = useState<string>("");
    const user = auth.currentUser;
    const hasPasswordProvider = user?.providerData?.some((d) => d?.providerId === "password");
    useEffect(() => {
        setShowingDeleteConfirmation(false);
        setShowingUpgradePrompt(false);
        setUpgradePassword("");
        setUpgradeError("");
        setWaiting(false);
    }, []);
    useEffect(() => {
        setEmailVerification((user && user.emailVerified) ? "verified" : "unverified");
    }, [user]);
    function handleDelete() {
        auth.currentUser?.delete().then(() => {
            setAccountDeleteError("");
            setShowingDeleteConfirmation(false);
            setAccountDeleted(true);
        }).catch((err) => {
            console.error(err);
            setAccountDeleteError(err.message);
        });
    }
    function closeUpgrade() {
        setShowingUpgradePrompt(false);
        setUpgradePassword("");
        setUpgradeError("");
    }
    function closeUpdateEmail() {
        setShowingUpdateEmail(false);
        setNewEmail("");
        setUpdateEmailError("");
    }
    async function handleUpgrade() {
        setUpgradeError("");
        setWaiting(true);
        upgradeAccount(upgradePassword).then((res) => {
            setWaiting(false);
            if (res.ok) {
                loadUserInfo();
                closeUpgrade();
            } else {
                setUpgradeError("Incorrect password");
            }
        }).catch((err) => {
            setWaiting(false);
            setUpgradeError(err.message);
        });
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
    function handleVerifyEmail() {
        if (!user) return;
        user.sendEmailVerification();
        setEmailVerification("sent");
    }
    function handleUpdateEmail() {
        if (!user) return;
        user.updateEmail(newEmail).then(() => {
            setShowingUpdateEmail(false);
        }).catch((err) => {
            setUpdateEmailError(err.message);
        });
    }
    function closePasswordChange() {
        setShowingPasswordChange(false);
        setPassword("");
        setPasswordConfirmed("");
    }
    function handlePasswordChange() {
        if (!user) return;
        if (password === "") {
            setPasswordError("Please enter a password");
            return;
        }
        if (password !== passwordConfirmed) {
            setPasswordError("Your passwords do not match");
            return;
        }
        user.updatePassword(password).then(() => {
            closePasswordChange();
        }).catch((err) => {
            setPasswordError(err.message);
        });
    }
    if (accountDeleted) {
        return <div style={{ maxWidth: "30rem"}}>
            <Helmet>
                <link rel="canonical" href="https://dictionary.lingdocs.com/account" />
                <title>Account Deleted - LingDocs Pashto Dictionary</title>
            </Helmet>
            <div className="alert alert-info my-4" role="alert">
                <h4>Your account has been deleted 🙋‍♂️</h4>
            </div>
            <Link to="/">
                <button className="btn btn-outline-secondary">
                    <i className="fa fa-sign-out-alt"></i> Home
                </button>
            </Link>
        </div>
    }
    if (!user) {
        return <div className="text-center mt-3">
            <Helmet>
                <link rel="canonical" href="https://dictionary.lingdocs.com/account" />
                <meta name="description" content="Sign in to the LingDocs Pashto Dictionary" />
                <title>Sign In - LingDocs Pashto Dictionary</title>
            </Helmet>
            <h4 className="mb-4">Sign in to be able to suggest words/edits</h4>
            <p style={{ margin: "0 auto", maxWidth: "500px"}}><strong>For people who previously signed in with Google.</strong> Sorry, there is a problem now and you can't get to your previous account! 😬 Don't worry, all your info is safe and it will be restored in the near future. Stay tuned.</p>
            <StyledFirebaseAuth uiConfig={authUiConfig}
                // callbacks: {
                // not using this now because of the doubling down on user email verification
                // signInSuccessWithAuthResult: (res: any) => {
                //     const newUser = res.additionalUserInfo?.isNewUser;
                //     const emailVerified = res.user.emailVerified;
                //     if (newUser && !emailVerified) {
                //         res.user.sendEmailVerification();
                //         setEmailVerification("sent");
                //     }
                //     return false;
                // }}
            firebaseAuth={auth} />
        </div>;
    }
    const defaultProviderId = user.providerData[0]?.providerId;
    return (
        <div style={{ marginBottom: "100px" }}>
            <Helmet>
                <link rel="canonical" href="https://dictionary.lingdocs.com/account" />
                <meta name="description" content="Account for the LingDocs Pashto Dictionary" />
                <title>Account - LingDocs Pashto Dictionary</title>
            </Helmet>
            <h2 className="mb-4">Account</h2>   
            {level === "editor" &&
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
            <div style={{ maxWidth: "35rem" }}>
                {user.photoURL && <div className="mb-4 mt-3" style={{ textAlign: "center" }}>
                    <img src={user.photoURL} data-testid="userAvatar" alt="avatar" style={{ borderRadius: "50%", width: "5rem", height: "5rem" }}/>
                </div>}
                <div className="card mb-4">
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item">Name: {user.displayName}</li>
                        <li className="list-group-item">
                            {user.email && <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div>Email: {user.email}
                                        {emailVerification === "unverified" && <button type="button" onClick={handleVerifyEmail} className="ml-3 btn btn-sm btn-primary">
                                            Verify Email
                                        </button>}
                                    </div>
                                    {emailVerification === "unverified" && <div className="mt-2" style={{ color: "red" }}>
                                        Please Verify Your Email Address
                                    </div>}
                                    {emailVerification === "sent" && <div className="mt-2">
                                        📧 Check your email for the confirmation message
                                    </div>}
                                </div>
                            </div>}
                        </li>
                        <li className="list-group-item">Account Level: {capitalize(level)}</li>
                    </ul>
                </div>
            </div>
            <button
                type="button"
                className="btn btn-secondary mr-3 mb-4"
                onClick={handleSignOut}
                data-testid="signoutButton"
            >
                <i className="fa fa-sign-out-alt"></i> Sign Out
            </button>
            <h4 className="mb-3">Account Admin</h4>
            <div className="mb-4">
                {level === "basic" && <button
                    type="button"
                    className="btn btn-outline-secondary mr-3 mb-3"
                    onClick={() => setShowingUpgradePrompt(true)}
                    data-testid="upgradeButton"
                >
                    <i className="fa fa-level-up-alt"></i> Upgrade Account
                </button>}
                <button
                    type="button"
                    className="btn btn-outline-secondary mr-3 mb-3"
                    onClick={() => setShowingPasswordChange(true)}
                >
                    <i className="fa fa-lock"></i> {!hasPasswordProvider ? "Add" : "Change"} Password
                </button>
                <button
                    type="button"
                    className="btn btn-outline-secondary mr-3 mb-3"
                    onClick={() => setShowingUpdateEmail(true)}
                >
                    <i className="fa fa-envelope"></i> Update Email
                </button>
            </div>
            <hr className="mb-4" />
            <button type="button" className="d-block my-3 btn btn-outline-danger" onClick={() => setShowingDeleteConfirmation(true)}>
                <i className="fa fa-trash"></i> Delete Account
            </button>
            <Modal show={showingDeleteConfirmation} onHide={() => setShowingDeleteConfirmation(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Account?</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are your sure you want to delete your account? This can't be undone.</Modal.Body>
                {accountDeleteError && <div className="mt-3 alert alert-warning mx-3">
                    <p>
                        <strong>{accountDeleteError}</strong>
                    </p>
                    <button
                        type="button"
                        className="btn btn-secondary d-block my-3"
                        onClick={handleSignOut}
                        data-testid="signoutButton"
                    >
                        <i className="fa fa-sign-out-alt"></i> Sign Out
                    </button>
                </div>}
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowingDeleteConfirmation(false)}>
                        No, cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Yes, delete my account
                    </Button>
                </Modal.Footer>
            </Modal>
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
            <Modal show={showingPasswordChange} onHide={closePasswordChange}>
                <Modal.Header closeButton>
                    <Modal.Title>{hasPasswordProvider ? "Change" : "Add"} Password</Modal.Title>
                </Modal.Header>
                {!hasPasswordProvider && <Modal.Body>
                    You can create a password here if you would like to sign in with your email and password, instead of just signing in with {defaultProviderId}.
                </Modal.Body>}
                <div className="form-group px-3">
                    <label htmlFor="newPassword">New Password:</label>
                    <input
                        type="password"
                        className="form-control mb-2"
                        id="newPassword"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordError("");
                        }}
                    />
                    <label htmlFor="confirmNewPassword">Confirm New Password:</label>
                    <input
                        type="password"
                        className="form-control"
                        id="confirmNewPassword"
                        value={passwordConfirmed}
                        onChange={(e) => {
                            setPasswordConfirmed(e.target.value);
                            setPasswordError("");
                        }}
                    />
                </div>
                {passwordError && <div className="mt-3 alert alert-warning mx-3">
                    <p>
                        <strong>{passwordError}</strong>
                    </p>
                </div>}
                <Modal.Footer>
                    {waiting && <LoadingElipses />}
                    <Button variant="secondary" onClick={closePasswordChange}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handlePasswordChange}>
                        Change Password
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showingUpdateEmail} onHide={closeUpdateEmail}>
                <Modal.Header closeButton>
                    <Modal.Title>Update Email</Modal.Title>
                </Modal.Header>
                <div className="form-group px-3 mt-3">
                    <label htmlFor="newEmail">New Email:</label>
                    <input
                        type="email"
                        className="form-control mb-2"
                        id="newEmail"
                        value={newEmail}
                        onChange={(e) => {
                            setNewEmail(e.target.value);
                            setUpdateEmailError("");
                        }}
                    />
                </div>
                {updateEmailError && <div className="mt-3 alert alert-warning mx-3">
                    <p>
                        <strong>{updateEmailError}</strong>
                    </p>
                </div>}
                <Modal.Footer>
                    {waiting && <LoadingElipses />}
                    <Button variant="secondary" onClick={closeUpdateEmail}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleUpdateEmail}>
                        Update Email
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Account;