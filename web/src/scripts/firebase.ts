import * as firebase from "firebase/app"
import {Config} from "@web/config";
import "firebase/functions"
import "firebase/firestore";
import "firebase/auth";
let isInitialized = false;
let firebaseApp:firebase.app.App;

export function initializeFirebase():FirebaseObject{
    if (!isInitialized){
        firebaseApp = firebase.initializeApp(Config.firebase);
        isInitialized = true;
    }

    return firebase;

}

export function getAuth():firebase.auth.Auth {
    initializeFirebase();
    return firebase.auth();
}

export function getFirestore():firebase.firestore.Firestore {
    initializeFirebase();
    return firebase.firestore();
}

export function getStorage():firebase.storage.Storage {
    initializeFirebase();
    return firebase.storage();
}

export function getFirebase(){
    initializeFirebase();
    return firebase;
}