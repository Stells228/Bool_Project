document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyDlHLCPtlITZ4ezjYWbUYA3r70BgensOl8",
        authDomain: "hehe-63f6d.firebaseapp.com",
        projectId: "hehe-63f6d",
        storageBucket: "hehe-63f6d.appspot.com",
        messagingSenderId: "54586209991",
        appId: "1:54586209991:web:ecaa663106b0160a1cb0e2"
    };

    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    const welcomeScreen = document.getElementById('welcome-screen');
    const iframe = document.getElementById('main-iframe');
    const authModal = document.getElementById('auth-modal');

    if (!welcomeScreen || !iframe || !authModal) {
        console.error('Critical elements missing');
        return;
    }

    auth.onAuthStateChanged((user) => {
        if (user) {
            hideAuthModal();
            initWelcomeScreen();
        } 
        else {
            showAuthModal();
        }
    });

    function initWelcomeScreen() {
        welcomeScreen.style.display = 'block';

        const waitForImages = () => {
            return Promise.all(
                Array.from(welcomeScreen.querySelectorAll('img')).map(img =>
                    img.complete ? Promise.resolve() :
                        new Promise(resolve => { img.onload = img.onerror = resolve; }))
            );
        };

        waitForImages().then(() => {
            welcomeScreen.style.opacity = '1';
            welcomeScreen.classList.add('loaded');
            setTimeout(loadVisNetwork, 1000);
            setupPWA();
            setupWelcomeScreenClickHandler();
            setupAuthUI();
        }).catch(console.error);
    }

    // Настройка UI для авторизованного пользователя
    function setupAuthUI() {
        const oldBtn = document.querySelector('.user-auth-btn');
        if (oldBtn) oldBtn.remove();

        const user = auth.currentUser;
        if (!user) return;

        const userBtn = document.createElement('div');
        userBtn.className = 'user-auth-btn';
        userBtn.innerHTML = `
            <span>${user.email}</span>
            <button class="sign-out-btn">Выйти</button>
        `;

        document.querySelector('.image-container').appendChild(userBtn);

        userBtn.querySelector('.sign-out-btn').addEventListener('click', () => {
            auth.signOut().catch(console.error);
        });
    }

    function setupAuthModal() {
        if (!authModal) return;

        if (!authModal.querySelector('.auth-content')) {
            authModal.innerHTML = `
                <div class="auth-content">
                    <h2>Добро пожаловать!</h2>
                    <div class="auth-buttons">
                        <button id="login-btn" class="auth-btn">Войти</button>
                        <button id="register-btn" class="auth-btn">Зарегистрироваться</button>
                    </div>
                </div>
            `;
        }

        // Очищаем старые обработчики
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');

        if (loginBtn) loginBtn.onclick = null;
        if (registerBtn) registerBtn.onclick = null;

        if (loginBtn) loginBtn.addEventListener('click', showLoginForm);
        if (registerBtn) registerBtn.addEventListener('click', showRegisterForm);

        function showLoginForm(e) {
            if (e) e.preventDefault();
            authModal.innerHTML = `
                <div class="auth-content">
                    <h2>Вход</h2>
                    <form id="login-form" class="auth-form">
                        <input type="email" placeholder="Email" required>
                        <input type="password" placeholder="Пароль" required>
                        <button type="submit" class="auth-btn">Войти</button>
                        <div class="auth-links">
                            <a href="#" id="show-register">Нет аккаунта? Зарегистрироваться</a>
                        </div>
                    </form>
                </div>
            `;

            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const email = e.target[0].value;
                    const password = e.target[1].value;

                    auth.signInWithEmailAndPassword(email, password)
                        .catch(handleAuthError);
                });
            }

            const showRegister = document.getElementById('show-register');
            if (showRegister) {
                showRegister.addEventListener('click', (e) => {
                    e.preventDefault();
                    showRegisterForm(e);
                });
            }
        }

        function showRegisterForm(e) {
            if (e) e.preventDefault();
            authModal.innerHTML = `
                <div class="auth-content">
                    <h2>Регистрация</h2>
                    <form id="register-form" class="auth-form">
                        <input type="email" placeholder="Email" required>
                        <input type="password" placeholder="Пароль" required>
                        <input type="password" placeholder="Повторите пароль" required>
                        <button type="submit" class="auth-btn">Зарегистрироваться</button>
                        <div class="auth-links">
                            <a href="#" id="show-login">Уже есть аккаунт? Войти</a>
                        </div>
                    </form>
                </div>
            `;

            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const email = e.target[0].value;
                    const password = e.target[1].value;
                    const confirmPassword = e.target[2].value;

                    const oldError = document.querySelector('.auth-error');
                    if (oldError) oldError.remove();

                    if (password !== confirmPassword) {
                        showError("Пароли не совпадают");
                        return;
                    }

                    auth.createUserWithEmailAndPassword(email, password)
                        .catch(handleAuthError);
                });
            }

            const showLogin = document.getElementById('show-login');
            if (showLogin) {
                showLogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    showLoginForm(e);
                });
            }
        }

        function handleAuthError(error) {
            let errorMessage = "Ошибка авторизации";
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "Email уже используется";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Некорректный email";
                    break;
                case 'auth/weak-password':
                    errorMessage = "Пароль должен содержать минимум 6 символов";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Неверный пароль";
                    break;
                case 'auth/user-not-found':
                    errorMessage = "Пользователь не найден";
                    break;
                default:
                    errorMessage = error.message;
            }

            showError(errorMessage);
            showNotification(errorMessage);
        }

        function showNotification(message) {
            // Удаляем старое уведомление, если есть
            const oldNotification = document.querySelector('.auth-notification');
            if (oldNotification) oldNotification.remove();

            const notification = document.createElement('div');
            notification.className = 'auth-notification';
            notification.innerHTML = `
                <img src="Photos/warning.png" alt="Warning">
                <span>${message}</span>
            `;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        function showError(message) {
            const errorElement = document.createElement('p');
            errorElement.className = 'auth-error';
            errorElement.textContent = message;
            const authContent = document.querySelector('.auth-content');
            if (authContent) authContent.appendChild(errorElement);
        }
    }

    function showAuthModal() {
        // Показываем приветственный экран (заблюрен)
        welcomeScreen.style.display = 'block';
        welcomeScreen.style.opacity = '1';

        // Показываем модальное окно поверх
        authModal.style.display = 'flex';
        setupAuthModal();
    }

    function hideAuthModal() {
        if (authModal) {
            authModal.style.display = 'none';
        }
    }

    // vis-network
    function loadVisNetwork() {
        if (window.vis) return Promise.resolve();

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js';
            script.onload = script.onerror = resolve;
            document.head.appendChild(script);
        });
    }

    function setupWelcomeScreenClickHandler() {
        if (!welcomeScreen) return;

        welcomeScreen.addEventListener('click', async () => {
            try {
                if (!window.vis) {
                    console.log('Waiting for vis-network to load...');
                    await loadVisNetwork();
                }

                welcomeScreen.classList.add('hidden');
                await new Promise(resolve => setTimeout(resolve, 500));

                if (iframe) {
                    iframe.src = iframe.dataset.src;
                    iframe.style.display = 'block';
                }
            } 
            catch (error) {
                console.error('Transition error:', error);
                if (iframe) {
                    iframe.src = iframe.dataset.src;
                    iframe.style.display = 'block';
                }
            }
        });
    }

    // Настройка PWA
    function setupPWA() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful');
                    })
                    .catch(err => {
                        console.error('ServiceWorker registration failed:', err);
                    });
            });
        }

        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            createInstallButton();
        });

        function createInstallButton() {
            const installButton = document.createElement('button');
            installButton.className = 'install-btn';
            installButton.textContent = 'Установить приложение';
            document.body.appendChild(installButton);

            installButton.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User ${outcome === 'accepted' ? 'accepted' : 'rejected'} the install prompt`);
                installButton.style.display = 'none';
                deferredPrompt = null;
            });
        }
    }
});