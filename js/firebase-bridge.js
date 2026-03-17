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

  // Pull Cart from Firebase
  async pullCartFromFirebase() {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        const snapshot = await firebase.database().ref(`carts/${user.uid}`).once('value');
        const cart = snapshot.val() || [];
        localStorage.setItem('resto_cart', JSON.stringify(cart));
        return cart;
      } catch (e) {
        console.error("Firebase Pull Error:", e);
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
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        console.log("User logged in, syncing from Firebase...");
        const cart = await this.pullCartFromFirebase();
        // Update UI if on cart page
        if (window.updateCartPopup) window.updateCartPopup();
        if (window.renderCartPageItems) window.renderCartPageItems();
      } else {
        console.log("No user session, using LocalStorage only.");
      }
    });
  }
};

window.FirebaseBridge = FirebaseBridge;
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        FirebaseBridge.init();
    }
});
