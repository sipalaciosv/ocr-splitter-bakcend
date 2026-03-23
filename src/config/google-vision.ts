import vision from '@google-cloud/vision';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve path relative to compiled file (dist/config/google-vision.js)
// Go up 2 levels: config/ → dist/ → app root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.resolve(__dirname, '../../firebase-service-account.json');

console.log('🔑 Credentials path:', credentialsPath);

/**
 * Google Cloud Vision API client
 */
export const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: credentialsPath,
});

console.log('✅ Google Cloud Vision client initialized');

export default visionClient;
