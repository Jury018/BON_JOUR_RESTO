const firebaseConfig = {
  apiKey: "AIzaSyB3WepVTRUMKtjBpdUGrB8XfMve-ZUCjWs",
  authDomain: "bonjour.base69.studio",
  databaseURL: "https://bon-jour-base-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bon-jour-base",
  storageBucket: "bon-jour-base.appspot.com",
  messagingSenderId: "357223269073",
  appId: "1:357223269073:web:e18c2ab7f5cb91fc917bf0",
  measurementId: "G-CJNHMJF8TJ"
};

// Initialize Firebase locally for the browser
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase Client-Side initialized");
} else {
  console.warn("Firebase SDK not loaded yet. Make sure to include Firebase CDN in your HTML.");
}
