import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const url = import.meta.env.VITE_FIREBASE_DB_URL;

// Without a database URL the app runs in demo mode.
export const hasDb = Boolean(url && url.startsWith("https://"));
export const db = hasDb ? getDatabase(initializeApp({ databaseURL: url })) : null;
