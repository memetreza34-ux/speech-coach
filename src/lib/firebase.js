import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "laughing-technique-w53bd",
  appId: "1:185741804854:web:921d81bca9e25f45731f97",
  apiKey: "AIzaSyBKBWn7PnkUfSpw-OF0d48yF4T017sg1mw",
  authDomain: "laughing-technique-w53bd.firebaseapp.com",
  storageBucket: "laughing-technique-w53bd.firebasestorage.app",
  messagingSenderId: "185741804854"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-speechcoach-a3524e75-2452-4cc3-b2c8-a766590f3df4");
export const googleProvider = new GoogleAuthProvider();
