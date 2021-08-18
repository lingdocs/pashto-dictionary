import firebase from "firebase/app";
import "firebase/auth";

// Configure Firebase.
const config = {
    apiKey: "AIzaSyDZrG2BpQi0MGktEKXL6mIWeAYEn_gFacw",
    authDomain: "lingdocs.firebaseapp.com",
    projectId: "lingdocs",
};

firebase.initializeApp(config);

export const authUiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: "popup",
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebase.auth.GithubAuthProvider.PROVIDER_ID,
      // twitter auth is set up, but not using because it doesn't provide an email
      // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      // Avoid redirects after sign-in.
      signInSuccessWithAuthResult: () => false,
    },
};

export const auth = firebase.auth();

