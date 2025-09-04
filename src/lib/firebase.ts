import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2JCTwEYku-QYUrEHH7cOZCp43O_gtqnk",
  authDomain: "justdo-todo.firebaseapp.com",
  projectId: "justdo-todo",
  storageBucket: "justdo-todo.firebasestorage.app",
  messagingSenderId: "856727708170",
  appId: "1:856727708170:web:aac4984d032b4ac85b35f3",
  measurementId: "G-98HETEPJ44",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
