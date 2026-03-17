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

  // Form submission (Connect to API)
  ratingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedRating = ratingForm.querySelector('input[name="rating"]:checked');
    if (!selectedRating) {
      alert('Please select a star rating.');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('resto_user') || '{}');
    const reviewData = {
      rating: parseInt(selectedRating.value),
      comment: commentBox.value.trim(),
      userId: userData.uid || 'guest',
      userName: userData.displayName || 'Anonymous'
    };

    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) throw new Error('Failed to submit rating');

      // Show toast notification
      ratingToast.show();
      ratingForm.reset();
      ratingValue.textContent = '0';
      commentCount.textContent = '0 / 300';
      labels.forEach(label => label.classList.remove('selected'));
      
      setTimeout(() => {
        sessionStorage.removeItem('canRate'); // Clear flag after rating
        window.location.replace('../index.html');
      }, 2000);

    } catch (error) {
      console.error('Rating Error:', error);
      alert('Failed to submit feedback. Please try again later.');
      submitBtn.disabled = false;
    }
  });
});
