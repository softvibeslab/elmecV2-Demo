/**
 * Firebase Configuration for ELMEC V2
 *
 * Hybrid Architecture:
 * - Supabase: Authentication, Users, Requests, Direct Chats
 * - Firebase: Group Chats (Realtime DB), Push Notifications (FCM), Crashlytics
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCxRVxaBrRpUIYB8rw4apRc0PAF-99eBs0',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'elmec-3ae55.firebaseapp.com',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://elmec-3ae55-default-rtdb.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'elmec-3ae55',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'elmec-3ae55.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '62591188963',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:62591188963:web:ae989e006edc01797baad6',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-F8VHKPEKK5',
};

// Initialize Firebase (singleton pattern)
let firebaseApp: FirebaseApp | null = null;
let database: Database | null = null;
let analytics: Analytics | null = null;

export const initializeFirebase = (): FirebaseApp => {
  if (!firebaseApp) {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }
    console.log('[Firebase] Initialized successfully');
  }
  return firebaseApp;
};

export const getFirebaseDatabase = (): Database => {
  if (!database) {
    const app = initializeFirebase();
    database = getDatabase(app);
    console.log('[Firebase] Realtime Database connected');
  }
  return database;
};

export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (!analytics && Platform.OS === 'web') {
    try {
      const supported = await isSupported();
      if (supported) {
        const app = initializeFirebase();
        analytics = getAnalytics(app);
        console.log('[Firebase] Analytics initialized');
      }
    } catch (error) {
      console.warn('[Firebase] Analytics not supported:', error);
    }
  }
  return analytics;
};

// Export configuration for validation
export const getFirebaseConfig = () => firebaseConfig;

// Check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.databaseURL
  );
};

export default {
  initializeFirebase,
  getFirebaseDatabase,
  getFirebaseAnalytics,
  getFirebaseConfig,
  isFirebaseConfigured,
};
