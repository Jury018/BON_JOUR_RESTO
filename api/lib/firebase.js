const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    // In production (Vercel), we'll use an environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let saContent = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      // Remove accidental variable prefix
      if (saContent.startsWith('FIREBASE_SERVICE_ACCOUNT=')) {
        saContent = saContent.replace('FIREBASE_SERVICE_ACCOUNT=', '');
      }
      // Remove leading/trailing single or double quotes frequently found in .env files
      saContent = saContent.replace(/^['"]|['"]$/g, '');
      
      const sa = JSON.parse(saContent);
      // Fix for illegal newline characters in private key
      if (sa.private_key && typeof sa.private_key === 'string') {
        sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(sa)
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
