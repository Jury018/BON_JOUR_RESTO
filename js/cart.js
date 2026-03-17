document.addEventListener('DOMContentLoaded', () => {
  console.log('cart.js script loaded successfully.');

  // Check if cart is empty - redirect if nothing to show
  const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
  if (cart.length === 0 && window.location.pathname.includes('cart.html')) {
    window.location.href = 'foodmenu.html';
    return;
  }

  // Initialize cart
  initializeCart();

  function initializeCart() {
    // Only show the floating cart icon on the foodmenu.html page
    if (!window.location.pathname.includes('foodmenu.html')) {
        console.log('Floating cart icon disabled for this page.');
        return;
    }

    // Create Cart Icon
    const cartIcon = document.createElement('div');
    cartIcon.id = 'cartIcon';
    Object.assign(cartIcon.style, {
      position: 'fixed',
      top: '50%',
      right: '20px',
      width: '60px',
      height: '60px',
      backgroundColor: '#ff0000',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '1000',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    });
    cartIcon.innerHTML = '<i class="fas fa-shopping-cart" style="color: white; font-size: 1.8em;"></i>';

    // Create Cart Badge
    const cartBadge = document.createElement('span');
    cartBadge.id = 'cartBadge';
    Object.assign(cartBadge.style, {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      backgroundColor: '#fff',
      color: '#ff0000',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'none', // Hidden by default
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.8em',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      border: '2px solid #ff0000'
    });
    cartIcon.appendChild(cartBadge);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'cartTooltip';
    tooltip.textContent = 'View Cart';
    Object.assign(tooltip.style, {
      position: 'absolute',
      bottom: '70px',
      right: '0',
      backgroundColor: '#333',
      color: '#fff',
      padding: '5px 10px',
      borderRadius: '5px',
      fontSize: '0.9em',
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
    });
    cartIcon.appendChild(tooltip);

    // Draggable
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    // Cart Popup
    const cartPopup = document.createElement('div');
    cartPopup.id = 'cartPopup';
    Object.assign(cartPopup.style, {
      width: '200px',
      height: 'auto',
      position: 'absolute',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 0.3s ease',
      zIndex: '1000',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '10px',
    });
    cartPopup.innerHTML = `
      <div style="padding: 15px; background-color: #ff0000; color: white; font-size: 1.1em; font-weight: bold; text-align: center;">
        <span id="greeting">Your Orders</span>
      </div>
      <div style="padding: 20px; overflow-y: auto; max-height: 300px;">
        <ul id="cartItems" style="list-style: none; padding: 0; margin: 0;"></ul>
      </div>
      <div style="padding: 15px; border-top: 1px solid #eee; text-align: center;">
        <button id="viewFullCart" class="btn btn-danger w-100 fw-bold shadow-sm" style="border-radius: 20px;">
          Go to Cart & Checkout <i class="fas fa-arrow-right ms-2"></i>
        </button>
      </div>
    `;
    document.body.appendChild(cartPopup);

    // Function to update the cart popup position relative to the cart icon
    function updateCartPopupPosition() {
      const cartIconRect = cartIcon.getBoundingClientRect();
      const popupWidth = cartPopup.offsetWidth || 250;
      cartPopup.style.position = 'fixed';
      cartPopup.style.top = `${cartIconRect.top}px`;
      
      // If icon is on the left half of the screen, show popup on the right
      // Otherwise, show popup on the left
      if (cartIconRect.left < window.innerWidth / 2) {
        cartPopup.style.left = `${cartIconRect.right + 10}px`;
        cartPopup.style.borderRadius = '0 10px 10px 10px';
      } else {
        cartPopup.style.left = `${cartIconRect.left - popupWidth - 10}px`;
        cartPopup.style.borderRadius = '10px 0 10px 10px';
      }
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
        updateCartPopupPosition(); // Position the popup dynamically
        cartPopup.style.opacity = '1';
        cartPopup.style.pointerEvents = 'auto';
        updateCartPopup();
      }
    });

    const viewFullCartBtn = document.getElementById('viewFullCart');
    if (viewFullCartBtn) {
      viewFullCartBtn.addEventListener('click', () => {
        window.location.href = 'cart.html';
      });
    }

    // Greeting - simplified to always show guest (no Supabase auth)
    const greeting = document.getElementById('greeting');
    greeting.textContent = 'Good day Customer!';

    // Cart UI update using localStorage
    const updateCartPopup = () => {
      const cartItemsList = document.getElementById('cartItems');
      const badge = document.getElementById('cartBadge');
      if (!cartItemsList) return;
      cartItemsList.innerHTML = '';
      
      const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
      
      // Update Badge
      if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        if (totalItems > 0) {
          badge.textContent = totalItems;
          badge.style.display = 'flex';
          
          // Add animate class for attention
          badge.classList.remove('pulse-animation');
          void badge.offsetWidth;
          badge.classList.add('pulse-animation');
        } else {
          badge.style.display = 'none';
        }
      }

      if (cart.length === 0) {
        cartItemsList.innerHTML = '<li style="text-align:center;color:#666;padding:20px;">Your cart is empty.</li>';
        const viewBtn = document.getElementById('viewFullCart');
        if (viewBtn) viewBtn.disabled = true;
        return;
      }
      
      const viewBtn = document.getElementById('viewFullCart');
      if (viewBtn) viewBtn.disabled = false;
      
      cart.forEach(item => {
        const listItem = document.createElement('li');
        listItem.style.padding = '8px 0';
        listItem.style.borderBottom = '1px solid #eee';
        listItem.style.fontSize = '0.9em';
        listItem.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:500;">${item.name}</span>
            <span style="color:#ff0000; font-weight:bold;">x${item.quantity}</span>
          </div>
          <div style="text-align:right; font-size:0.85em; color:#888;">₱${(item.price * item.quantity).toFixed(2)}</div>
        `;
        cartItemsList.appendChild(listItem);
      });
    };

    // Expose updateCartPopup globally
    window.updateCartPopup = updateCartPopup;

    // Update cart summary totals using localStorage
    const updateCartSummary = () => {
      const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
      let subtotal = 0;
      cart.forEach(item => {
        subtotal += item.price * item.quantity;
      });
      const subtotalEl = document.getElementById('cart-subtotal');
      const totalEl = document.getElementById('cart-total');
      if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
      if (totalEl) totalEl.textContent = `₱${subtotal.toFixed(2)}`;
    };

    // Mobile responsive
    const handleResize = () => {
      if (window.innerWidth < 768) {
        cartPopup.style.width = '100%';
        cartPopup.style.borderRadius = '0';
      } else {
        cartPopup.style.width = '400px';
        cartPopup.style.borderRadius = '10px 0 0 10px';
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    document.body.appendChild(cartIcon);
    updateCartPopup();

    // Render editable cart items on main cart.html page
    const cartContainer = document.getElementById('cart-container');

    if (cartContainer) {
      const cartSubtotal = document.getElementById('cart-subtotal');
      const cartTotal = document.getElementById('cart-total');

      async function renderCartPageItems() {
        const cartItemsList = document.getElementById('cart-items');
        if (!cartItemsList) return;
        
        const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
        
        // Show skeletons briefly
        cartItemsList.innerHTML = Array(Math.max(cart.length, 1)).fill(`
          <li class="list-group-item">
            <div class="skeleton skeleton-text" style="width: 60%; display: inline-block;"></div>
            <div class="skeleton skeleton-text" style="width: 20%; float: right;"></div>
          </li>
        `).join('');

        // Small delay to simulate "loading" sensation for UX consistency
        await new Promise(resolve => setTimeout(resolve, 500));

        if (cart.length === 0) {
          cartItemsList.innerHTML = '<li class="list-group-item text-center text-muted fade-in">Your cart is empty.</li>';
          if (cartSubtotal) cartSubtotal.textContent = '₱0.00';
          if (cartTotal) cartTotal.textContent = '₱0.00';
          return;
        }

        cartItemsList.innerHTML = '';
        cart.forEach((item, index) => {
          const listItem = document.createElement('li');
          listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

          const nameSpan = document.createElement('span');
          nameSpan.textContent = item.name;
          nameSpan.style.flex = '2';

          const quantityInput = document.createElement('input');
          quantityInput.type = 'number';
          quantityInput.min = '1';
          quantityInput.value = item.quantity;
          quantityInput.style.width = '60px';
          quantityInput.className = 'form-control form-control-sm mx-2';
          quantityInput.addEventListener('change', (e) => {
            const newQuantity = parseInt(e.target.value);
            if (isNaN(newQuantity) || newQuantity < 1) {
              e.target.value = item.quantity;
              return;
            }
            const updatedCart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
            updatedCart[index].quantity = newQuantity;
            localStorage.setItem('resto_cart', JSON.stringify(updatedCart));
            if (window.FirebaseBridge) window.FirebaseBridge.syncCartToFirebase(updatedCart);
            updateCartPopup();
            updateCartSummary();
            renderCartPageItems();
          });

          const priceSpan = document.createElement('span');
          priceSpan.textContent = `₱${(item.price * item.quantity).toFixed(2)}`;
          priceSpan.style.flex = '1';
          priceSpan.className = 'text-end';

          const removeBtn = document.createElement('button');
          removeBtn.className = 'btn btn-sm btn-outline-danger ms-2';
          removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
          removeBtn.addEventListener('click', () => {
            const updatedCart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
            updatedCart.splice(index, 1);
            localStorage.setItem('resto_cart', JSON.stringify(updatedCart));
            if (window.FirebaseBridge) window.FirebaseBridge.syncCartToFirebase(updatedCart);
            updateCartPopup();
            updateCartSummary();
            renderCartPageItems();
          });

          listItem.appendChild(nameSpan);
          listItem.appendChild(quantityInput);
          listItem.appendChild(priceSpan);
          listItem.appendChild(removeBtn);

          cartItemsList.appendChild(listItem);
        });

        // Update totals
        updateCartSummary();
      }

      renderCartPageItems();
    }

    // Add event listener for proceed to checkout button
    const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');
    if (proceedToCheckoutBtn) {
      proceedToCheckoutBtn.addEventListener('click', proceedToCheckout);
    }

    // Add event listener for back to menu button
    const backToMenuBtn = document.getElementById('back-to-menu');
    if (backToMenuBtn) {
      backToMenuBtn.addEventListener('click', () => {
        window.location.href = 'foodmenu.html';
      });
    }
  }
});

function proceedToCheckout() {
  const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
  if (cart.length === 0) {
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
              <p>Your cart is empty. Please add items before proceeding to checkout.</p>
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
    return;
  }

  // Check for authenticated session (not guest)
  const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('resto_session='));
  const sessionValue = sessionCookie ? sessionCookie.split('=')[1] : null;

  if (sessionValue !== 'true') {
    // User is guest or not logged in, show authentication required modal
    const authModalElem = document.getElementById('authRequiredModal');
    if (authModalElem) {
      const authModal = new bootstrap.Modal(authModalElem);
      authModal.show();
    } else {
      // Fallback if modal not present (shouldn't happen on cart.html)
      window.location.href = 'login.html';
    }
    return;
  }

  // Redirect to checkout page for authenticated users
  window.location.href = 'checkout.html';
}