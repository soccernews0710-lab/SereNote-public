// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDfuYqm4pYlwQyD-yYZs5X0OJyygjY2mak",
  authDomain: "serenote-31f35.firebaseapp.com",
  projectId: "serenote-31f35",
  storageBucket: "serenote-31f35.firebasestorage.app",
  messagingSenderId: "517672074688",
  appId: "1:517672074688:web:8c19790a199480f07e5c25"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);