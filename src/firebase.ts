// src/firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDfuYqm4pYlwQyD-yYZs5X0OJyygjY2mak',
  authDomain: 'serenote-31f35.firebaseapp.com',
  projectId: 'serenote-31f35',
  storageBucket: 'serenote-31f35.firebasestorage.app',
  messagingSenderId: '517672074688',
  appId: '1:517672074688:web:8c19790a199480f07e5c25',
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ RN 永続化つき Auth（失敗したら通常の getAuth にフォールバック）
export const auth = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (storage: any) => any;
    };

    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    console.warn('[firebase] initializeAuth (RN persistence) failed. Fallback to getAuth()', e);
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
export const storage = getStorage(app);