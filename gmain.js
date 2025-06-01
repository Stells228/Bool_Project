document.addEventListener('DOMContentLoaded', () => {
    const cloudElements = document.querySelectorAll('.cloudmoon, .cloudmoon2, .cloudmoon3, .cloudmoon4, .cloudmoon5');

    // Очистка анимаций при уходе со страницы
    window.addEventListener('pagehide', () => {
        cloudElements.forEach(cloud => {
            cloud.style.animation = 'none';
        });
    });

    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);
    transitionOverlay.classList.remove('active');
    console.log('gmain.js: Transition overlay reset');

    const mainScreen = document.getElementById('main-screen');
    const gmapBtn = document.getElementById('gmap-btn');
    const tryBtn = document.getElementById('try-btn');
    const leftArrow = document.getElementById('left-arrow');
    const lectureBtn = document.getElementById('lecture-btn');
    const lectureWindow = document.getElementById('lecture-window');

    // Инициализация gameMode
    const urlParams = new URLSearchParams(window.location.search);
    let gameMode = urlParams.get('mode') || localStorage.getItem('gameMode') || 'normal';
    localStorage.setItem('gameMode', gameMode);
    console.log('gmain.js: Инициализация gameMode:', gameMode, 'URL mode:', urlParams.get('mode'));

    if (!mainScreen) {
        console.error('gmain.js: Main screen element missing');
        return;
    }

    if (gmapBtn) {
        gmapBtn.addEventListener('click', () => {
            const mode = localStorage.getItem('gameMode') || 'normal';
            console.log('gmain.js: Play button clicked, redirecting to gmap.html with mode:', mode);
            transitionOverlay.classList.add('active');
            setTimeout(() => {
                window.location.href = `gmap.html?mode=${mode}`;
            }, 500);
        });
    }

    if (tryBtn) {
        tryBtn.addEventListener('click', () => {
            console.log('gmain.js: Try button clicked, redirecting to try.html');
            transitionOverlay.classList.add('active');
            setTimeout(() => {
                window.location.href = 'try.html';
            }, 500);
        });
    }

    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            const leftTransition = document.querySelector('.left-transition-screen');
            const mode = localStorage.getItem('gameMode') || 'normal';
            console.log('gmain.js: Back button clicked, redirecting to main.html with mode:', mode);
            if (leftTransition) {
                leftTransition.classList.add('active');
            }
            setTimeout(() => {
                window.location.href = `main.html?mode=${mode}`;
            }, 500);
        });
    }

    if (lectureBtn) {
        lectureBtn.addEventListener('click', () => {
            loadLectureContent();
            lectureWindow.classList.toggle('open');
            lectureWindow.classList.toggle('closed');
            console.log('gmain.js: Lecture window toggled');
        });
    }

    function loadLectureContent() {
        const lectureContent = document.getElementById('lecture-content');
        if (!lectureContent) return;
        lectureContent.innerHTML = '';

        const lectures = [
            { id: 1, title: '1. Введение в теорию графов' },
            { id: 2, title: '2. Основные определения' },
            { id: 3, title: '3. Способы представления графа' },
            { id: 4, title: '4. Операции над графами' },
            { id: 5, title: '5. Пути и связность' },
            { id: 6, title: '6. Специальные графы' },
            { id: 7, title: '7. Планарные графы' },
            { id: 8, title: '8. Раскраска графов' },
            { id: 9, title: '9. Деревья' },
            { id: 10, title: '10. Двоичные деревья' },
            { id: 11, title: '11. Остовные деревья' },
            { id: 12, title: '12. Ориентированные деревья' },
            { id: 13, title: '13. Расстояния в графе' }
        ];

        lectures.forEach(lecture => {
            const block = document.createElement('div');
            block.className = 'lecture-block';
            block.dataset.lectureId = lecture.id;

            const title = document.createElement('h3');
            title.textContent = lecture.title;
            block.appendChild(title);

            const starsContainer = document.createElement('div');
            starsContainer.className = 'lecture-stars';
            block.appendChild(starsContainer);

            block.addEventListener('click', () => {
                transitionOverlay.classList.add('active');
                setTimeout(() => {
                    window.location.href = `graph/glec${lecture.id}.html`;
                }, 300);
            });

            lectureContent.appendChild(block);
        });

        updateLectureBlocks();
        console.log('gmain.js: Lecture content loaded');
    }

    function updateLectureBlocks() {
        const results = JSON.parse(localStorage.getItem('lectureTestResults') || '{}');
        document.querySelectorAll('.lecture-block').forEach(block => {
            const lectureId = block.dataset.lectureId;
            const result = results[`glec${lectureId}`];
            const starsContainer = block.querySelector('.lecture-stars');

            if (!starsContainer) return;

            starsContainer.innerHTML = '';

            if (result) {
                const percentage = (result.correct / result.total) * 100;

                for (let i = 0; i < 3; i++) {
                    const star = document.createElement('span');
                    star.className = 'lecture-star';
                    star.textContent = '★';

                    if (percentage === 100 && i < 3 ||
                        percentage >= 50 && i < 2 ||
                        percentage >= 30 && i < 1) {
                        star.classList.add('filled');
                    }

                    starsContainer.appendChild(star);
                }
            }
        });
        console.log('gmain.js: Lecture blocks updated');
    }

    document.addEventListener('click', (e) => {
        if (lectureWindow && lectureWindow.classList.contains('open') && 
            !lectureWindow.contains(e.target) && 
            e.target !== lectureBtn) {
            lectureWindow.classList.remove('open');
            lectureWindow.classList.add('closed');
            console.log('gmain.js: Lecture window closed');
        }
    });

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
            window.location.href = `gmap.html?mode=${mode}`;
        }, 400);
    }

    // Плавное появление страницы
    document.body.style.opacity = '1';
});