async function loadMenu() {
  const categories = {
    'HOMEMADE MEALS': document.querySelector('#menu .menu-category:nth-of-type(1) .menu-container'),
    'QUICK MEAL': document.querySelector('#menu .menu-category:nth-of-type(2) .menu-container'),
    'ADDS ON': document.querySelector('#menu .menu-category:nth-of-type(3) .menu-container'),
    'DRINKS': document.querySelector('#menu .menu-category:nth-of-type(4) .menu-container')
  };

  // Save original hardcoded HTML as fallback before replacing with skeletons
  const originalContent = {};
  Object.entries(categories).forEach(([key, container]) => {
    if (container) {
      originalContent[key] = container.innerHTML;
    }
  });

  // Show Skeletons
  Object.values(categories).forEach(container => {
    if (container) {
      container.innerHTML = Array(3).fill(`
        <div class="menu-item">
          <div class="skeleton" style="height: 240px; width: 100%;"></div>
          <div class="menu-item-content">
            <div class="skeleton" style="height: 24px; width: 60%; margin-bottom: 1rem;"></div>
            <div class="skeleton" style="height: 16px; width: 90%; margin-bottom: 0.5rem;"></div>
            <div class="skeleton" style="height: 16px; width: 80%; margin-bottom: 1.5rem;"></div>
            <div class="skeleton" style="height: 28px; width: 40%; margin-bottom: 1.5rem;"></div>
            <div class="skeleton" style="height: 48px; width: 100%; border-radius: 12px;"></div>
          </div>
        </div>
      `).join('');
    }
  });

  try {
    const response = await fetch('/api/menu');
    if (!response.ok) throw new Error('Failed to fetch menu');
    const menuItems = await response.json();

    // If API returns empty array, fall back to hardcoded items
    if (!menuItems || menuItems.length === 0) {
      console.warn('API returned empty menu, using hardcoded fallback.');
      Object.entries(categories).forEach(([key, container]) => {
        if (container && originalContent[key]) {
          container.innerHTML = originalContent[key];
        }
      });
      return;
    }

    // Clear skeletons
    Object.values(categories).forEach(container => {
      if (container) container.innerHTML = '';
    });

    menuItems.forEach(item => {
      const container = categories[item.category];
      if (container) {
        const itemHtml = `
          <div class="menu-item fade-in" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <div class="menu-item-content">
              <h3>${item.name}</h3>
              <p>${item.description}</p>
              <div class="menu-price">₱${item.price}</div>
              <button class="add-to-cart" data-name="${item.name}" data-price="${item.price}">
                <i class="fas fa-shopping-basket"></i> Add to Cart
              </button>
            </div>
          </div>
        `;
        container.innerHTML += itemHtml;
      }
    });

    console.log('Menu loaded dynamically from API');
  } catch (error) {
    console.error('Error loading menu:', error);
    // Restore original hardcoded content as fallback instead of showing error
    Object.entries(categories).forEach(([key, container]) => {
      if (container && originalContent[key]) {
        container.innerHTML = originalContent[key];
      }
    });
    console.log('Restored hardcoded menu as fallback.');
  }
}


document.addEventListener('DOMContentLoaded', () => {
  loadMenu();

  // Add-to-cart logic using localStorage
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      const itemName = e.target.dataset.name || e.target.closest('.menu-item')?.querySelector('h3')?.textContent || 'Unnamed';
      const itemPrice = parseFloat(e.target.dataset.price) || parseFloat((e.target.closest('.menu-item')?.querySelector('p:nth-of-type(2)')?.textContent || '').replace('₱', '')) || 0;
      
      console.log('Add to Cart:', itemName, '₱', itemPrice);

      // Update localStorage cart
      const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
      const existingItemIndex = cart.findIndex(item => item.name === itemName);
      
      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
      } else {
        cart.push({ name: itemName, price: itemPrice, quantity: 1 });
      }
      
      localStorage.setItem('resto_cart', JSON.stringify(cart));
      console.log('Cart updated in localStorage');

      // Sync to Firebase if bridge is available
      if (window.FirebaseBridge) {
        window.FirebaseBridge.syncCartToFirebase(cart);
      }

      // Animation
      const menuItem = e.target.closest('.menu-item');
      if (menuItem) {
        menuItem.style.animation = 'addToCart 0.5s ease';
        menuItem.addEventListener('animationend', () => {
          menuItem.style.animation = '';
        }, { once: true });
      }
      
      // Trigger cart update if cart.js is loaded
      if (window.updateCartPopup) {
        window.updateCartPopup();
      }

      // Cart Icon Animation Feedback
      const cartIcon = document.getElementById('cartIcon');
      if (cartIcon) {
        cartIcon.classList.remove('cart-bounce', 'cart-pulse');
        void cartIcon.offsetWidth; // Trigger reflow
        cartIcon.classList.add('cart-bounce', 'cart-pulse');
        
        // Remove classes after animation completes
        setTimeout(() => {
          cartIcon.classList.remove('cart-bounce', 'cart-pulse');
        }, 600);
      }
    }
  });

  // Navigation guard
  const navLinks = document.querySelectorAll('nav a.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
      const href = link.getAttribute('href');
      
      // Allow navigation to Home unconditionally
      if (href && (href === '/' || href.includes('index'))) {
        return;
      }
      
      if (cart.length === 0) {
        // Specifically check if they are trying to go to the cart or other protected pages
        if (href && (href.includes('cart') || href.includes('checkout') || href.includes('rating'))) {
          e.preventDefault();
          const modalHtml = `
            <div class="modal fade" id="emptyCartModal" tabindex="-1" aria-labelledby="messageModalLabel" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title" id="messageModalLabel">Cart is Empty</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <p>You haven't added any delicious items to your cart yet! Browse our menu to start your order.</p>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Browse Menu</button>
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
      }
    });
  });
});
