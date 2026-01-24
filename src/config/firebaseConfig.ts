import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-NJYiCOPAOGIMSzsQfnoizKOiwQqIYgo",
  authDomain: "studymor-c2696.firebaseapp.com",
  projectId: "studymor-c2696",
  storageBucket: "studymor-c2696.firebasestorage.app",
  messagingSenderId: "891525237967",
  appId: "1:891525237967:web:6cc5bf34c3d896a31a3bba"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);