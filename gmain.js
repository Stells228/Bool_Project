document.addEventListener('DOMContentLoaded', () => {
    // Позиционирование кнопок справа
    function positionToggleButtons() {
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        const totalButtons = toggleButtons.length;
        const viewportHeight = window.innerHeight;
        const buttonHeight = 60;
        const fixedSpacing = 20;
        const totalHeight = buttonHeight * totalButtons + fixedSpacing * (totalButtons - 1);
        const startTop = (viewportHeight - totalHeight) / 2;

        toggleButtons.forEach((btn, index) => {
            const topPosition = startTop + index * (buttonHeight + fixedSpacing);
            btn.style.top = `${topPosition}px`;
            btn.style.right = '0';
        });
    }

    positionToggleButtons();

    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);

    transitionOverlay.classList.remove('active');
    console.log('Transition overlay reset on gmain.html');

    const mainScreen = document.getElementById('main-screen');
    const gmapBtn = document.getElementById('gmap-btn');
    const tryBtn = document.getElementById('try-btn');
    const leftArrow = document.getElementById('left-arrow');

    if (!mainScreen) {
        console.error('Main screen element missing');
        return;
    }

    if (gmapBtn) {
        gmapBtn.addEventListener('click', () => {
            const gameMode = gmapBtn.dataset.mode;
            console.log('Play button clicked, redirecting to gmap.html with mode:', gameMode);
            transitionOverlay.classList.add('active');
            setTimeout(() => {
                window.location.href = `gmap.html?mode=${gameMode}`;
            }, 500); 
        });
    }

    if (tryBtn) {
        tryBtn.addEventListener('click', () => {
            console.log('Try button clicked, redirecting to try.html');
            transitionOverlay.classList.add('active');
            setTimeout(() => {
                window.location.href = 'try.html';
            }, 500);
        });
    }

    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            const leftTransition = document.querySelector('.left-transition-screen');
            console.log('Back button clicked, redirecting to main.html');
            
            // шторка слева-направо
            if (leftTransition) {
                leftTransition.classList.add('active');
            }
            
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 500);
        });
    }

    // Обновление позиции кнопок при изменении размера окна
    window.addEventListener('resize', () => {
        positionToggleButtons();
    });

    // Плавное появление страницы
    document.body.style.opacity = '1';
});
