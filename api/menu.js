const { db } = require('./lib/firebase');

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
    const snapshot = await db.collection('menu').get();
    const menu = [];
    snapshot.forEach(doc => {
      menu.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(menu);
  } catch (error) {
    console.error('API Menu Error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
};
