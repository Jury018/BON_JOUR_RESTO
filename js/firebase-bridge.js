/**
 * Firebase Bridge for Bon Jour Resto
 * Synchronizes LocalStorage with Firebase Realtime Database
 */

const FirebaseBridge = {
  // Sync User Cart to Firebase
  async syncCartToFirebase(cart) {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        await firebase.database().ref(`carts/${user.uid}`).set(cart);
        console.log("Cart synced to Firebase");
      } catch (e) {
        console.error("Firebase Sync Error:", e);
      }
    }
  },

  // Pull Cart from Firebase and merge with local items
  async pullCartFromFirebase() {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        const snapshot = await firebase.database().ref(`carts/${user.uid}`).once('value');
        const cloudCart = snapshot.val() || [];
        const localCart = JSON.parse(localStorage.getItem('resto_cart') || '[]');

        // Merge Logic: Use Cloud Cart but add any local items that aren't in cloud
        // This handles the "Add to cart then login" scenario
        let finalCart = [...cloudCart];
        
        localCart.forEach(localItem => {
          const exists = finalCart.find(cloudItem => cloudItem.name === localItem.name);
          if (!exists) {
            finalCart.push(localItem);
          }
        });

        localStorage.setItem('resto_cart', JSON.stringify(finalCart));
        
        // If we merged new local items, sync back to Firebase immediately
        if (localCart.length > 0 && finalCart.length > cloudCart.length) {
            this.syncCartToFirebase(finalCart);
        }

        return finalCart;
      } catch (e) {
        if (e.message && e.message.includes('permission_denied')) {
          console.warn("Firebase Access Denied: Please update your Realtime Database Rules in Firebase Console to allow users to read/write their own /carts/ node.");
        } else {
          console.error("Firebase Pull Error:", e);
        }
        return JSON.parse(localStorage.getItem('resto_cart') || '[]');
      }
    }
    return JSON.parse(localStorage.getItem('resto_cart') || '[]');
  },

  // Sync Theme/Preferences
  async syncPreferences(prefs) {
    const user = firebase.auth().currentUser;
    if (user) {
      await firebase.database().ref(`preferences/${user.uid}`).update(prefs);
    }
  },

  // Initialize Auth Sync
  init() {
    // Persist auth state across browser sessions to prevent anonymous spam
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        firebase.auth().onAuthStateChanged(async (user) => {
          if (user) {
            console.log("Logged in as:", user.isAnonymous ? `Anonymous Guest (${user.uid})` : user.email);
            
            // Update session cookie for middleware
            document.cookie = "resto_session=true; path=/; max-age=86400; SameSite=Lax";
            
            const cart = await this.pullCartFromFirebase();
            // Update UI if on cart page
            if (window.updateCartPopup) window.updateCartPopup();
            if (window.renderCartPageItems) window.renderCartPageItems();
          } else {
            console.log("No user session. Signing in anonymously to track guest activity...");
            try {
              await firebase.auth().signInAnonymously();
            } catch (error) {
              console.error("Anonymous Sign-In Error:", error);
              // Fallback to local only if auth fails
              document.cookie = "resto_session=guest; path=/; max-age=86400; SameSite=Lax";
            }
          }
        });
      })
      .catch((error) => {
        console.error("Auth persistence error:", error);
      });
  }
};

window.FirebaseBridge = FirebaseBridge;
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        FirebaseBridge.init();
    }
});
