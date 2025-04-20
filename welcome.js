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
                welcomeScreen.classList.add('hidden');
                console.log('Applying fade-out and slide-up animation');

                setTimeout(() => {
                    console.log('Animation complete, showing iframe');
                    welcomeScreen.style.display = 'none';
                    iframe.src = iframe.dataset.src;
                    iframe.style.display = 'block';
                }, 500); // Синхронизировано с CSS (0.5s)
            } 
            catch (error) {
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
});
