/**
 * firebase-init.js
 * Configuração e inicialização do Firebase V8 (Global) para uso em scripts.js, login.js e outros.
 * Dados do projeto: projetofamilia-f0190
 * CRÍTICO: As variáveis 'auth' e 'db' (Firestore) são globais e dependem desta inicialização.
 */

// 1. Configuração do Projeto Firebase - Dados Completos e Corretos
const firebaseConfig = {
    // Chave de API nova (Copie EXATAMENTE a sua)
    apiKey: "AIzaSyD2ZVd8TyXZN792UjTqaFGw9OPcEp7JPzw", 
    
    // Seu authDomain
    authDomain: "projetofamilia-f0190.firebaseapp.com",
    projectId: "projetofamilia-f0190", 
    storageBucket: "projetofamilia-f0190.firebasestorage.app", 
    
    // Seus IDs
    messagingSenderId: "725318208083",
    appId: "1:725318208083:web:e5d77fb6ebea7a64b914a6",
    measurementId: "G-M6TH4JTMM5",
};

// 2. Inicializa o Firebase (V8 - Sintaxe Global)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 3. Define as variáveis globais para uso em outros scripts
const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;