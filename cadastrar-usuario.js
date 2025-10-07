/**
 * Arquivo: cadastrar-usuario.js
 * Descrição: Lógica de criação de novos usuários (Auth e Firestore).
 * Depende de: firebase-init.js (para 'auth' e 'db')
 */

document.addEventListener('DOMContentLoaded', () => {
    // Acessa as variáveis globais 'db' (Firestore) e 'auth' (Firebase Auth)
    const firebaseAuth = typeof auth !== 'undefined' ? auth : null; 
    const firestoreDb = typeof db !== 'undefined' ? db : null; 
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
     * (Simplificamos para não precisar de Storage neste momento)
     */
    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            // Limita o tamanho do arquivo para evitar problemas de desempenho no Base64
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

        try {
            // Desabilita o botão
            const registerButton = registerForm.querySelector('button[type="submit"]');
            registerButton.disabled = true;
            registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

            // 3. VERIFICAÇÃO DE DUPLICIDADE (Firestore)
            const userDocCheck = await firestoreDb.collection(USERS_COLLECTION).doc(emailToRegister).get();

            if (userDocCheck.exists) {
                throw new Error("auth/email-already-in-use");
            }

            // 4. PREPARAÇÃO DA FOTO
            let fotoBase64 = null;
            if (fotoInput.files.length > 0) {
                fotoBase64 = await convertFileToBase64(fotoInput.files[0]);
            }
            
            // 5. CRIAÇÃO DE CONTA NO FIREBASE AUTH
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(emailToRegister, password);
            const firebaseUser = userCredential.user;
            
            // 6. CRIAÇÃO DO DOCUMENTO NO FIRESTORE
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
            messageEl.style.color = 'var(--success-color, green)'; 

            setTimeout(() => {
                window.location.href = 'login.html'; 
            }, 2000);

        } catch (error) {
            // Reabilita o botão
            const registerButton = registerForm.querySelector('button[type="submit"]');
            registerButton.disabled = false;
            registerButton.innerHTML = '<i class="fas fa-user-plus"></i> Cadastrar';

            let errorMessage = `Erro ao cadastrar.`;
            
            if (error.message.includes('A imagem é muito grande')) {
                 errorMessage = error.message;
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Este apelido já está em uso.";
            } else if (error.code === 'auth/weak-password') {
                 errorMessage = "A senha deve ter pelo menos 6 caracteres.";
            } else {
                 console.error("Erro detalhado:", error);
            }
            
            messageEl.textContent = errorMessage;
            messageEl.classList.add('error-message');
            messageEl.classList.remove('hidden-start');
        }
    }
});