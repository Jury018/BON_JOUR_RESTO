document.addEventListener('DOMContentLoaded', () => {
    console.log('cart.js script loaded successfully.');

    // 1. Initial Cart State
    const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
    
    // 2. Redirect if empty on cart page
    if (cart.length === 0 && window.location.pathname.includes('cart.html')) {
        console.log('Cart is empty, staying on page but prompting menu.');
        // Optional: window.location.href = 'foodmenu.html';
    }

    // 3. Initialize UI Components
    initFloatingCart();
    initCartPage();

    /**
     * Floating Cart Icon Logic (Used on Food Menu)
     */
    function initFloatingCart() {
        if (!window.location.pathname.includes('foodmenu.html')) {
            console.log('Floating cart icon disabled for this page.');
            return;
        }

        // Create elements
        const cartIcon = document.createElement('div');
        cartIcon.id = 'cartIcon';
        Object.assign(cartIcon.style, {
            position: 'fixed',
            top: '50%',
            right: '20px',
            width: '60px',
            height: '60px',
            backgroundColor: '#e63946',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: '1000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.3s ease'
        });
        cartIcon.innerHTML = '<i class="fas fa-shopping-cart" style="color: white; font-size: 1.8em;"></i>';

        const badge = document.createElement('span');
        badge.id = 'cartBadge';
        Object.assign(badge.style, {
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: 'white',
            color: '#e63946',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8em',
            fontWeight: 'bold',
            border: '2px solid #e63946'
        });
        cartIcon.appendChild(badge);

        // Popup
        const cartPopup = document.createElement('div');
        cartPopup.id = 'cartPopup';
        Object.assign(cartPopup.style, {
            position: 'fixed',
            width: '300px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'none',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: '1001'
        });
        
        cartPopup.innerHTML = `
            <div style="background: #e63946; color: white; padding: 1rem; font-weight: bold; text-align: center;">My Orders</div>
            <div id="cartItemsList" style="max-height: 300px; overflow-y: auto; padding: 1rem;"></div>
            <div style="padding: 1rem; border-top: 1px solid #eee;">
                <button id="goToCartBtn" class="btn btn-danger w-100 rounded-pill fw-bold">View Full Cart</button>
            </div>
        `;
        document.body.appendChild(cartPopup);

        // Click Logic
        cartIcon.addEventListener('click', (e) => {
            if (isDragging) return; 
            const isVisible = cartPopup.style.display === 'flex';
            cartPopup.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                updatePopupPosition();
                updateCartPopup();
            }
        });

        // Dragging Logic
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const startDrag = (e) => {
            isDragging = false; // Reset dragging state on start
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX;
            startY = clientY;
            initialX = cartIcon.offsetLeft;
            initialY = cartIcon.offsetTop;
            
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
        };

        const onDrag = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const dx = clientX - startX;
            const dy = clientY - startY;
            
            // Initial movement threshold to distinguish between tap and drag
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDragging = true;
                cartIcon.style.left = `${initialX + dx}px`;
                cartIcon.style.top = `${initialY + dy}px`;
                cartIcon.style.right = 'auto'; // Disable fixed right
                updatePopupPosition();
            }
            if (e.touches) e.preventDefault(); // Stop page scroll while dragging
        };

        const endDrag = () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', onDrag);
            document.removeEventListener('touchend', endDrag);
        };

        function updatePopupPosition() {
            const rect = cartIcon.getBoundingClientRect();
            // Show popup above or below based on remaining screen space
            if (rect.top > 350) {
                cartPopup.style.top = `${rect.top - 320}px`;
            } else {
                cartPopup.style.top = `${rect.bottom + 10}px`;
            }
            
            // Adjust popup horizontally to stay within viewport
            if (rect.left > window.innerWidth - 320) {
                cartPopup.style.left = `${rect.left - 260}px`;
            } else {
                cartPopup.style.left = `${rect.left}px`;
            }
        }

        cartIcon.addEventListener('mousedown', startDrag);
        cartIcon.addEventListener('touchstart', startDrag, { passive: false });

        document.getElementById('goToCartBtn').addEventListener('click', () => {
            window.location.href = 'cart.html';
        });

        document.body.appendChild(cartIcon);
        updateCartPopup();
    }

    /**
     * Main Cart Page Logic (Used on cart.html)
     */
    function initCartPage() {
        const cartContainer = document.getElementById('cart-container');
        if (!cartContainer) return;

        renderCartPageItems();
        
        const proceedBtn = document.getElementById('proceedToCheckoutBtn');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', proceedToCheckout);
        }

        const backBtn = document.getElementById('back-to-menu');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'foodmenu.html';
            });
        }
    }
});

