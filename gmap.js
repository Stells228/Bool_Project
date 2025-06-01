document.addEventListener('DOMContentLoaded', () => {
    const mainMenuBtn = document.getElementById('main-menu-btn');
    const levelScroll = document.querySelector('.level-scroll');
    const levelLinks = document.querySelectorAll('.level-block-link');

    if (!mainMenuBtn || !levelScroll || !levelLinks.length) {
        console.error('gmap.js: Критические элементы отсутствуют:', { mainMenuBtn, levelScroll, levelLinks });
        return;
    }

    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);
    transitionOverlay.classList.remove('active');

    mainMenuBtn.addEventListener('click', () => {
        const mode = localStorage.getItem('gameMode') || 'normal';
        document.querySelectorAll('.cloud1, .cloud2, .cloud3, .cloud4, .cloud5').forEach(el => {
            el.style.animation = 'none';
        });
        transitionOverlay.classList.add('active');
        setTimeout(() => {
            window.location.href = `gmain.html?mode=${mode}`;
        }, 300);
        console.log('gmap.js: Переход в gmain.html с режимом:', mode);
    });

    const urlParams = new URLSearchParams(window.location.search);
    let gameMode = urlParams.get('mode') || localStorage.getItem('gameMode') || 'normal';
    localStorage.setItem('gameMode', gameMode);
    console.log('gmap.js: Инициализация gameMode:', gameMode, 'URL mode:', urlParams.get('mode'));

    let completedLevels = JSON.parse(localStorage.getItem('gCompletedLevels')) || [];
    if (!Array.isArray(completedLevels)) {
        completedLevels = [];
        localStorage.setItem('gCompletedLevels', JSON.stringify(completedLevels));
    }
    completedLevels = completedLevels.map(Number).filter(n => !isNaN(n));

    function updateLevelAvailability() {
        levelLinks.forEach(link => {
            const levelBlock = link.querySelector('.level-block');
            const level = parseInt(levelBlock.dataset.level);
            let href = `glevel/glevel${level}.html?mode=${gameMode}`;
            link.classList.remove('disabled');
            link.setAttribute('href', href);
            console.log(`gmap.js: Установлена ссылка для уровня ${level}:`, href);

            if (gameMode === 'passing') {
                const maxCompleted = completedLevels.length ? Math.max(...completedLevels) : 0;
                const isNextLevel = level === maxCompleted + 1;
                const isCompleted = completedLevels.includes(level);
                const isAccessible = level === 1 || isCompleted || isNextLevel;

                if (!isAccessible) {
                    link.classList.add('disabled');
                    link.removeAttribute('href');
                    levelBlock.style.opacity = '0.5';
                    levelBlock.style.cursor = 'not-allowed';
                } 
                else {
                    levelBlock.style.opacity = '1';
                    levelBlock.style.cursor = 'pointer';
                }
            } 
            else {
                levelBlock.style.opacity = '1';
                levelBlock.style.cursor = 'pointer';
            }
        });
    }

    window.addEventListener('message', (event) => {
        if (event.data.type === 'levelCompleted') {
            const level = event.data.level;
            if (!completedLevels.includes(level)) {
                completedLevels.push(level);
                localStorage.setItem('gCompletedLevels', JSON.stringify(completedLevels));
                updateLevelAvailability();
                console.log('gmap.js: Уровень завершён:', level, 'completedLevels:', completedLevels);
            }
        }
    });

    updateLevelAvailability();
    document.body.style.opacity = '1';
});