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

  // ─── 1. Verify Firebase ID Token ───
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

  // Extract trusted user info from verified token
  const verifiedUid = decodedToken.uid;
  const isGuest = decodedToken.firebase.sign_in_provider === 'anonymous';

  try {
    const orderData = req.body;

    if (!orderData || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // ─── 2. Server-Side Price Recalculation ───
    // Fetch all menu items from Firestore to get trusted prices
    const menuSnapshot = await db.collection('menu').get();
    const menuPrices = {};
    menuSnapshot.forEach(doc => {
      const data = doc.data();
      menuPrices[data.name] = parseFloat(data.price);
    });

    let serverTotal = 0;
    const verifiedItems = [];

    for (const item of orderData.items) {
      const trustedPrice = menuPrices[item.name];

      if (trustedPrice === undefined) {
        return res.status(400).json({ error: `Item not found in menu: ${item.name}` });
      }

      const quantity = parseInt(item.quantity) || 1;
      serverTotal += trustedPrice * quantity;

      verifiedItems.push({
        name: item.name,
        price: trustedPrice,       // Use server-side price, NOT client price
        quantity: quantity
      });
    }

    // ─── 3. Apply Coupon Server-Side ───
    let discount = 0;
    if (orderData.payment && orderData.payment.couponCode) {
      const coupon = orderData.payment.couponCode.toUpperCase();
      if (coupon === 'DISCOUNT10') {
        discount = serverTotal * 0.1;
      }
      // Invalid coupons are simply ignored (no discount applied)
    }

    const finalTotal = serverTotal - discount;

    // ─── 4. Build Secure Order ───
    const finalOrder = {
      customer: orderData.customer || {},
      payment: {
        method: orderData.payment?.method || 'unknown',
        couponCode: orderData.payment?.couponCode || '',
        discountApplied: discount
      },
      items: verifiedItems,
      totalAmount: finalTotal,           // Server-calculated, tamper-proof
      userId: verifiedUid,               // From verified token, not client
      isGuest: isGuest,                  // From verified token, not client
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    };

    const docRef = await db.collection('orders').add(finalOrder);
    
    logger.log(`Order ${docRef.id} placed by ${isGuest ? 'guest' : 'user'} ${verifiedUid} | Total: ₱${finalTotal.toFixed(2)}`);

    res.status(200).json({ 
      success: true, 
      orderId: docRef.id,
      serverTotal: finalTotal,
      message: 'Order placed successfully'
    });
  } catch (error) {
    logger.error('API Order Error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
};
