const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    // In production (Vercel), we'll use an environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
      });
    } else {
      // In local development, we fallback to the JSON file
      const serviceAccount = require('../../bon-jour-base-firebase-adminsdk-ri7yq-e8c53de4f6.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.stack);
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
