async function loadMenu() {
  const categories = {
    'HOMEMADE MEALS': document.querySelector('#menu .menu-category:nth-of-type(1) .menu-container'),
    'QUICK MEAL': document.querySelector('#menu .menu-category:nth-of-type(2) .menu-container'),
    'ADDS ON': document.querySelector('#menu .menu-category:nth-of-type(3) .menu-container'),
    'DRINKS': document.querySelector('#menu .menu-category:nth-of-type(4) .menu-container')
  };

  // Show Skeletons
  Object.values(categories).forEach(container => {
    if (container) {
      container.innerHTML = Array(3).fill(`
        <div class="menu-item skeleton-container">
          <div class="skeleton skeleton-img"></div>
          <div class="skeleton skeleton-title mx-auto"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 50%; margin: 0 auto 1rem;"></div>
          <div class="skeleton skeleton-btn mx-auto"></div>
        </div>
      `).join('');
    }
  });

  try {
    const response = await fetch('/api/menu');
    if (!response.ok) throw new Error('Failed to fetch menu');
    const menuItems = await response.json();

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
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p>₱${item.price}</p>
            <button class="add-to-cart" data-name="${item.name}" data-price="${item.price}">Add to Cart</button>
          </div>
        `;
        container.innerHTML += itemHtml;
      }
    });

    console.log('Menu loaded with skeleton preloader');
  } catch (error) {
    console.error('Error loading menu:', error);
    // Remove skeletons on error
    Object.values(categories).forEach(container => {
      if (container) container.innerHTML = '<p class="text-center w-100">Failed to load menu. Please try again.</p>';
    });
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
      if (href && href.includes('index.html')) {
        return;
      }
      
      if (cart.length === 0) {
        // Specifically check if they are trying to go to the cart or other protected pages
        if (href && (href.includes('cart.html') || href.includes('checkout.html') || href.includes('rating.html'))) {
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
