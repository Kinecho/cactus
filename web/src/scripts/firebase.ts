import * as firebase from "firebase/app"
import {Config} from "@web/config";
import {setTimestamp} from "@shared/util/FirestoreUtil";
import "firebase/functions"
import "firebase/firestore";
import "firebase/auth";
import "firebase/storage";


import flamelink from "flamelink/app";
import 'flamelink/content'
import 'flamelink/storage'

let isInitialized = false;
let firebaseApp: firebase.app.App;
let flamelinkApp: flamelink.app.App;

export type FirebaseUser = firebase.User;
export type FirebaseUserCredential = firebase.auth.UserCredential;
export type Unsubscribe = firebase.Unsubscribe;

export enum EmailActionMode {
    resetPassword = "resetPassword",
    recoverEmail = "recoverEmail",
    verifyEmail = "verifyEmail",
}

export function initializeFirebase(): FirebaseObject {
    if (!isInitialized) {
        setTimestamp(firebase.firestore.Timestamp);
        firebaseApp = firebase.initializeApp(Config.firebase);

        flamelinkApp = flamelink({
            firebaseApp, // required
            dbType: 'cf', // can be either 'rtdb' or 'cf' for Realtime DB or Cloud Firestore
            env: 'production', // optional, default shown
            locale: 'en-US', // optional, default shown
            precache: true // optional, default shown. Currently it only precaches "schemas" for better performance
        });

        isInitialized = true;
    }

    return firebase;

}

export function getFlamelink(): flamelink.app.App {
    initializeFirebase();
    return flamelinkApp;
}

export function getAuth(): firebase.auth.Auth {
    initializeFirebase();
    return firebase.auth();
}

export function getFirestore(): firebase.firestore.Firestore {
    initializeFirebase();
    return firebase.firestore();
}

export function getStorage(): firebase.storage.Storage {
    initializeFirebase();
    return firebase.storage();
}

export function getFirebase() {
    initializeFirebase();
    return firebase;
}