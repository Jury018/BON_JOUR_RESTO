const { db } = require('./lib/firebase');
const logger = require('./lib/logger');

module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.log('Fetching menu items from Firestore...');
    const snapshot = await db.collection('menu').get();
    
    if (snapshot.empty) {
      logger.log('No menu items found in Firestore.');
      return res.status(200).json([]);
    }

    const menu = [];
    snapshot.forEach(doc => {
      menu.push({ id: doc.id, ...doc.data() });
    });

    logger.log(`Successfully fetched ${menu.length} menu items.`);
    res.status(200).json(menu);
  } catch (error) {
    logger.error('API Menu Error Details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ error: 'Failed to fetch menu', details: error.message });
  }
};
