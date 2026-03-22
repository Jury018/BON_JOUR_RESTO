/**
 * Auth Utilities for Bon Jour Resto
 * Handles navigation updates and global sign-out functionality.
 */

function updateNav() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn("Firebase Auth not initialized yet.");
    return;
  }

  // Use onAuthStateChanged for reliable state tracking
  firebase.auth().onAuthStateChanged((user) => {
    const session = document.cookie.split('; ').find(row => row.startsWith('resto_session='));
    const sessionValue = session ? session.split('=')[1] : null;
    const loginLinks = document.querySelectorAll('a[href*="login"]');
    
    const isAuthenticated = user && !user.isAnonymous;

    loginLinks.forEach(link => {
      if (isAuthenticated || sessionValue === 'true') {
        // User is logged in
        link.textContent = 'Log Out';
        link.href = '#';
        link.onclick = (e) => {
          e.preventDefault();
          signOut();
        };
      } else {
        // User is a guest
        link.textContent = 'Log In';
        link.href = '/html/login';
        link.onclick = null;
      }
    });

    // Sync localStorage/Cookies if needed
    if (user && !user.isAnonymous) {
      document.cookie = "resto_session=true; path=/; max-age=2592000; SameSite=Lax";
    }
  });
}

async function signOut() {
  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      await firebase.auth().signOut();
    }
    
    // Clear all session data
    localStorage.removeItem('resto_user');
    localStorage.removeItem('resto_cart');
    document.cookie = "resto_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    
    // Redirect to home
    window.location.href = '/';
  } catch (error) {
    console.error("Sign out error:", error);
    window.location.href = '/';
  }
}

window.signOut = signOut;
document.addEventListener('DOMContentLoaded', updateNav);
