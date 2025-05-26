document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    const iframe = document.getElementById('main-iframe');
    
    if (!welcomeScreen || !iframe) {
        console.error('Critical elements missing:', { welcomeScreen, iframe });
        return;
    }

    // Функция для проверки загрузки всех изображений
    const waitForImages = () => {
        const images = welcomeScreen.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', () => {
                    console.error(`Failed to load image: ${img.src}`);
                    resolve(); // Продолжаем при ошибке
                });
            });
        });
        return Promise.all(promises);
    };

    // Инициализация
    waitForImages().then(() => {
        console.log('All images loaded, initializing welcome screen');
        welcomeScreen.style.opacity = '1';
        welcomeScreen.classList.add('loaded');

        // Обработчик клика
        welcomeScreen.addEventListener('click', () => {
            console.log('Welcome screen clicked');
            try {
                // Динамическая загрузка библиотеки перед переходом
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js';
                script.onload = () => {
                    console.log('Vis Network loaded');
                    proceedToMain();
                };
                script.onerror = () => {
                    console.error('Failed to load Vis Network');
                    proceedToMain();
                };
                document.head.appendChild(script);
                
                function proceedToMain() {
                    welcomeScreen.classList.add('hidden');
                    setTimeout(() => {
                        welcomeScreen.style.display = 'none';
                        iframe.src = iframe.dataset.src;
                        iframe.style.display = 'block';
                    }, 500);
                }
            } catch (error) {
                console.error('Error handling welcome screen click:', error);
                welcomeScreen.style.display = 'none';
                iframe.src = iframe.dataset.src;
                iframe.style.display = 'block';
            }
        });
    })
    .catch(error => {
        console.error('Error loading images:', error);
        welcomeScreen.style.opacity = '1';
    });
    
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('ServiceWorker registration successful');
            })
            .catch(err => {
              console.log('ServiceWorker registration failed: ', err);
            });
        });
      }

    let deferredPrompt;
    let installButton = null;

    window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // Сохраняем событие для дальеншего use
    deferredPrompt = e;
    
    // Создаём кнопку установки только если ее еще нет
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.textContent = 'Установить приложение';
        installButton.style.position = 'fixed';
        installButton.style.bottom = '20px';
        installButton.style.left = '50%';
        installButton.style.transform = 'translateX(-50%)';
        installButton.style.zIndex = '1001';
        installButton.style.padding = '10px 20px';
        installButton.style.borderRadius = '5px';
        installButton.style.backgroundColor = '#ffffff';
        installButton.style.color = '#416190';
        installButton.style.border = 'none';
        installButton.style.cursor = 'pointer';
        
        document.body.appendChild(installButton);
        
        installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        // Подсказка установки
        deferredPrompt.prompt();
        
        // Ждём ответа юзера
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('Пользователь готов');
        } 
        else {
            console.log('Пользователь собака такая');
        }
        
        // Скрываем кнопку после выбора
        if (installButton) {
            installButton.style.display = 'none';
        }
        
        // Очищаем ссылку 
        deferredPrompt = null;
        });
    }
    });

    window.addEventListener('appinstalled', () => {
    console.log('Приложение успешно установлено');
    if (installButton) {
        installButton.remove();
        installButton = null;
    }
    });

    welcomeScreen.addEventListener('click', () => {
        // Загружаем библиотеку ПЕРЕД СОБАЧИМ показом iframe
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js';
        document.head.appendChild(script);

        welcomeScreen.classList.add('hidden');
        setTimeout(() => {
            iframe.src = iframe.dataset.src;
            iframe.style.display = 'block';
        }, 500);
    });
});
