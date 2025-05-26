document.addEventListener('DOMContentLoaded', () => {
    const cloudElements = document.querySelectorAll('.cloudmoon, .cloudmoon2, .cloudmoon3, .cloudmoon4, .cloudmoon5');

    // Очистка при уходе со страницы
    window.addEventListener('pagehide', () => {
        cloudElements.forEach(cloud => {
            cloud.style.animation = 'none';
        });
    });

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

    window.addEventListener('popstate', (event) => {
        if (event.state?.mode) {
        handlePageTransition(event.state.mode);
        } 
        else {
        location.reload();
        }
    });
    
    function handlePageTransition(mode) {
        transitionOverlay.classList.add('active');
        setTimeout(() => {
        window.location.href = `map.html?mode=${mode}`;
        }, 400);
    }

    // Плавное появление страницы
    document.body.style.opacity = '1';
});
