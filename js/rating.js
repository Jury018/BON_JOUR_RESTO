document.addEventListener('DOMContentLoaded', () => {
  // Session/route guard: Only allow access if session flag is set
  function checkSessionFlag(flagName = 'canRate') {
    if (!sessionStorage.getItem(flagName)) {
      alert('You cannot access this page directly. Please complete checkout first.');
      window.location.replace('../cart.html');
      return false;
    }
    return true;
  }

  if (!checkSessionFlag()) {
    return;
  }

  const ratingForm = document.getElementById('ratingForm');
  const ratingValue = document.getElementById('ratingValue');
  const ratingStars = ratingForm.querySelectorAll('input[name="rating"]');
  const commentBox = document.getElementById('ratingComments');
  const commentCount = document.getElementById('commentCount');
  const clearBtn = document.getElementById('clearBtn');
  const submitBtn = document.getElementById('submitBtn');
  const ratingToast = new bootstrap.Toast(document.getElementById('ratingToast'));

  // Update rating value display and star colors on select
  ratingStars.forEach((star, idx, arr) => {
    star.addEventListener('change', () => {
      ratingValue.textContent = star.value;
      arr.forEach((s, i) => {
        const label = ratingForm.querySelector(`label[for="star${i+1}"]`);
        label.classList.remove('selected');
      });
      for (let i = 0; i < star.value; i++) {
        const label = ratingForm.querySelector(`label[for="star${i+1}"]`);
        label.classList.add('selected');
      }
    });
  });

  // Keyboard accessibility for labels
  const labels = ratingForm.querySelectorAll('.rating label');
  labels.forEach(label => {
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        label.click();
      }
    });
  });

  // Update comment character count
  commentBox.addEventListener('input', () => {
    commentCount.textContent = `${commentBox.value.length} / 300`;
  });

  // Clear form and reset star colors
  clearBtn.addEventListener('click', () => {
    ratingForm.reset();
    ratingValue.textContent = '0';
    commentCount.textContent = '0 / 300';
    submitBtn.disabled = false;
    labels.forEach(label => label.classList.remove('selected'));
  });

  // Form submission with Supabase integration
  ratingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedRating = ratingForm.querySelector('input[name="rating"]:checked');
    if (!selectedRating) {
      alert('Please select a star rating.');
      return;
    }
    const rating = parseInt(selectedRating.value);
    const comments = commentBox.value.trim();
    submitBtn.disabled = true;

    // Get user/guest
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
      submitBtn.disabled = false;
      return;
    }
    const orderId = orderData[0].id;

    const { error: ratingError } = await window.supabase.from('ratings').insert({
      order_id: orderId,
      user_id,
      guest_id,
      rating,
      comment: comments,
      created_at: new Date().toISOString()
    });
    if (ratingError) {
      alert('Failed to save rating: ' + ratingError.message);
      submitBtn.disabled = false;
      return;
    }
    // Show toast notification
    ratingToast.show();
    ratingForm.reset();
    ratingValue.textContent = '0';
    commentCount.textContent = '0 / 300';
    labels.forEach(label => label.classList.remove('selected'));
    setTimeout(() => {
      submitBtn.disabled = false;
      sessionStorage.removeItem('canRate'); // Clear flag after rating
      window.location.replace('../index.html');
    }, 2000);
  });
});
