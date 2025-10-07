/**
 * Arquivo: login.js
 * Descrição: Lógica de autenticação do formulário de login.
 * Depende de: firebase-init.js (para 'auth' e 'db' [Firestore])
 */

// As variáveis globais 'auth' e 'db' são definidas em firebase-init.js.
const firebaseAuth = typeof auth !== 'undefined' ? auth : null;
const firestoreDb = typeof db !== 'undefined' ? db : null;

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('login-username');
const passwordInput = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');

function showMessage(message, type = 'error') {
    loginMessage.textContent = message;
    loginMessage.className = `message-feedback ${type}-message`;
    loginMessage.classList.remove('hidden-start');
}

function resetMessage() {
    loginMessage.textContent = '';
    loginMessage.classList.add('hidden-start');
}

/**
 * Mapeia o Apelido/Usuário para o formato de e-mail que o Firebase Auth requer.
 * Se contiver '@', assume que é o email completo (como o do administrador).
 */
function mapUsernameToEmail(username) {
    if (username.includes('@')) {
        // Se for email completo (como o admin), retorna o email
        return username.toLowerCase().trim();
    }
    // E-mail fictício usado no cadastro do Firebase Auth para usuários comuns
    // O domínio 'familiadefault.com' é o padrão para usuários não-admin
    return `${username.toLowerCase().trim()}@familiadefault.com`;
}


/**
 * Processa o evento de submissão do formulário de login.
 */
async function handleLogin(e) {
    e.preventDefault();
    resetMessage();

    if (!firebaseAuth || !firestoreDb) {
        showMessage('Erro crítico: Firebase não inicializado.', 'error');
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
        // 1. Autenticação
        // Se o email é 'thiagoferreira2flores@gmail.com', ele usa o Auth com o email real.
        // Se o email é 'usuariocomum', ele usa 'usuariocomum@familiadefault.com' no Auth.
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(emailToLogin, password);
        const firebaseUser = userCredential.user;

        // O ID do documento é SEMPRE o email completo usado no Auth.
        const documentId = firebaseUser.email; 
        
        // 2. Busca dados do Firestore - CRÍTICO: USA O documentId CORRETO
        // O Firestore está tentando ler o documento users/thiagoferreira2flores@gmail.com
        const userDoc = await firestoreDb.collection('users').doc(documentId).get();

        if (!userDoc.exists) {
            await firebaseAuth.signOut();
            showMessage('Perfil não encontrado no banco de dados. Contate o administrador.', 'error');
            return;
        }

        const userData = userDoc.data();

        // 3. Salva a sessão no LocalStorage
        const userSession = {
            uid: firebaseUser.uid,
            // Usa o username original se for email, ou o apelido se for default
            username: username.includes('@') ? username : username, 
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
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Erro de conexão.';
        } else if (error.code === 'permission-denied' || error.code === 'unavailable') {
             // Tratamento adicional para erros de regra/conexão
             errorMessage = 'Erro de permissão no banco de dados. Verifique as Regras do Firestore.';
        }

        console.error("Erro de Login:", error);
        showMessage(errorMessage, 'error');
        loginButton.disabled = false;
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    } finally {
        // Garantir que o botão volte ao normal em qualquer caso
        loginButton.disabled = false;
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}