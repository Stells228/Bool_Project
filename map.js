document.addEventListener('DOMContentLoaded', () => {
    // Кэшируем элементы DOM
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);

    const mainMenuBtn = document.getElementById('main-menu-btn');
    const levelScroll = document.querySelector('.level-scroll');
    const levelLinks = document.querySelectorAll('.level-block-link');

    // Проверка наличия критических элементов
    if (!mainMenuBtn || !levelScroll || !levelLinks.length) {
        console.error('Critical elements missing:', { mainMenuBtn, levelScroll, levelLinks });
        return;
    }

    // Сброс overlay
    transitionOverlay.classList.remove('active');

    // Обработчик кнопки главного меню
    mainMenuBtn.addEventListener('click', () => {
        // Отключаем анимации облаков для плавного перехода
        document.querySelectorAll('.cloud1, .cloud2, .cloud3, .cloud4, .cloud5').forEach(el => {
            el.style.animation = 'none';
        });

        transitionOverlay.classList.add('active');
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 300); // Уменьшили время для ускорения
    });

    // Получаем параметры URL и данные из localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('mode') || 'normal';
    let completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    if (!Array.isArray(completedLevels)) completedLevels = [];

    // Обновление доступности уровней
    function updateLevelAvailability() {
        const highestCompleted = completedLevels.length > 0 ? Math.max(...completedLevels) : 0;
        const nextLevel = highestCompleted + 1;

        levelLinks.forEach(link => {
            const levelBlock = link.querySelector('.level-block');
            const level = parseInt(levelBlock.dataset.level);
            const href = `level/level${level}.html?mode=${gameMode}`;

            if (gameMode === 'passing') {
                if (completedLevels.includes(level) || level === nextLevel) {
                    link.classList.remove('disabled');
                    link.setAttribute('href', href);
                } 
                else {
                    link.classList.add('disabled');
                    link.removeAttribute('href');
                }
            } 
            else {
                link.classList.remove('disabled');
                link.setAttribute('href', href);
            }
        });
    }

    // Вызываем обновление уровней
    updateLevelAvailability();

    // Обработчик сообщений для сброса или завершения уровня
    window.addEventListener('message', (event) => {
        if (event.data.type === 'resetGame') {
            completedLevels = [];
            localStorage.removeItem('completedLevels');
            updateLevelAvailability();
            levelScroll.scrollTo({ left: 0, behavior: 'smooth' });
        } 
        else if (event.data.type === 'levelCompleted') {
            const level = event.data.level;
            if (!completedLevels.includes(level)) {
                completedLevels.push(level);
                completedLevels.sort((a, b) => a - b);
                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                updateLevelAvailability();
            }
        }
    }, { once: false }); // Оставляем постоянное прослушивание, так как уровни могут завершаться

    // Плавное появление страницы
    document.body.style.opacity = '1';
});
