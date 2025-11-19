document.addEventListener('DOMContentLoaded', () => {
  console.log('cart.js script loaded successfully.');

  // (Removed disabling of cart icon on cart.html page to ensure real-time functionality)

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
    <div style="padding: 20px; background-color: #ff0000; color: white; font-size: 1.2em; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
      <span id="greeting">Hello Guest</span>
      <div>
        <button id="maximizeCart" style="background: none; border: none; color: white; font-size: 1em; cursor: pointer; margin-right: 10px;">+</button>
        <button id="closeCart" style="background: none; border: none; color: white; font-size: 1em; cursor: pointer;">x</button>
      </div>
    </div>
    <div style="padding: 20px; overflow-y: auto; height: calc(100% - 60px);">
      <ul id="cartItems" style="list-style: none; padding: 0; margin: 0;"></ul>
    </div>
  `;
  document.body.appendChild(cartPopup);

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

  // Cart UI update
  const updateCartPopup = async () => {
    const cartItemsList = document.getElementById('cartItems');
    cartItemsList.innerHTML = '';
    let user = window.supabase?.auth.getUser ? (await window.supabase.auth.getUser()).data.user : null;
    let user_id = user ? user.id : null;
    let guest_id = null;
    if (!user_id) {
      guest_id = sessionStorage.getItem('guest_id');
      if (!guest_id) {
        guest_id = crypto.randomUUID();
        sessionStorage.setItem('guest_id', guest_id);
      }
    }
    // Get latest order for user/guest
    let orderQuery = window.supabase.from('orders').select('id').order('created_at', { ascending: false }).limit(1);
    if (user_id) {
      orderQuery = orderQuery.eq('user_id', user_id);
    } else {
      orderQuery = orderQuery.eq('guest_id', guest_id);
    }
    const { data: orderData, error: orderError } = await orderQuery;
    if (orderError || !orderData || orderData.length === 0) {
      cartItemsList.innerHTML = '<li style="text-align:center;color:#666;">Your cart is empty.</li>';
      return;
    }
    const orderId = orderData[0].id;
    // Get items for this order
    const { data: items, error: itemsError } = await window.supabase.from('order_items').select('*').eq('order_id', orderId);
    if (itemsError || !items || items.length === 0) {
      cartItemsList.innerHTML = '<li style="text-align:center;color:#666;">Your cart is empty.</li>';
      return;
    }
    items.forEach(item => {
      const listItem = document.createElement('li');
      listItem.style.padding = '10px';
      listItem.style.borderBottom = '1px solid #ddd';
      listItem.textContent = `${item.item_name} - ₱${item.price} x${item.quantity}`;
      cartItemsList.appendChild(listItem);
    });
  };

  // Expose updateCartPopup globally
  window.updateCartPopup = updateCartPopup;

  // Update cart summary totals (for cart.html page)
  const updateCartSummary = async () => {
    let user = window.supabase?.auth.getUser ? (await window.supabase.auth.getUser()).data.user : null;
    let user_id = user ? user.id : null;
    let guest_id = null;
    if (!user_id) {
      guest_id = sessionStorage.getItem('guest_id');
      if (!guest_id) {
        guest_id = crypto.randomUUID();
        sessionStorage.setItem('guest_id', guest_id);
      }
    }
    // Get latest order
    let orderQuery = window.supabase.from('orders').select('id').order('created_at', { ascending: false }).limit(1);
    if (user_id) {
      orderQuery = orderQuery.eq('user_id', user_id);
    } else {
      orderQuery = orderQuery.eq('guest_id', guest_id);
    }
    const { data: orderData } = await orderQuery;
    if (!orderData || orderData.length === 0) {
      document.getElementById('cart-subtotal').textContent = '₱0.00';
      document.getElementById('cart-total').textContent = '₱0.00';
      return;
    }
    const orderId = orderData[0].id;
    const { data: items } = await window.supabase.from('order_items').select('*').eq('order_id', orderId);
    let subtotal = 0;
    if (items) {
      items.forEach(item => {
        subtotal += item.price * item.quantity;
      });
    }
    document.getElementById('cart-subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `₱${subtotal.toFixed(2)}`;
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
      let user = window.supabase?.auth.getUser ? (await window.supabase.auth.getUser()).data.user : null;
      let user_id = user ? user.id : null;
      let guest_id = null;
      if (!user_id) {
        guest_id = sessionStorage.getItem('guest_id');
        if (!guest_id) {
          guest_id = crypto.randomUUID();
          sessionStorage.setItem('guest_id', guest_id);
        }
      }
      // Get latest order
      let orderQuery = window.supabase.from('orders').select('id').order('created_at', { ascending: false }).limit(1);
      if (user_id) {
        orderQuery = orderQuery.eq('user_id', user_id);
      } else {
        orderQuery = orderQuery.eq('guest_id', guest_id);
      }
      const { data: orderData } = await orderQuery;
      if (!orderData || orderData.length === 0) {
        cartItemsList.innerHTML = '<li class="list-group-item text-center text-muted">Your cart is empty.</li>';
        cartSubtotal.textContent = '₱0.00';
        cartTotal.textContent = '₱0.00';
        return;
      }
      const orderId = orderData[0].id;
      const { data: items } = await window.supabase.from('order_items').select('*').eq('order_id', orderId);
      if (!items || items.length === 0) {
        cartItemsList.innerHTML = '<li class="list-group-item text-center text-muted">Your cart is empty.</li>';
        cartSubtotal.textContent = '₱0.00';
        cartTotal.textContent = '₱0.00';
        return;
      }

      cartItemsList.innerHTML = '';
      items.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.item_name;
        nameSpan.style.flex = '2';

        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.min = '1';
        quantityInput.value = item.quantity;
        quantityInput.style.width = '60px';
        quantityInput.className = 'form-control form-control-sm mx-2';
        quantityInput.addEventListener('change', async (e) => {
          const newQuantity = parseInt(e.target.value);
          if (isNaN(newQuantity) || newQuantity < 1) {
            e.target.value = item.quantity;
            return;
          }
          await window.supabase.from('order_items').update({ quantity: newQuantity }).eq('id', item.id);
          updateCartPopup();
          await updateCartSummary();
          await renderCartPageItems();
        });

        const priceSpan = document.createElement('span');
        priceSpan.textContent = `₱${(item.price * item.quantity).toFixed(2)}`;
        priceSpan.style.flex = '1';
        priceSpan.className = 'text-end';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-outline-danger ms-2';
        removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
        removeBtn.addEventListener('click', async () => {
          await window.supabase.from('order_items').delete().eq('id', item.id);
          updateCartPopup();
          await updateCartSummary();
          await renderCartPageItems();
        });

        listItem.appendChild(nameSpan);
        listItem.appendChild(quantityInput);
        listItem.appendChild(priceSpan);
        listItem.appendChild(removeBtn);

        cartItemsList.appendChild(listItem);
      });

      // Update totals
      let subtotal = 0;
      items.forEach(item => {
        subtotal += item.price * item.quantity;
      });
      cartSubtotal.textContent = `₱${subtotal.toFixed(2)}`;
      cartTotal.textContent = `₱${subtotal.toFixed(2)}`;
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
});

// Implement proceedToCheckout function
async function proceedToCheckout() {
  let user = window.supabase?.auth.getUser ? (await window.supabase.auth.getUser()).data.user : null;
  let user_id = user ? user.id : null;
  let guest_id = null;
  if (!user_id) {
    guest_id = sessionStorage.getItem('guest_id');
    if (!guest_id) {
      guest_id = crypto.randomUUID();
      sessionStorage.setItem('guest_id', guest_id);
    }
  }
  // Get latest order
  let orderQuery = window.supabase.from('orders').select('id').order('created_at', { ascending: false }).limit(1);
  if (user_id) {
    orderQuery = orderQuery.eq('user_id', user_id);
  } else {
    orderQuery = orderQuery.eq('guest_id', guest_id);
  }
  const { data: orderData } = await orderQuery;
  if (!orderData || orderData.length === 0) {
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
  // Redirect to checkout page
  window.location.href = 'checkout.html';
}
