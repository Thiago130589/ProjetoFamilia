// cadastrar-usuario.js

// Importa os serviços do Firebase inicializados no firebase-init.js
import { auth, db } from "./firebase-init.js"; 

/**
 * Arquivo: cadastrar-usuario.js
 * Descrição: Lógica de criação de novos usuários (Auth e Firestore, Firebase v9/Módulos).
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const firebaseAuth = auth;
    const firestoreDb = db;
    const USERS_COLLECTION = 'users';

    if (!firestoreDb || !firebaseAuth) { 
        console.error("ERRO CRÍTICO: Firebase (Firestore ou Auth) não está definido.");
        return;
    }

    const registerForm = document.getElementById('register-form');
    const messageEl = document.getElementById('register-message');
    
    /**
     * Mapeia o Apelido/Usuário para o formato de e-mail fictício do Firebase Auth.
     */
    function mapUsernameToEmail(username) {
        // E-mail fictício para usuários comuns
        return `${username.toLowerCase().trim()}@familiadefault.com`;
    }
    
    /**
     * Função auxiliar para converter o arquivo de foto em Base64
     */
    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            if (file.size > 512000) { // 500KB
                 reject(new Error("A imagem é muito grande. Tamanho máximo: 500KB."));
                 return;
            }

            reader.onload = () => resolve(reader.result);
            reader.onerror = error => {
                console.error("Erro ao ler arquivo:", error);
                resolve(null); 
            };
            reader.readAsDataURL(file);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            messageEl.classList.add('hidden-start');
            messageEl.textContent = '';
            
            registerUser();
        });
    }

    async function registerUser() {
        // 1. Coleta de Dados
        const username = document.getElementById('register-username').value.trim();
        const nome = document.getElementById('register-nome').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm-password').value.trim();
        const fotoInput = document.getElementById('register-foto-perfil');
        
        // 2. Validação
        if (password !== confirmPassword) {
            messageEl.textContent = 'As senhas não coincidem.';
            messageEl.classList.remove('hidden-start');
            return;
        }
        
        if (username.includes(' ') || username.length < 3) {
            messageEl.textContent = 'O apelido não pode conter espaços e deve ter 3+ caracteres.';
            messageEl.classList.remove('hidden-start');
            return;
        }

        const emailToRegister = mapUsernameToEmail(username);

        // Desabilita o botão
        const registerButton = registerForm.querySelector('button[type="submit"]');
        registerButton.disabled = true;
        registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
        
        try {
            // 3. VERIFICAÇÃO DE DUPLICIDADE (Firestore) - Requer a regra de leitura para usuários anônimos
            // Se esta linha falhar, o problema é 100% a Regra de Segurança!
            const userDocCheck = await firestoreDb.collection(USERS_COLLECTION).doc(emailToRegister).get();

            if (userDocCheck.exists) {
                // Lançar um erro com o código do Firebase para que o catch trate
                throw { code: "auth/email-already-in-use" };
            }

            // 4. PREPARAÇÃO DA FOTO
            let fotoBase64 = null;
            if (fotoInput.files.length > 0) {
                fotoBase64 = await convertFileToBase64(fotoInput.files[0]);
            }
            
            // 5. CRIAÇÃO DE CONTA NO FIREBASE AUTH
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(emailToRegister, password);
            const firebaseUser = userCredential.user;
            
            // 6. CRIAÇÃO DO DOCUMENTO NO FIRESTORE (Requer a regra de criação para o próprio usuário)
            const newUserDoc = {
                uid: firebaseUser.uid,
                nome: nome,
                username: username,
                foto: fotoBase64,
                saldo: 0, // Inicia com 0
                isAdmin: false, 
            };

            await firestoreDb.collection(USERS_COLLECTION).doc(emailToRegister).set(newUserDoc);
            
            // 7. SUCCESSO
            messageEl.textContent = 'Cadastro realizado com sucesso! Redirecionando para o login...';
            messageEl.classList.remove('hidden-start');
            messageEl.classList.remove('error-message');
            messageEl.classList.add('success-message'); 

            // Desloga o usuário recém-criado para levá-lo à tela de login
            await firebaseAuth.signOut();

            setTimeout(() => {
                window.location.href = 'login.html'; 
            }, 2000);

        } catch (error) {
            // Reabilita o botão
            const registerButton = registerForm.querySelector('button[type="submit"]');
            registerButton.disabled = false;
            registerButton.innerHTML = '<i class="fas fa-user-plus"></i> Cadastrar';

            let errorMessage = `Erro ao cadastrar.`;
            
            const errorCode = error.code || (error.message && error.message.includes('A imagem é muito grande') ? 'image-too-large' : 'unknown');

            if (errorCode === 'image-too-large') {
                 errorMessage = error.message;
            } else if (errorCode === 'auth/email-already-in-use') {
                 errorMessage = "Este apelido já está em uso.";
            } else if (errorCode === 'auth/weak-password') {
                 errorMessage = "A senha deve ter pelo menos 6 caracteres.";
            } else if (errorCode === 'permission-denied' || errorCode === 'unavailable') {
                errorMessage = "Erro de permissão ou conexão com o banco de dados. Verifique as Regras do Firestore e sua conexão.";
            } else {
                 console.error("Erro detalhado:", error);
            }
            
            messageEl.textContent = errorMessage;
            messageEl.classList.add('error-message');
            messageEl.classList.remove('hidden-start');
            messageEl.classList.remove('success-message');
        }
    }
});