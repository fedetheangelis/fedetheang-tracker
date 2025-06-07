// Firebase configuration - firebase-config.js

// Importa le funzioni necessarie da Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// La tua configurazione Firebase (quella che avevi in index.html)
const firebaseConfig = {
  apiKey: "AIzaSyCshCsTiJDrubw7J92B_sNAJPflH7wAGt8", // Assicurati che questa sia la tua chiave API reale
  authDomain: "fef-vg-tracker.firebaseapp.com",
  projectId: "fef-vg-tracker",
  storageBucket: "fef-vg-tracker.firebasestorage.app",
  messagingSenderId: "195759327554",
  appId: "1:195759327554:web:c74ef2ab8c8684489b20db"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const firestore_db = getFirestore(app);
const auth_instance = getAuth(app);

// Esponi le istanze di Firebase all'oggetto window per renderle accessibili in script.js
// Questo è il modo in cui script.js (che è anch'esso un modulo) le accederà.
window.firestore_db = firestore_db;
window.firebase_auth = auth_instance; // Rinomino a firebase_auth per chiarezza e non sovrascrivere window.auth
window.GoogleAuthProvider_class = GoogleAuthProvider; // Esponiamo la classe del provider

// È buona pratica importare anche il GoogleAuthProvider se lo usi in script.js,
// o passarlo tramite window.
// Nel tuo script.js avevi:
// import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// Quindi GoogleAuthProvider è già importato direttamente in script.js.
// Però, se avessi bisogno di accedere al 'provider' creato da 'new GoogleAuthProvider()',
// allora dovremmo esporlo qui, ma per ora il modo in cui è usato in script.js va bene.
// L'importante è che window.firestore_db e window.firebase_auth siano disponibili.