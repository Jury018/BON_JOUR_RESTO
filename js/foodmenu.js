document.addEventListener('DOMContentLoaded', async () => {
  console.log('foodmenu.js script loaded successfully.');

  // Disable cart icon on cart.html page to avoid duplication
  if (window.location.pathname.endsWith('cart.html')) {
    console.log('Cart icon creation skipped on cart.html page in foodmenu.js');
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

  cartIcon.addEventListener('mouseover', () => {
    cartIcon.style.transform = 'scale(1.1)';
    cartIcon.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
    tooltip.style.opacity = '1';
  });

  cartIcon.addEventListener('mouseout', () => {
    cartIcon.style.transform = 'scale(1)';
    cartIcon.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    tooltip.style.opacity = '0';
  });

  // Draggable
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  cartIcon.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - cartIcon.getBoundingClientRect().left;
    offsetY = e.clientY - cartIcon.getBoundingClientRect().top;
    cartIcon.style.transition = 'none';
    cartPopup.style.transition = 'none'; // Disable transition for smooth following
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
    const cartIconRect = cartIcon.getBoundingClientRect();
    cartPopup.style.top = `${cartIconRect.top}px`;
    cartPopup.style.left = `${cartIconRect.left - cartPopup.offsetWidth}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    cartIcon.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    cartPopup.style.transition = 'opacity 0.3s ease, top 0.3s ease, left 0.3s ease'; // Re-enable transition
  });

  // Ensure the cart popup follows the cart icon dynamically on scroll or swipe
  window.addEventListener('scroll', () => {
    const cartIconRect = cartIcon.getBoundingClientRect();
    cartPopup.style.top = `${cartIconRect.top}px`;
    cartPopup.style.left = `${cartIconRect.left - cartPopup.offsetWidth}px`;
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
    const cartIconRect = cartIcon.getBoundingClientRect();
    cartPopup.style.top = `${cartIconRect.top}px`;
    cartPopup.style.left = `${cartIconRect.left - cartPopup.offsetWidth}px`;
  });

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

  // Create Proceed to Cart button
  const proceedToCartBtn = document.createElement('button');
  proceedToCartBtn.id = 'proceedToCartBtn';
  proceedToCartBtn.textContent = 'Proceed to Cart';
  Object.assign(proceedToCartBtn.style, {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    zIndex: '1001',
    display: 'none', // Hidden initially
  });
  document.body.appendChild(proceedToCartBtn);

  proceedToCartBtn.addEventListener('click', () => {
    window.location.href = 'cart.html';
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

  // Cart UI update
  const updateCartPopup = () => {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsList = document.getElementById('cartItems');
    cartItemsList.innerHTML = '';

    if (cartItems.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'Your cart is empty.';
      empty.style.textAlign = 'center';
      empty.style.color = '#666';
      cartItemsList.appendChild(empty);
      proceedToCartBtn.style.display = 'none'; // Hide proceed button if cart empty
    } else {
      cartItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.style.padding = '10px';
        listItem.style.borderBottom = '1px solid #ddd';
        listItem.textContent = `${item.name} - ₱${item.price}`;
        cartItemsList.appendChild(listItem);
      });
      proceedToCartBtn.style.display = 'block'; // Show proceed button if cart has items
    }
  };

  // Add-to-cart logic
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      const menuItem = e.target.closest('.menu-item');
      const itemName = menuItem.querySelector('h3')?.textContent || 'Unnamed';
      const itemPrice = (menuItem.querySelector('p:nth-of-type(2)')?.textContent || '').replace('₱', '');

      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existingIndex = cart.findIndex(item => item.name === itemName);
      if (existingIndex > -1) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
      } else {
        cart.push({ name: itemName, price: parseFloat(itemPrice) || 0, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));

      // Animation
      menuItem.style.animation = 'addToCart 0.5s ease';
      menuItem.addEventListener('animationend', () => {
        menuItem.style.animation = '';
      });

      updateCartPopup();

      // Automatically show the cart popup when an item is added
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
  await updateGreeting();
  updateCartPopup();

  // Add event listeners to nav links to check cart before navigation
  const navLinks = document.querySelectorAll('nav a.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
      // Allow navigation if the link is to index.html (Home)
      if (link.getAttribute('href') === 'index.html') {
        return; // Do not block navigation to Home
      }
      if (cartItems.length === 0) {
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
        // Append modal to body if not already present
        if (!document.getElementById('emptyCartModal')) {
          const div = document.createElement('div');
          div.innerHTML = modalHtml;
          document.body.appendChild(div.firstElementChild);
        }
        // Show the modal
        const emptyCartModal = new bootstrap.Modal(document.getElementById('emptyCartModal'));
        emptyCartModal.show();
      }
    });
  });

  // Clear cart on page unload
  window.addEventListener('beforeunload', () => {
    localStorage.removeItem('cart');
  });
});
