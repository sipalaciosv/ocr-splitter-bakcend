import vision from '@google-cloud/vision';

/**
 * Google Cloud Vision API client
 * Uses the same credentials as Firebase Admin SDK
 */
export const visionClient = new vision.ImageAnnotatorClient({
    // Credentials from GOOGLE_APPLICATION_CREDENTIALS env var
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

console.log('✅ Google Cloud Vision client initialized');

export default visionClient;
