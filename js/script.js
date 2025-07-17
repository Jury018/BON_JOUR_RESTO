function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Show loading spinner for buttons only
function showLoading(event) {
  event.preventDefault(); // Prevent default navigation or form submission
  const loading = document.getElementById('customLoading');

  // Check if the user is online
  if (navigator.onLine) {
    loading.style.display = 'block';

    // Simulate a delay before navigating (e.g., 1 second)
    setTimeout(() => {
      const target = event.target.closest('button'); // Ensure it's a button
      if (target && target.dataset.href) {
        window.location.href = target.dataset.href; // Navigate to the link stored in data-href
      } else {
        loading.style.display = 'none'; // Hide spinner if no navigation occurs
      }
    }, 1000); // 1 second delay
  } else { 
    showModalMessage('You are offline. Please check your internet connection.', false);
  }
}

// Function to show a modal message for success or error
function showModalMessage(message, isSuccess = true) {
  const modalMessage = document.getElementById('modalMessage');
  const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));

  modalMessage.textContent = message;
  modalMessage.className = isSuccess ? 'text-success' : 'text-danger';
  messageModal.show();
}

document.addEventListener('DOMContentLoaded', () => {

  const glide = new Glide('.glide', {
    type: 'carousel', 
    startAt: 0,
    perView: 3,
    gap: 10,
    autoplay: 3000, 
    rewind: true, 
    animationDuration: 800, 
    animationTimingFunc: 'linear', 
    breakpoints: {
      1200: { perView: 2 },
      768: { perView: 1 },
    },
  });

  glide.mount();

  // Ensure all slides have the same height for a uniform look
  const slides = document.querySelectorAll('.glide__slide');
  let maxHeight = 0;

  slides.forEach((slide) => {
    const slideHeight = slide.offsetHeight;
    if (slideHeight > maxHeight) {
      maxHeight = slideHeight;
    }
  });

  slides.forEach((slide) => {
    slide.style.height = `${maxHeight}px`;
  });

  // Adjust slide width dynamically for better responsiveness
  const glideSlides = document.querySelector('.glide__slides');
  const updateSlideWidth = () => {
    const slideWidth = glideSlides.offsetWidth / glide.settings.perView - glide.settings.gap;
    slides.forEach((slide) => {
      slide.style.width = `${slideWidth}px`;
    });
  };

  window.addEventListener('resize', debounce(updateSlideWidth, 200));
  updateSlideWidth();
});

// Lazy loading for images
document.addEventListener('DOMContentLoaded', () => {
  const lazyImages = document.querySelectorAll('img.lazy');

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        img.classList.add('lazy-loaded');
        observer.unobserve(img);
      }
    });
  });

  lazyImages.forEach((img) => {
    imageObserver.observe(img);
  });
});

// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById('darkModeToggle');

  if (darkModeToggle) {
    // Check and apply the saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.body.classList.toggle('dark-mode', savedTheme === 'dark');
      darkModeToggle.checked = savedTheme === 'dark';
    }

    // Add event listener for the toggle
    darkModeToggle.addEventListener('change', () => {
      const isDarkMode = darkModeToggle.checked;
      document.body.classList.toggle('dark-mode', isDarkMode);

      // Save the preference to localStorage
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Add event listeners to popular dishes
  const popularDishes = document.querySelectorAll('.glide__slide');

  popularDishes.forEach((dish) => {
    dish.addEventListener('click', () => {
      // Show the modal when a dish is clicked
      const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
      loginModal.show();
    });
  });

  // Handle modal button actions
  const loginButton = document.getElementById('loginButton');
  const guestButton = document.getElementById('guestButton');

  if (loginButton) {
    loginButton.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }
  
  if (guestButton) {
    guestButton.addEventListener('click', async () => {
      const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      loginModal.hide();

      // Log the guest action

      window.location.href = 'foodmenu.html'; 
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.querySelector('#contactForm form');

  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // Prevent default form submission

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      // Strict input validation
      const nameRegex = /^[a-zA-Z\s]{2,50}$/; // Only letters and spaces, 2-50 characters
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format
      const messageRegex = /^.{10,500}$/; // Message length between 10 and 500 characters

      if (!nameRegex.test(name)) {
        showModalMessage('Invalid name. Only letters and spaces are allowed (2-50 characters).', false);
        return;
      }

      if (!emailRegex.test(email)) {
        showModalMessage('Invalid email address.', false);
        return;
      }

      if (!messageRegex.test(message)) {
        showModalMessage('Message must be between 10 and 500 characters.', false);
        return;
      }

      // Prevent multiple submissions by  disabling the submit button temporarily
      const submitButton = contactForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;

      try {
        // Use Web3Forms to submit the contact data
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_key: '86e63595-8335-4c19-89e4-8d9f3dcdaa94',
            name,
            email,
            message,
          }),
        });
        const result = await response.json();
        if (result.success) {
          showModalMessage('Your message has been sent successfully!', true);
          contactForm.reset(); // Clear the form
        } else {
          showModalMessage('Failed to send message. Please try again.', false);
        }
      } catch (error) {
        showModalMessage('An unexpected error occurred. Please try again later.', false);
      } finally {
        submitButton.disabled = false; // Re-enable the submit button
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const foodMenuLink = document.querySelector('a[href="foodmenu.html"]');
  const cartLink = document.querySelector('a[href="cart.html"]');

  if (foodMenuLink) {
    foodMenuLink.addEventListener('click', (event) => {
      event.preventDefault();
      const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
      loginModal.show();

      const loginButton = document.getElementById('loginButton');
      const guestButton = document.getElementById('guestButton');

      if (loginButton) {
        loginButton.addEventListener('click', () => {
          window.location.href = 'login.html';
        });
      }

      if (guestButton) {
        guestButton.addEventListener('click', () => {
          loginModal.hide();
          window.location.href = 'foodmenu.html';
        });
      }
    });
  }

  if (cartLink) {
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();

      // Check if there are items in the cart (example using localStorage)
      const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

      if (cartItems.length === 0) {
        const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
        const modalMessage = document.getElementById('modalMessage');

        modalMessage.textContent = 'Your cart is empty. Please add items to your cart before proceeding.';
        modalMessage.className = 'text-danger';
        messageModal.show();
      } else {
        window.location.href = 'cart.html';
      }
    });
  }
});
