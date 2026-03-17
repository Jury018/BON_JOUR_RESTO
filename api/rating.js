const { db, admin } = require('./lib/firebase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rating, comment, userId, userName } = req.body;

    if (!rating) {
      return res.status(400).json({ error: 'Rating is required' });
    }

    const review = {
      rating: Number(rating),
      comment: comment || '',
      userId: userId || 'guest',
      userName: userName || 'Anonymous',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('ratings').add(review);
    
    res.status(200).json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('API Rating Error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};
