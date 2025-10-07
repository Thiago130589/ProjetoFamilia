// login.js

// Importa os serviços do Firebase inicializados no firebase-init.js
import { auth, db } from "./firebase-init.js"; 

/**
 * Arquivo: login.js
 * Descrição: Lógica de autenticação do formulário de login (Firebase v9/Módulos).
 */

const firebaseAuth = auth;
const firestoreDb = db;

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('login-username');
const passwordInput = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');

function showMessage(message, type = 'error') {
    loginMessage.textContent = message;
    // Assume que você tem as classes .message-feedback, .error-message, .success-message no style.css
    loginMessage.className = `message-feedback ${type}-message`; 
    loginMessage.classList.remove('hidden-start');
}

function resetMessage() {
    loginMessage.textContent = '';
    loginMessage.classList.add('hidden-start');
}

/**
 * Mapeia o Apelido/Usuário para o formato de e-mail que o Firebase Auth requer.
 */
function mapUsernameToEmail(username) {
    if (username.includes('@')) {
        // Se for email completo (admin), retorna o email
        return username.toLowerCase().trim();
    }
    // E-mail fictício para usuários comuns
    return `${username.toLowerCase().trim()}@familiadefault.com`;
}


/**
 * Processa o evento de submissão do formulário de login.
 */
async function handleLogin(e) {
    e.preventDefault();
    resetMessage();

    if (!firebaseAuth || !firestoreDb) {
        showMessage('Erro crítico: Firebase não inicializado. Verifique o firebase-init.js', 'error');
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const emailToLogin = mapUsernameToEmail(username);

    if (username === '' || password === '') {
        showMessage('Preencha o Apelido/Usuário e a Senha.', 'error');
        return;
    }

    const loginButton = loginForm.querySelector('button[type="submit"]');
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';


    try {
        // 1. Autenticação (A função é importada no firebase-init, mas o método está na instância auth)
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(emailToLogin, password);
        const firebaseUser = userCredential.user;

        const documentId = firebaseUser.email; 
        
        // 2. Busca dados do Firestore (Requer permissão de leitura)
        const userDoc = await firestoreDb.collection('users').doc(documentId).get();

        if (!userDoc.exists) {
            // Se a leitura falhou, desloga o usuário por segurança.
            await firebaseAuth.signOut();
            showMessage('Perfil não encontrado no banco de dados. Contate o administrador.', 'error');
            return;
        }

        const userData = userDoc.data();

        // 3. Salva a sessão no LocalStorage
        const userSession = {
            uid: firebaseUser.uid,
            // O username no LocalStorage será o valor digitado (Apelido ou Email completo)
            username: username, 
            nome: userData.nome || 'Usuário',
            isAdmin: userData.isAdmin || false,
            saldo: userData.saldo || 0,
        };
        localStorage.setItem('usuarioLogado', JSON.stringify(userSession));

        // 4. Redireciona
        window.location.href = 'index.html';

    } catch (error) {
        let errorMessage = 'Erro no login. Verifique o Apelido/Usuário e Senha.';

        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Apelido ou Senha incorreta.';
        } else if (error.code === 'auth/network-request-failed' || error.code === 'unavailable') {
            errorMessage = 'Erro de conexão ou de acesso ao Firebase (código 1).';
        } else if (error.code === 'permission-denied') {
             errorMessage = 'Erro de permissão no banco de dados. Verifique as Regras do Firestore.';
        }
        
        console.error("Erro de Login Detalhado:", error);
        showMessage(errorMessage, 'error');
    } finally {
        // Garantir que o botão volte ao normal em qualquer caso
        loginButton.disabled = false;
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}