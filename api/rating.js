const { db, admin, auth } = require('./lib/firebase');
const logger = require('./lib/logger');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ─── Verify Firebase ID Token ───
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  let decodedToken;

  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const verifiedUid = decodedToken.uid;
  const isGuest = decodedToken.firebase.sign_in_provider === 'anonymous';

  try {
    const { rating, comment, userName } = req.body;

    if (!rating) {
      return res.status(400).json({ error: 'Rating is required' });
    }

    const review = {
      rating: Number(rating),
      comment: comment || '',
      userId: verifiedUid,           // From verified token
      userName: userName || (isGuest ? 'Guest' : 'User'),
      isGuest: isGuest,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('ratings').add(review);
    
    logger.log(`Rating submitted by ${isGuest ? 'guest' : 'user'} ${verifiedUid}: ${rating}/5`);
    res.status(200).json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    logger.error('API Rating Error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};