/**
 * Global Cart Update Functions (Exposed to Window)
 */
window.updateCartPopup = function() {
    const badge = document.getElementById('cartBadge');
    const list = document.getElementById('cartItemsList');
    const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');

    if (badge) {
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
        badge.classList.add('pulse-animation');
        setTimeout(() => badge.classList.remove('pulse-animation'), 1000);
    }

    if (list) {
        if (cart.length === 0) {
            list.innerHTML = '<p class="text-center text-muted">Empty Cart</p>';
        } else {
            list.innerHTML = cart.map(item => `
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                    <span><b>${item.quantity}x</b> ${item.name}</span>
                    <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');
        }
    }
};

window.renderCartPageItems = async function() {
    const list = document.getElementById('cart-items');
    if (!list) return;

    const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
    
    // Skeleton effect
    list.innerHTML = '<div class="p-4 text-center"><div class="spinner-border text-danger" role="status"></div></div>';
    await new Promise(r => setTimeout(r, 600));

    if (cart.length === 0) {
        list.innerHTML = '<div class="p-5 text-center text-muted"><h3>Your cart is empty</h3><p>Add some delicious meals to get started!</p></div>';
        updateCartSummary(0);
        return;
    }

    list.innerHTML = cart.map((item, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-center p-3 border-0 border-bottom mb-2 bg-white rounded-3 shadow-sm">
            <div style="flex: 2">
                <h5 class="mb-0 fw-bold text-dark">${item.name}</h5>
                <small class="text-muted">₱${item.price.toFixed(2)} per serving</small>
            </div>
            <div class="d-flex align-items-center gap-3">
                <div class="input-group input-group-sm" style="width: 100px;">
                    <button class="btn btn-outline-danger" onclick="updateQty(${index}, -1)">-</button>
                    <input type="text" class="form-control text-center bg-white" value="${item.quantity}" readonly>
                    <button class="btn btn-outline-danger" onclick="updateQty(${index}, 1)">+</button>
                </div>
                <div class="text-end" style="min-width: 80px;">
                    <span class="fw-bold text-danger">₱${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <button class="btn btn-link text-danger p-0" onclick="removeItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `).join('');

    updateCartSummary(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
};

function updateCartSummary(total) {
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (subtotalEl) subtotalEl.textContent = `₱${total.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
}

// Global Quantity Handlers
window.updateQty = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    localStorage.setItem('resto_cart', JSON.stringify(cart));
    syncAndRefresh(cart);
};

window.removeItem = function(index) {
    let cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
    cart.splice(index, 1);
    localStorage.setItem('resto_cart', JSON.stringify(cart));
    syncAndRefresh(cart);
};

function syncAndRefresh(cart) {
    if (window.FirebaseBridge) window.FirebaseBridge.syncCartToFirebase(cart);
    window.renderCartPageItems();
    window.updateCartPopup();
}

function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem('resto_cart') || '[]');
    if (cart.length === 0) return;

    const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('resto_session='));
    const sessionValue = sessionCookie ? sessionCookie.split('=')[1] : null;

    if (sessionValue !== 'true') {
        const authModal = new bootstrap.Modal(document.getElementById('authRequiredModal'));
        authModal.show();
    } else {
        window.location.href = 'checkout.html';
    }
}