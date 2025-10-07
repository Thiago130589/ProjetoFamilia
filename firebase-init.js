// firebase-init.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Importa o serviço de autenticação
import { getAuth } from "firebase/auth"; 
// Importa o serviço do Firestore
import { getFirestore } from "firebase/firestore"; 

// Sua configuração do aplicativo Web do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD2ZVd8TyXZN792UjTqaFGw9OPcEp7JPzw", // CHAVE API CORRETA
  authDomain: "projetofamilia-f0190.firebaseapp.com",
  projectId: "projetofamilia-f0190",
  storageBucket: "projetofamilia-f0190.firebasestorage.app",
  messagingSenderId: "725318208083",
  appId: "1:725318208083:web:e5d77fb6ebea7a64b914a6",
  measurementId: "G-M6TH4JTMM5"
};

// 1. Inicializa o Firebase App
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. Inicializa os serviços de Auth e Firestore
// Estas variáveis precisam ser EXPORTADAS para serem usadas em login.js e cadastrar-usuario.js
export const auth = getAuth(app); 
export const db = getFirestore(app);