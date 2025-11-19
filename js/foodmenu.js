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
    
  
    async function checkFoodMenuAccess() {
      // Wait for Supabase auth state to be ready
      await new Promise(resolve => {
        const unsub = window.supabase.auth.onAuthStateChange(() => {
          unsub?.();
          resolve();
        });
        // Fallback: resolve after 500ms if no event
        // Supabase-driven menu and cart logic will be implemented here
        // ...existing code...
  });

  // Function to update the cart popup position relative to the cart icon
  function updateCartPopupPosition() {
    const cartIconRect = cartIcon.getBoundingClientRect();
    cartPopup.style.position = 'fixed'; // Ensure it stays relative to the viewport
    cartPopup.style.top = `${cartIconRect.top}px`;
    cartPopup.style.left = `${cartIconRect.left - cartPopup.offsetWidth}px`;
  }

  // Update cart popup position on scroll
  window.addEventListener('scroll', updateCartPopupPosition);

  // Update cart popup position on resize
  window.addEventListener('resize', updateCartPopupPosition);

  // Ensure the cart popup follows the cart icon dynamically on drag
  cartIcon.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - cartIcon.getBoundingClientRect().left;
    offsetY = e.clientY - cartIcon.getBoundingClientRect().top;
    cartIcon.style.transition = 'none';
    cartPopup.style.transition = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    cartIcon.style.left = `${newLeft}px`;
    cartIcon.style.top = `${newTop}px`;
    cartIcon.style.right = 'auto';

    // Update cart popup position to follow the cart icon
    updateCartPopupPosition();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    cartIcon.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    cartPopup.style.transition = 'opacity 0.3s ease, top 0.3s ease, left 0.3s ease';
  });

  // Ensure the cart popup follows the cart icon dynamically on touch move (swipe)
  cartIcon.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const newLeft = touch.clientX - cartIcon.offsetWidth / 2;
    const newTop = touch.clientY - cartIcon.offsetHeight / 2;
    cartIcon.style.left = `${newLeft}px`;
    cartIcon.style.top = `${newTop}px`;
    cartIcon.style.right = 'auto';

    // Update cart popup position to follow the cart icon
    updateCartPopupPosition();
  });

  // Cart Toggle
  cartIcon.addEventListener('click', () => {
    const isOpen = cartPopup.classList.contains('show');
    if (isOpen) {
      cartPopup.classList.remove('show');
      cartPopup.style.opacity = '0';
      cartPopup.style.pointerEvents = 'none';
    } else {
      cartPopup.classList.add('show');
      const cartIconRect = cartIcon.getBoundingClientRect();
      cartPopup.style.top = `${cartIconRect.top}px`;
      cartPopup.style.left = `${cartIconRect.left - cartPopup.offsetWidth}px`;
      cartPopup.style.opacity = '1';
      cartPopup.style.pointerEvents = 'auto';
      updateCartPopup();
    }
  });

  document.getElementById('maximizeCart').addEventListener('click', () => {
    window.location.href = 'cart.html';
  });

  document.getElementById('closeCart').addEventListener('click', () => {
    cartPopup.classList.remove('show');
    cartPopup.style.opacity = '0';
    cartPopup.style.pointerEvents = 'none';
  });

   // Greeting - simplified to always show guest (no Supabase auth)
  const greeting = document.getElementById('greeting');
  greeting.textContent = 'Good day Customer!';

  // Cart UI update from Supabase
  const updateCartPopup = async () => {
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
    const cartItemsList = document.getElementById('cartItems');
    cartItemsList.innerHTML = '';
    if (!cartItems || cartItems.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'Your cart is empty.';
      empty.style.textAlign = 'center';
      empty.style.color = '#666';
      cartItemsList.appendChild(empty);
      proceedToCartBtn.style.display = 'none';
    } else {
      cartItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.style.padding = '10px';
        listItem.style.borderBottom = '1px solid #ddd';
        listItem.textContent = `${item.item_name} x${item.quantity} - ₱${item.price}`;
        cartItemsList.appendChild(listItem);
      });
      proceedToCartBtn.style.display = 'block';
    }
  };

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
      await updateCartPopup();
      cartPopup.classList.add('show');
    }
  });

  // Mobile responsive
  const handleResize = () => {
    if (window.innerWidth < 768) {
      cartPopup.style.width = '100%';
      cartPopup.style.borderRadius = '0';
      proceedToCartBtn.style.width = 'calc(100% - 40px)';
      proceedToCartBtn.style.right = '10px';
      proceedToCartBtn.style.bottom = '70px';
      proceedToCartBtn.style.fontSize = '1.2rem';
      proceedToCartBtn.style.padding = '15px 0';
    } else {
      cartPopup.style.width = '400px';
      cartPopup.style.borderRadius = '8px 0 0 8px';
      proceedToCartBtn.style.width = 'auto';
      proceedToCartBtn.style.right = '20px';
      proceedToCartBtn.style.bottom = '80px';
      proceedToCartBtn.style.fontSize = '1rem';
      proceedToCartBtn.style.padding = '10px 20px';
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  document.body.appendChild(cartIcon);
  // Greeting is set above, no updateGreeting() function needed
  updateCartPopup();

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

  // No localStorage cart to clear on unload
});
