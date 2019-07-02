// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/sign_up.scss"
import * as firebase from "firebase/app";
import "firebase/auth";
import * as firebaseui from "firebaseui";
import {Config} from "@web/config";

// const SignupApp =

document.addEventListener('DOMContentLoaded', () => {
    console.log("sign_up loaded");


    const app = firebase.initializeApp(Config.firebase);



    var uiConfig = {
        signInSuccessUrl: '/',
        signInFlow: 'popup',
        credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            // firebase.auth.GithubAuthProvider.PROVIDER_ID,
            // firebase.auth.EmailAuthProvider.PROVIDER_ID,
            // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
            // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
            {
                provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                // Use email link authentication and do not require password.
                // Note this setting affects new users only.
                // For pre-existing users, they will still be prompted to provide their
                // passwords on sign-in.
                signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
                // Allow the user the ability to complete sign-in cross device, including
                // the mobile apps specified in the ActionCodeSettings object below.
                forceSameDevice: false,
                // Used to define the optional firebase.auth.ActionCodeSettings if
                // additional state needs to be passed along request and whether to open
                // the link in a mobile app if it is installed.
                emailLinkSignIn: function() {
                    return {
                        // Additional state showPromo=1234 can be retrieved from URL on
                        // sign-in completion in signInSuccess callback by checking
                        // window.location.href.
                        url: `${Config.apiDomain}/sign-up-success?showPromo=1234`,
                        // Custom FDL domain.
                        dynamicLinkDomain: 'example.page.link',
                        // Always true for email link sign-in.
                        handleCodeInApp: true,
                        // Whether to handle link in iOS app if installed.
                        // iOS: {
                        //     bundleId: 'com.example.ios'
                        // },
                        // Whether to handle link in Android app if opened in an Android
                        // device.
                        android: {
                            packageName: 'com.example.android',
                            installApp: true,
                            minimumVersion: '12'
                        }
                    };
                }
            }
        ],
        // tosUrl and privacyPolicyUrl accept either url string or a callback
        // function.
        // Terms of service url/callback.
        tosUrl: 'https://www.kinecho.com/terms-of-service',
        // Privacy policy url/callback.
        privacyPolicyUrl: function() {
            window.location.assign('https://kinecho.com/policies/privacy');
        }
    };

    // Initialize the FirebaseUI Widget using Firebase.
    const ui = new firebaseui.auth.AuthUI(firebase.auth());
    // The start method will wait until the DOM is loaded.
    ui.start('#signup-app', uiConfig);

});
