// aboutme.js - Modular JS for About Me page

document.addEventListener('DOMContentLoaded', function () {
  // Back to Top button functionality
  const mybutton = document.getElementById('myBtn');
  window.addEventListener('scroll', function () {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      mybutton.style.display = 'block';
    } else {
      mybutton.style.display = 'none';
    }
  });
  window.topFunction = function () {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  // Custom alert functionality
  window.displayAlert = function (message) {
    const alertMessage = document.getElementById('alertMessage');
    const customAlert = document.getElementById('customAlert');
    alertMessage.textContent = message;
    customAlert.style.display = 'block';
    setTimeout(window.closeAlert, 2000);
  };
  window.closeAlert = function () {
    const customAlert = document.getElementById('customAlert');
    customAlert.style.display = 'none';
  };

  // Loading spinner and redirect
  window.showLoading = function (event) {
    event.preventDefault();
    const customLoading = document.getElementById('customLoading');
    customLoading.style.display = 'block';
    setTimeout(() => {
      window.location.href = event.target.href;
    }, 1000);
  };
});
