import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
    try {
        // Read service account from file
        const serviceAccountPath = resolve(__dirname, '../../firebase-service-account.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || 'ocr-splitter',
        });

        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Firebase Admin:', error);
        throw error;
    }
}

// Initialize on module load
initializeFirebase();

/**
 * Firestore database instance
 */
export const db = admin.firestore();

/**
 * Firebase Admin instance
 */
export default admin;
