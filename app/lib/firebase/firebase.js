// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3sx1FyBNfJ5c_zPhPtCRhLcjiU-FCHK8",
  authDomain: "qmss-91e0f.firebaseapp.com",
  projectId: "qmss-91e0f",
  storageBucket: "qmss-91e0f.firebasestorage.app",
  messagingSenderId: "74979323846",
  appId: "1:74979323846:web:35eff0add880efc5970cc7",
  measurementId: "G-X6N0STXSP2"
};


export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();