import { setTimestamp } from "@shared/util/FirestoreUtil";
import * as firebase from "firebase";

setTimestamp(firebase.firestore.Timestamp);