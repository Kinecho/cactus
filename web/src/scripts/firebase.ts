import * as firebase from "firebase/app"
import {Config} from "@web/config";
import {setTimestamp} from "@shared/util/FirestoreUtil";
import "firebase/functions"
import "firebase/firestore";
import "firebase/auth";



let isInitialized = false;
let firebaseApp: firebase.app.App;

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

        isInitialized = true;
    }

    return firebase;

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