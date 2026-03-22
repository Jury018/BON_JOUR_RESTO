// aboutme.js - Premium JS for About Me page

document.addEventListener('DOMContentLoaded', function () {
  // 1. Back to Top Smooth Logic
  const mybutton = document.getElementById('myBtn');
  window.addEventListener('scroll', function () {
    if (document.documentElement.scrollTop > 300) {
      mybutton.style.opacity = '1';
      mybutton.style.transform = 'translateY(0)';
      mybutton.style.pointerEvents = 'auto';
    } else {
      mybutton.style.opacity = '0';
      mybutton.style.transform = 'translateY(20px)';
      mybutton.style.pointerEvents = 'none';
    }
  });

  window.topFunction = function () {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 2. Scroll Reveal Animation for Articles
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('article').forEach(article => {
    article.style.opacity = '0';
    article.style.transform = 'translateY(40px)';
    article.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
    observer.observe(article);
  });

  // 3. Loading spinner and redirect
  window.showLoading = function (event) {
    const link = event.currentTarget.href;
    console.log('Redirecting to:', link);
    // You could add a real spinner here if you have one in HTML
  };
});
