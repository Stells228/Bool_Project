document.addEventListener('DOMContentLoaded', () => {
    const cloudElements = document.querySelectorAll('.cloudmoon, .cloudmoon2, .cloudmoon3, .cloudmoon4, .cloudmoon5');

    // Функция загрузки лекционного контента
    function loadLectureContent() {
        const lectureContent = document.getElementById('lecture-content');
        if (!lectureContent) return;
        lectureContent.innerHTML = '';

        const lectures = [
            { id: 1, title: '1. Основы теории графов' },
            { id: 2, title: '2. Виды графов' },
            { id: 3, title: '3. Связность графов' },
            { id: 4, title: '4. Деревья и остовы' },
            { id: 5, title: '5. Эйлеровы и гамильтоновы графы' },
            { id: 6, title: '6. Планарность графов' },
            { id: 7, title: '7. Раскраска графов' },
            { id: 8, title: '8. Потоки в сетях' },
            { id: 9, title: '9. Алгоритмы на графах' }
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
                setTimeout(() => { window.location.href = `graph/glec${lecture.id}.html`; }, 300);
            });

            lectureContent.appendChild(block);
        });

        updateLectureBlocks();
    }

    // Функция обновления звёзд
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
    }

    // Добавляем обработчик для кнопки лекций
    document.addEventListener('DOMContentLoaded', () => {
        const lectureToggle = document.getElementById('lecture-toggle');
        const lectureWindow = document.getElementById('lecture-window');

        if (lectureToggle && lectureWindow) {
            lectureToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = lectureWindow.classList.contains('open');

                if (!isOpen) {
                    loadLectureContent();
                }

                lectureWindow.classList.toggle('open');
            });
        }

        // Плавное появление страницы
        document.body.style.opacity = '1';
    });

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
