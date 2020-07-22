import * as firebase from "firebase/app"
import { Config } from "@web/config";
import { setTimestamp } from "@shared/util/FirestoreUtil";
import "firebase/functions"
import "firebase/firestore";
import "firebase/auth";
import "firebase/storage";
import "firebase/analytics";

import flamelink from "flamelink/app";
import 'flamelink/content'
import 'flamelink/storage'
import StorageService, { LocalStorageKey } from "@web/services/StorageService";
import FirebaseApp = firebase.app.App;
import CopyService, { LocaleCode } from "@shared/copy/CopyService";
import Logger from "@shared/Logger"

const logger = new Logger("firebase");


let isInitialized = false;
let firebaseApp: FirebaseApp;
let flamelinkApp: flamelink.app.App;
export type FirebaseUser = firebase.User;
export type FirebaseUserCredential = firebase.auth.UserCredential;
export type Unsubscribe = firebase.Unsubscribe;
export type AdditionalUserInfo = firebase.auth.AdditionalUserInfo;

export import GoogleProvider = firebase.auth.GoogleAuthProvider;
export import FacebookProvider = firebase.auth.FacebookAuthProvider;
export import TwitterProvider = firebase.auth.TwitterAuthProvider;
export import EmailProvider = firebase.auth.EmailAuthProvider;
export import PhoneProvider = firebase.auth.PhoneAuthProvider;
export import OAuthProvider = firebase.auth.OAuthProvider;

export enum FirebaseAppName {
    flamelink = "flamelink",
}

export enum EmailActionMode {
    resetPassword = "resetPassword",
    recoverEmail = "recoverEmail",
    verifyEmail = "verifyEmail",
    signIn = "signIn",
}

export function initializeFirebase(): FirebaseObject {

    if (!isInitialized) {
        logger.info("initializing firebase");
        setTimestamp(firebase.firestore.Timestamp);
        firebaseApp = firebase.initializeApp(Config.firebase); //this is the default app, used in all the services

        const envOverride = StorageService.getItem(LocalStorageKey.flamelinkEnvironmentOverride);
        const localeCode = LocaleCode.en_US;
        const flamelinkFirebaseApp = firebase.initializeApp(Config.flamelinkFirebaseConfig, FirebaseAppName.flamelink); //this is the flamelink version
        flamelinkApp = flamelink({
            firebaseApp: flamelinkFirebaseApp, // required
            dbType: 'cf', // can be either 'rtdb' or 'cf' for Realtime DB or Cloud Firestore
            env: envOverride || Config.flamelinkEnvironmentId, // optional, default shown
            locale: localeCode,
            precache: true // optional, default shown. Currently it only precaches "schemas" for better performance
        });
        firebaseApp.analytics();
        CopyService.initialize({ locale: localeCode });
        firebase.firestore().settings({ ignoreUndefinedProperties: true });
        isInitialized = true;
    }

    return firebase;
}


export function getFlamelink(): flamelink.app.App {
    initializeFirebase();
    return flamelinkApp;
}

export function getAuth(): firebase.auth.Auth {
    return getFirebase().auth();
}

export function getFirestore(): firebase.firestore.Firestore {
    return getFirebase().firestore();
}

export function getFirebase() {
    initializeFirebase();
    return firebaseApp;
}

export function firebaseAnalytics(): firebase.analytics.Analytics {
    return getFirebase().analytics();
}