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

    // Collect form data
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phoneNumber').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const paymentMethod = document.querySelector('input[name="pay"]:checked')?.nextElementSibling?.textContent.trim() || '';
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const cardCVC = document.getElementById('cardCVC').value.trim();
    const expMonth = document.getElementById('expMonth').value.trim();
    const expYear = document.getElementById('expYear').value.trim();
    const couponCode = couponCodeInput.value.trim();
    const totalAmount = totalAmountInput.value.replace('₱','').trim();

    // Get user/guest
    (async () => {
      let user = window.supabase?.auth.getUser ? (await window.supabase.auth.getUser()).data.user : null;
      let user_id = user ? user.id : null;
      let guest_id = null;
      if (!user_id) {
        guest_id = localStorage.getItem('guest_id') || crypto.randomUUID();
        localStorage.setItem('guest_id', guest_id);
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
        alert('Order not found. Please go back to cart and try again.');
        return;
      }
      const orderId = orderData[0].id;
      // Insert checkout data
      const { error: checkoutError } = await window.supabase.from('checkout').insert({
        order_id: orderId,
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_email: email,
        customer_phone: phone,
        customer_address: address,
        customer_city: city,
        customer_postal_code: postalCode,
        payment_method: paymentMethod,
        card_number: cardNumber,
        card_cvc: cardCVC,
        card_exp_month: expMonth ? parseInt(expMonth) : null,
        card_exp_year: expYear ? parseInt(expYear) : null,
        coupon_code: couponCode,
        total_amount: totalAmount ? parseFloat(totalAmount) : null,
        user_id,
        guest_id,
        created_at: new Date().toISOString()
      });
      if (checkoutError) {
        alert('Failed to save checkout info: ' + checkoutError.message);
        return;
      }
      // Show thank you modal
      thankYouModal.show();
      // Clear cart after successful order
      localStorage.removeItem('cart');
      // Redirect to rating.html after modal is hidden
      const modalElement = document.getElementById('thankYouModal');
      modalElement.addEventListener('hidden.bs.modal', () => {
        sessionStorage.setItem('canRate', '1'); // Set flag for rating page access
        window.location.href = 'rating.html';
      }, { once: true });
    })();
  });
});
