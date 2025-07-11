// src/config/firebase.js
import { firebase } from "@react-native-firebase/app";
import "@react-native-firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  // Suas configurações do Firebase virão aqui
  // Este arquivo é apenas um exemplo
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase apenas se não estiver inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
