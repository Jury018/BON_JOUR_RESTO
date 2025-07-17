// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB3WepVTRUMKtjBpdUGrB8XfMve-ZUCjWs",
  authDomain: "bon-jour-base.firebaseapp.com",
  databaseURL: "https://bon-jour-base-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bon-jour-base",
  storageBucket: "bon-jour-base.appspot.com",
  messagingSenderId: "357223269073",
  appId: "1:357223269073:web:e18c2ab7f5cb91fc917bf0",
  measurementId: "G-CJNHMJF8TJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
