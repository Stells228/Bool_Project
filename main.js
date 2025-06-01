document.addEventListener('DOMContentLoaded', () => {
    function positionToggleButtons() {
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        const totalButtons = toggleButtons.length;
        const viewportHeight = window.innerHeight;
        const buttonHeight = toggleButtons[0]?.offsetHeight || 70;
        const fixedSpacing = 20;
        const totalHeight = buttonHeight * totalButtons + fixedSpacing * (totalButtons - 1);
        const startTop = (viewportHeight - totalHeight) / 2;
        const cloudElements = document.querySelectorAll('.cloudmoon, .cloudmoon2, .cloudmoon3, .cloudmoon4, .cloudmoon5');

        window.addEventListener('pagehide', () => {
            cloudElements.forEach(cloud => {
                cloud.style.animation = 'none';
            });
        });

        toggleButtons.forEach((btn, index) => {
            const topPosition = startTop + index * (buttonHeight + fixedSpacing);
            btn.style.top = `${topPosition}px`;
            btn.style.right = '-60px';
        });
    }

    function loadLectureContent() {
        const lectureContent = document.getElementById('lecture-content');
        if (!lectureContent) return;
        lectureContent.innerHTML = '';

        const lectures = [
            { id: 1, title: '1. Двоичные наборы' },
            { id: 2, title: '2. Булевы функции' },
            { id: 3, title: '3. Остаточные функции и существенность переменных' },
            { id: 4, title: '4. Суперпозиция и термы' },
            { id: 5, title: '5. Дизъюнктивные нормальные формы (ДНФ)' },
            { id: 6, title: '6. Полиномиальные формы и полином Жегалкина' },
            { id: 7, title: '7. Замкнутость и полнота' },
            { id: 8, title: '8. Классы булевых функций' },
            { id: 9, title: '9. Минимизация ДНФ' }
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
                    window.location.href = `bool/lec${lecture.id}.html`;
                }, 300);
            });

            lectureContent.appendChild(block);
        });

        updateLectureBlocks();
    }

    positionToggleButtons();

    const windows = [
        { id: 'calc-window', btnId: 'calc-toggle' },
        { id: 'gear-window', btnId: 'gear-toggle' },
        { id: 'cup-window', btnId: 'cup-toggle' },
        { id: 'construction-window', btnId: 'construction-toggle' },
        { id: 'lecture-window', btnId: 'lecture-toggle' }
    ];

    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);

    transitionOverlay.classList.remove('active');
    console.log('Transition overlay reset on main.html');

    const mainScreen = document.getElementById('main-screen');
    const mapBtn = document.getElementById('map-btn');

    if (!mainScreen || !mapBtn) {
        console.error('Critical elements missing:', { mainScreen, mapBtn });
        return;
    }

    const images = document.querySelectorAll('.image-container img');
    images.forEach(img => {
        img.addEventListener('error', () => {
            console.error(`Failed to load image: ${img.src}`);
        });
        img.addEventListener('load', () => {
            console.log(`Image loaded: ${img.src}`);
        });
    });

    const getClosedPosition = () => {
        const width = window.innerWidth;
        if (width <= 507) return '-85vw';
        if (width <= 754) return '-80vw';
        if (width >= 684 && width <= 800) return '-78vw';
        return '-600px';
    };

    const fabMenu = document.getElementById('fab-menu');
    const fabMain = document.getElementById('fab-main');

    fabMain.addEventListener('click', (e) => {
        e.stopPropagation();
        fabMenu.classList.toggle('open');

        // Анимация "покачивания" при открытии/закрытии
        fabMain.style.transform = fabMenu.classList.contains('open')
            ? 'scale(1.1) rotate(90deg)'
            : 'scale(1) rotate(0)';

        // Добавляем/удаляем класс для анимации
        if (fabMenu.classList.contains('open')) {
            fabMain.classList.add('active');
        }
        else {
            fabMain.classList.remove('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!fabMenu.contains(e.target)) {
            fabMenu.classList.remove('open');
            fabMain.querySelector('img').src = 'Photos/up.png';
        }
    });

    function openSlideWindow(id) {
        document.getElementById('fab-close').style.display = 'flex';
        document.getElementById('fab-main').style.display = 'none';
        ['calc-window', 'gear-window', 'cup-window', 'construction-window', 'lecture-window'].forEach(winId => {
            const win = document.getElementById(winId);
            if (win) {
                win.style.left = getClosedPosition();
                win.classList.remove('open');
                win.classList.add('closed');
            }
        });
        const win = document.getElementById(id);
        if (win) {
            win.style.left = '0px';
            win.classList.add('open');
            win.classList.remove('closed');
        }
        fabMenu.classList.remove('open');
    }

    document.getElementById('fab-close').addEventListener('click', () => {
        // Закрыть all окна
        ['calc-window', 'gear-window', 'cup-window', 'construction-window', 'lecture-window'].forEach(winId => {
            const win = document.getElementById(winId);
            if (win) {
                win.style.left = getClosedPosition();
                win.classList.remove('open');
                win.classList.add('closed');
            }
        });
        
        document.getElementById('fab-main').style.display = 'flex';
        document.getElementById('fab-close').style.display = 'none';
    });

    document.getElementById('fab-calc').onclick = () => openSlideWindow('calc-window');
    document.getElementById('fab-gear').onclick = () => openSlideWindow('gear-window');
    document.getElementById('fab-cup').onclick = () => openSlideWindow('cup-window');
    document.getElementById('fab-constructor').onclick = () => openSlideWindow('construction-window');
    document.getElementById('fab-lecture').onclick = () => {
        openSlideWindow('lecture-window');
        loadLectureContent();
    };

    function checkTextOverlap() {
        const title = document.querySelector('.Title');
        const buttons = document.querySelectorAll('.fab-menu, .map-btn');
        if (!title) {
            console.warn('Title element not found');
            return;
        }
        const titleRect = title.getBoundingClientRect();
        buttons.forEach(button => {
            const btnRect = button.getBoundingClientRect();
            const isOverlapping = !(
                titleRect.right < btnRect.left ||
                titleRect.left > btnRect.right ||
                titleRect.bottom < btnRect.top ||
                titleRect.top > btnRect.bottom
            );
            if (isOverlapping && !button.classList.contains('hidden')) {
                console.warn(`Text overlap detected with: ${button.id || button.className}`);
                button.style.opacity = '0.5';
            }
            else if (!button.classList.contains('hidden')) {
                button.style.opacity = '1';
            }
        });
    }

    window.addEventListener('resize', () => {
        checkTextOverlap();
        // Пересчитываем позиции кнопок при изменении размера окна
        positionToggleButtons();

        // Закрываем окна при ресайзе, если они закрыты
        ['calc-window', 'gear-window', 'cup-window', 'construction-window', 'lecture-window'].forEach(id => {
            const slideWindow = document.getElementById(id);
            if (slideWindow && slideWindow.classList.contains('closed')) {
                slideWindow.style.left = getClosedPosition();
            }
        });
    });

    window.addEventListener('load', () => {
        checkTextOverlap();
        document.body.style.opacity = '1';
    });

    function handleMapButtonClick() {
        const gameMode = mapBtn.dataset.mode;
        transitionOverlay.classList.add('active');

        requestIdleCallback(() => {
            history.pushState({ mode: gameMode }, '', `map.html?mode=${gameMode}`);
            window.dispatchEvent(new Event('popstate'));
        }, { timeout: 300 });
    }

    if (mapBtn && mainScreen) {
        mapBtn.removeEventListener('click', handleMapButtonClick);
        mapBtn.addEventListener('click', handleMapButtonClick);
    }
    else {
        console.warn('Map button or main screen not found');
    }

    // Закрытие окон при клике вне их
    document.addEventListener('click', (e) => {
        ['calc-window', 'gear-window', 'cup-window', 'construction-window', 'lecture-window'].forEach(id => {
            const slideWindow = document.getElementById(id);
            if (slideWindow && slideWindow.classList.contains('open')) {
                const isClickInside = slideWindow.contains(e.target) || fabMenu.contains(e.target);
                if (!isClickInside) {
                    slideWindow.style.left = getClosedPosition();
                    slideWindow.classList.remove('open');
                    slideWindow.classList.add('closed');
                }
            }
        });
    });

    document.addEventListener('click', (e) => {
        ['calc-window', 'gear-window', 'cup-window', 'construction-window', 'lecture-window'].forEach(id => {
            const slideWindow = document.getElementById(id);
            if (slideWindow && slideWindow.classList.contains('open')) {
                const isClickInside = slideWindow.contains(e.target) || fabMenu.contains(e.target);
                if (!isClickInside) {
                    slideWindow.style.left = getClosedPosition();
                    slideWindow.classList.remove('open');
                    slideWindow.classList.add('closed');
                    document.getElementById('fab-main').style.display = 'flex';
                    document.getElementById('fab-close').style.display = 'none';
                }
            }
        });
    });

    document.body.style.opacity = '1';
    transitionOverlay.classList.remove('active');

    const rightArrow = document.getElementById('right-arrow');
    const transitionScreen = document.getElementById('transition-screen');

    rightArrow.addEventListener('click', () => {
        transitionScreen.classList.add('active');
        setTimeout(() => {
            history.pushState({}, '', 'gmain.html');
            window.dispatchEvent(new Event('popstate'));
        }, 500);
    });

    // Обработка popstate для переходов
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

    window.updateLectureBlocks = function () {
        const results = JSON.parse(localStorage.getItem('lectureTestResults') || '{}');

        document.querySelectorAll('.lecture-block').forEach(block => {
            const lectureId = block.dataset.lectureId;
            const result = results[`lecture${lectureId}`];
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
    };

    if (typeof updateLectureBlocks === 'function') {
        updateLectureBlocks();
    }
});