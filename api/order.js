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
    const orderData = req.body;

    if (!orderData || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Add server-side timestamp
    const finalOrder = {
      ...orderData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    };

    const docRef = await db.collection('orders').add(finalOrder);
    
    res.status(200).json({ 
      success: true, 
      orderId: docRef.id,
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('API Order Error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
};
