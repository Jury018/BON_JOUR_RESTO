/**
 * Auth Utilities for Bon Jour Resto
 * Handles navigation updates and global sign-out functionality.
 */

function updateNav() {
  const session = document.cookie.split('; ').find(row => row.startsWith('resto_session='));
  const loginLinks = document.querySelectorAll('a[href*="login.html"]');

  loginLinks.forEach(link => {
    if (session) {
      link.textContent = 'Log Out';
      link.href = '#';
      link.onclick = (e) => {
        e.preventDefault();
        signOut();
      };
    } else {
      link.textContent = 'Log In';
    }
  });
}

async function signOut() {
  try {
    // Attempt Firebase signout if available
    if (typeof firebase !== 'undefined' && firebase.auth) {
      try {
        await firebase.auth().signOut();
      } catch (e) {
        console.warn("Firebase auth not ready for signout");
      }
    }
    
    // Clear session data
    localStorage.removeItem('resto_user');
    localStorage.removeItem('resto_cart');
    document.cookie = "resto_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    
    // Redirect logic
    const isInsideHtmlDir = window.location.pathname.includes('/html/');
    const homePath = isInsideHtmlDir ? '../index.html' : 'index.html';
    
    // Optional: show modal if available
    if (typeof showSmartModal === 'function') {
      showSmartModal({title: 'Sign Out', message: 'You have been signed out.', type: 'info', autoClose: true});
      setTimeout(() => { window.location.href = homePath; }, 1000);
    } else {
      window.location.href = homePath;
    }
  } catch (error) {
    console.error("Sign out error:", error);
    const homePath = window.location.pathname.includes('/html/') ? '../index.html' : 'index.html';
    window.location.href = homePath;
  }
}

window.signOut = signOut;
document.addEventListener('DOMContentLoaded', updateNav);
