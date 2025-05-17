document.addEventListener('DOMContentLoaded', () => {
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);
    transitionOverlay.classList.remove('active');

    const mainScreen = document.getElementById('main-screen');
    const gmapBtn = document.getElementById('gmap-btn');
    const tryBtn = document.getElementById('try-btn');
    const leftArrow = document.getElementById('left-arrow');
    const transitionScreen = document.getElementById('transition-screen');

    // Функция для перехода на другую страницу
    function navigateTo(page) {
        transitionScreen.classList.add('active');
        setTimeout(() => {
            window.location.href = page;
        }, 500);
    }

    // Обработчики кнопок
    if (gmapBtn) {
        gmapBtn.addEventListener('click', () => {
            const gameMode = gmapBtn.dataset.mode;
            navigateTo(`gmap.html?mode=${gameMode}`);
        });
    }

    if (tryBtn) {
        tryBtn.addEventListener('click', () => {
            navigateTo('try.html');
        });
    }

    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            navigateTo('main.html');
        });
    }

    // Плавное появление страницы
    document.body.style.opacity = '1';
});