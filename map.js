document.addEventListener('DOMContentLoaded', () => {
    const levelScroll = document.querySelector('.level-scroll');
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    const mainMenuBtn = document.getElementById('main-menu-btn');
    const levelLinks = document.querySelectorAll('.level-block-link');

    const scrollAmount = 344 + 20;
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('mode') || 'normal';

    let completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    if (!Array.isArray(completedLevels)) completedLevels = [];

    updateLevelAvailability();

    // Обработка нажатия кнопки главного меню
    mainMenuBtn.addEventListener('click', () => {
        console.log('Main menu button clicked');
        try {
            if (window.parent !== window) {
                // отправка сообщения родителю
                window.parent.postMessage({ type: 'return-to-main' }, '*');
            } 
            else {
                window.location.href = 'main.html';
            }
        } catch (error) {
            console.error('Error handling main menu click:', error);
            window.location.href = 'main.html';
        }
    });

    window.addEventListener('message', (event) => {
        if (event.data.type === 'resetGame') {
            completedLevels = [];
            localStorage.removeItem('completedLevels');
            updateLevelAvailability();
            levelScroll.scrollTo({ left: 0, behavior: 'smooth' });
        }
        
        if (event.data.type === 'levelCompleted') {
            const level = event.data.level;
            if (!completedLevels.includes(level)) {
                completedLevels.push(level);
                completedLevels.sort((a, b) => a - b);
                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                updateLevelAvailability();
            }
        }
    });

    function updateLevelAvailability() {
        const highestCompleted = completedLevels.length > 0 ? Math.max(...completedLevels) : 0;
        const nextLevel = highestCompleted + 1;

        levelLinks.forEach(link => {
            const level = parseInt(link.querySelector('.level-block').dataset.level);
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

    scrollLeftBtn.addEventListener('click', () => {
        levelScroll.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    scrollRightBtn.addEventListener('click', () => {
        levelScroll.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
});
