document.addEventListener('DOMContentLoaded', async () => {
  // Fetch menu items from Supabase and update HTML
  async function syncMenuWithSupabase() {
    const { data: menuItems, error } = await window.supabase
      .from('menu')
      .select('*');
    if (error) {
      console.error('Error fetching menu from Supabase:', error.message);
      return;
    }
    if (!menuItems || menuItems.length === 0) return;

    // For each menu item in Supabase, find matching .menu-item in HTML and update
    menuItems.forEach(item => {
      // Try to match by name (case-insensitive)
      const menuItemEls = Array.from(document.querySelectorAll('.menu-item'));
      const match = menuItemEls.find(el => {
        const h3 = el.querySelector('h3');
        return h3 && h3.textContent.trim().toLowerCase() === item.name.trim().toLowerCase();
      });
      if (match) {
        // Update image if available
        if (item.image_url) {
          const img = match.querySelector('img');
          if (img) img.src = item.image_url;
        }
        // Update name
        const h3 = match.querySelector('h3');
        if (h3) h3.textContent = item.name;
        // Update description
        const desc = match.querySelector('p');
        if (desc) desc.textContent = item.description;
        // Update price (second p)
        const priceP = match.querySelectorAll('p')[1];
        if (priceP) priceP.textContent = `₱${item.price}`;
      }
    });
  }

  // Run sync on page load
  await syncMenuWithSupabase();
  // Optionally, rerun sync if you want live updates (e.g., setInterval)

  // Add-to-cart logic using Supabase
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      const menuItem = e.target.closest('.menu-item');
      const itemName = menuItem.querySelector('h3')?.textContent || 'Unnamed';
      const itemPrice = (menuItem.querySelector('p:nth-of-type(2)')?.textContent || '').replace('₱', '');
      // Get user or guest
      const user = window.supabase?.auth.getUser ? (await window.supabase.auth.getUser()).data.user : null;
      let guestId = null;
      if (!user) {
        guestId = sessionStorage.getItem('guest_id');
        if (!guestId) {
          guestId = crypto.randomUUID();
          sessionStorage.setItem('guest_id', guestId);
        }
      }
      // Find or create order
      let order;
      if (user) {
        const { data: orders } = await window.supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        order = orders && orders[0];
      } else {
        const { data: orders } = await window.supabase
          .from('orders')
          .select('*')
          .eq('guest_id', guestId)
          .order('created_at', { ascending: false });
        order = orders && orders[0];
      }
      if (!order) {
        // Create new order
        const { data: newOrder, error: orderError } = await window.supabase
          .from('orders')
          .insert([{ user_id: user?.id || null, guest_id: guestId, order_data: {}, created_at: new Date().toISOString() }])
          .select();
        if (orderError) {
          alert('Error creating order: ' + orderError.message);
          return;
        }
        order = newOrder && newOrder[0];
      }
      // Check if item already exists in order_items
      const { data: existingItems } = await window.supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)
        .eq('item_name', itemName);
      if (existingItems && existingItems.length > 0) {
        // Update quantity
        const item = existingItems[0];
        await window.supabase
          .from('order_items')
          .update({ quantity: item.quantity + 1 })
          .eq('id', item.id);
      } else {
        // Insert new item
        await window.supabase
          .from('order_items')
          .insert([{ order_id: order.id, item_name: itemName, quantity: 1, price: parseFloat(itemPrice) || 0, created_at: new Date().toISOString() }]);
      }
      // Animation
      menuItem.style.animation = 'addToCart 0.5s ease';
      menuItem.addEventListener('animationend', () => {
        menuItem.style.animation = '';
      });
      // Trigger cart update if cart.js is loaded
      if (window.updateCartPopup) {
        await window.updateCartPopup();
      }
    }
  });

  // Add event listeners to nav links to check cart before navigation
  const navLinks = document.querySelectorAll('nav a.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      // Get user or guest
      const user = window.supabase?.auth.getUser ? (await window.supabase.auth.getUser()).data.user : null;
      let guestId = null;
      if (!user) {
        guestId = sessionStorage.getItem('guest_id');
        if (!guestId) {
          guestId = crypto.randomUUID();
          sessionStorage.setItem('guest_id', guestId);
        }
      }
      // Find order
      let order;
      if (user) {
        const { data: orders } = await window.supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        order = orders && orders[0];
      } else {
        const { data: orders } = await window.supabase
          .from('orders')
          .select('*')
          .eq('guest_id', guestId)
          .order('created_at', { ascending: false });
        order = orders && orders[0];
      }
      // Get cart items
      let cartItems = [];
      if (order) {
        const { data: items } = await window.supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        cartItems = items || [];
      }
      // Allow navigation if the link is to index.html (Home)
      if (link.getAttribute('href') === 'index.html') {
        return;
      }
      if (!cartItems || cartItems.length === 0) {
        e.preventDefault();
        // Show modal popup that cart is empty
        const modalHtml = `
          <div class="modal fade" id="emptyCartModal" tabindex="-1" aria-labelledby="messageModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="messageModalLabel">No Orders Yet</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <p>Your cart is empty. Please add items before navigating away.</p>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
              </div>
            </div>
          </div>
        `;
        if (!document.getElementById('emptyCartModal')) {
          const div = document.createElement('div');
          div.innerHTML = modalHtml;
          document.body.appendChild(div.firstElementChild);
        }
        const emptyCartModal = new bootstrap.Modal(document.getElementById('emptyCartModal'));
        emptyCartModal.show();
      }
    });
  });
});
