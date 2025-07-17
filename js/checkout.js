document.addEventListener('DOMContentLoaded', () => {
  const orderItemsList = document.getElementById('orderItems');
  const totalAmountInput = document.getElementById('totalAmount');
  const payNowButton = document.getElementById('payNowButton');
  const backToCartButton = document.getElementById('backToCartButton');
  const checkoutForm = document.getElementById('checkoutForm');
  const paymentOptions = document.querySelectorAll('input[name="pay"]');
  const cardDetails = document.getElementById('cardDetails');
  const couponCodeInput = document.getElementById('couponCode');
  const applyCouponButton = document.getElementById('applyCouponButton');
  const couponCodeError = document.getElementById('couponCodeError');
  const thankYouModal = new bootstrap.Modal(document.getElementById('thankYouModal'));

  // Load cart items from localStorage
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];

  // Render cart items in order summary
  orderItemsList.innerHTML = '';

  function calculateTotal() {
    let total = 0;
    cartItems.forEach(item => {
      const quantity = item.quantity ? parseInt(item.quantity) : 1;
      total += (parseFloat(item.price) || 0) * quantity;
    });
    return total;
  }

  function updateTotalAmount(discount = 0) {
    const total = calculateTotal();
    const newTotal = total - discount;
    totalAmountInput.value = `₱${newTotal.toFixed(2)}`;
  }

  if (cartItems.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'list-group-item text-center text-muted';
    emptyItem.textContent = 'Your cart is empty.';
    orderItemsList.appendChild(emptyItem);
    updateTotalAmount(0);
    payNowButton.disabled = true;
  } else {
    cartItems.forEach(item => {
      const listItem = document.createElement('li');
      listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
      listItem.textContent = `${item.name} x${item.quantity ? item.quantity : 1}`;
      const priceSpan = document.createElement('span');
      const quantity = item.quantity ? parseInt(item.quantity) : 1;
      const itemTotal = (parseFloat(item.price) || 0) * quantity;
      priceSpan.textContent = `₱${itemTotal.toFixed(2)}`;
      listItem.appendChild(priceSpan);
      orderItemsList.appendChild(listItem);
    });
    // Always update total amount based on cart items, even if no coupon applied
    updateTotalAmount(0);
    payNowButton.disabled = false;
  }

  // Show or hide card details based on selected payment method
  function toggleCardDetails() {
    const selectedPayment = document.querySelector('input[name="pay"]:checked').id;
    if (selectedPayment === 'bc1' || selectedPayment === 'bc3') {
      cardDetails.style.display = 'block';
      // Make card inputs required
      document.getElementById('cardNumber').required = true;
      document.getElementById('cardCVC').required = true;
      document.getElementById('expMonth').required = true;
      document.getElementById('expYear').required = true;
    } else {
      cardDetails.style.display = 'none';
      // Remove required attribute from card inputs
      document.getElementById('cardNumber').required = false;
      document.getElementById('cardCVC').required = false;
      document.getElementById('expMonth').required = false;
      document.getElementById('expYear').required = false;
    }
  }

  paymentOptions.forEach(option => {
    option.addEventListener('change', toggleCardDetails);
  });

  // Initialize card details visibility
  toggleCardDetails();

  // Coupon code application logic
  applyCouponButton.addEventListener('click', () => {
    const code = couponCodeInput.value.trim();
    couponCodeError.textContent = '';
    if (code === '') {
      couponCodeError.textContent = 'Please enter a coupon code.';
      couponCodeInput.classList.add('is-invalid');
      return;
    }
    // Example: simple coupon code validation
    if (code.toUpperCase() === 'DISCOUNT10') {
      const total = calculateTotal();
      const discount = total * 0.1;
      updateTotalAmount(discount);
      couponCodeError.textContent = 'Coupon applied successfully!';
      couponCodeError.style.color = 'green';
      couponCodeInput.classList.remove('is-invalid');
      couponCodeInput.classList.add('is-valid');
      payNowButton.disabled = false;
    } else {
      couponCodeError.textContent = 'Invalid coupon code.';
      couponCodeError.style.color = 'red';
      couponCodeInput.classList.add('is-invalid');
      couponCodeInput.classList.remove('is-valid');
    }
  });

  // Back to cart button
  backToCartButton.addEventListener('click', () => {
    window.location.href = 'cart.html';
  });

  // Form validation and submission
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!checkoutForm.checkValidity()) {
      checkoutForm.classList.add('was-validated');
      return;
    }
    // Here you can add payment processing logic or order submission

    // Show thank you modal
    thankYouModal.show();

    // Clear cart after successful order
    localStorage.removeItem('cart');

    // Redirect to rating.html after modal is hidden
    const modalElement = document.getElementById('thankYouModal');
    modalElement.addEventListener('hidden.bs.modal', () => {
      window.location.href = 'rating.html';
    }, { once: true });
  });
});
