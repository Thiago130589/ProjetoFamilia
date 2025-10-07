/**
 * Arquivo: script.js
 * Descrição: Funções globais de autenticação, verificação de status e logout.
 * Depende de: firebase-init.js (para 'auth')
 */

let currentUser = null;

// 'auth' é variável global vinda de firebase-init.js
const firebaseAuth = typeof auth !== 'undefined' ? auth : null;


// =========================================================================
// 1. FUNÇÕES DE AUTENTICAÇÃO E VERIFICAÇÃO DE ESTADO
// =========================================================================

function checkLoginStatus() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const path = window.location.pathname;

    // Se estiver em telas de AUTH (login.html ou cadastrar-usuario.html), redireciona se já estiver logado.
    if (path.includes('login.html') || path.includes('cadastrar-usuario.html')) {
        if (usuarioLogado) {
            // Se já estiver logado, vai para a página inicial
            window.location.href = 'index.html';
        }
        return; 
    }

    // Lógica para as páginas PROTEGIDAS (como index.html)
    if (!usuarioLogado) {
        // Se não houver sessão, redireciona para o login
        console.log("Usuário não logado. Redirecionando para login.");
        window.location.href = 'login.html'; 
    } else {
        try {
            currentUser = JSON.parse(usuarioLogado);
            // Usuário logado. A página pode carregar.
        } catch (e) {
            console.error("Erro ao processar dados do usuário, forçando logout:", e);
            logoutUser();
        }
    }
}

async function logoutUser() {
    // Tenta deslogar do Firebase Auth
    if (firebaseAuth) {
        try {
            await firebaseAuth.signOut();
        } catch (error) {
            console.error("Erro ao tentar logout do Firebase:", error);
        }
    }
    
    // Limpa a sessão local
    localStorage.removeItem('usuarioLogado');
    currentUser = null;
    
    // Redireciona para o login
    window.location.href = 'login.html';
}


// =========================================================================
// 2. INICIALIZAÇÃO
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Chama a verificação de status imediatamente ao carregar o script
    checkLoginStatus();

    // Configurar botão de Logout (se existir na página)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }
});