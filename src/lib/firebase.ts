// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApmLgIL3KtyN80IBE2Q05iQHLGvVxJKUs",
  authDomain: "culinaryflow-pr4wn.firebaseapp.com",
  projectId: "culinaryflow-pr4wn",
  storageBucket: "culinaryflow-pr4wn.appspot.com",
  messagingSenderId: "1053523385881",
  appId: "1:1053523385881:web:2ca345abf0055cf1b5d488"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
