document.addEventListener('DOMContentLoaded', () => {
    // Позиционирование кнопок
    function positionToggleButtons() {
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        const totalButtons = toggleButtons.length;
        const viewportHeight = window.innerHeight;
        const buttonHeight = toggleButtons[0]?.offsetHeight || 70; // Высота кнопки
        const fixedSpacing = 20; // Фиксированное расстояние между кнопками в пикселях
        const totalHeight = buttonHeight * totalButtons + fixedSpacing * (totalButtons - 1); // Общая высота всех кнопок и промежутков
        const startTop = (viewportHeight - totalHeight) / 2; // Центр кнопки по вертикали

        toggleButtons.forEach((btn, index) => {
            const topPosition = startTop + index * (buttonHeight + fixedSpacing);
            btn.style.top = `${topPosition}px`;
            btn.style.right = '-60px';
        });
    }

    // Вызываем функцию при загрузке
    positionToggleButtons();

    const windows = [
        { id: 'calc-window', btnId: 'calc-toggle' },
        { id: 'gear-window', btnId: 'gear-toggle' },
        { id: 'cup-window', btnId: 'cup-toggle' },
        { id: 'construction-window', btnId: 'construction-toggle' }
    ];

    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);

    // Сброс overlay при загрузке
    transitionOverlay.classList.remove('active');
    console.log('Transition overlay reset on main.html');

    const mainScreen = document.getElementById('main-screen');
    const mapBtn = document.getElementById('map-btn');

    if (!mainScreen || !mapBtn) {
        console.error('Critical elements missing:', { mainScreen, mapBtn });
        return;
    }

    // Проверка загрузки изображений
    const images = document.querySelectorAll('.image-container img');
    images.forEach(img => {
        img.addEventListener('error', () => {
            console.error(`Failed to load image: ${img.src}`);
        });
        img.addEventListener('load', () => {
            console.log(`Image loaded: ${img.src}`);
        });
    });

    // Функция для определения закрытой позиции
    const getClosedPosition = () => {
        const width = window.innerWidth;
        if (width <= 507) return '-85vw';
        if (width <= 754) return '-80vw';
        if (width >= 684 && width <= 800) return '-78vw';
        return '-600px';
    };

    // Инициализация кнопок и окон
    windows.forEach(window => {
        const toggleBtn = document.getElementById(window.btnId);
        const slideWindow = document.getElementById(window.id);
        if (toggleBtn && slideWindow) {
            toggleBtn.style.opacity = '1';
            toggleBtn.classList.remove('hidden');
            slideWindow.style.left = getClosedPosition();
            slideWindow.classList.add('closed');
            console.log(`Button ${window.btnId} initialized and visible`);
        } 
        else {
            console.warn(`Button ${window.btnId} or window ${window.id} not found`);
        }
    });

    // Обработчики для окон
    windows.forEach(window => {
        const slideWindow = document.getElementById(window.id);
        const toggleBtn = document.getElementById(window.btnId);
        if (toggleBtn && slideWindow) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const closedPosition = getClosedPosition();
                const isOpen = slideWindow.style.left === '0px' || slideWindow.classList.contains('open');
                if (isOpen) {
                    slideWindow.style.left = closedPosition;
                    slideWindow.classList.remove('open');
                    slideWindow.classList.add('closed');
                    windows.forEach(otherWindow => {
                        const btn = document.getElementById(otherWindow.btnId);
                        if (btn) {
                            btn.style.opacity = '1';
                            btn.classList.remove('hidden');
                            console.log(`Button ${otherWindow.btnId} shown`);
                        }
                    });
                } 
                else {
                    windows.forEach(otherWindow => {
                        const otherSlide = document.getElementById(otherWindow.id);
                        if (otherSlide && otherSlide !== slideWindow) {
                            otherSlide.style.left = closedPosition;
                            otherSlide.classList.remove('open');
                            otherSlide.classList.add('closed');
                        }
                    });
                    slideWindow.style.left = '0px';
                    slideWindow.classList.remove('closed');
                    slideWindow.classList.add('open');
                    windows.forEach(otherWindow => {
                        if (otherWindow.btnId !== window.btnId) {
                            const btn = document.getElementById(otherWindow.btnId);
                            if (btn) {
                                btn.style.opacity = '0';
                                btn.classList.add('hidden');
                                console.log(`Button ${otherWindow.btnId} hidden`);
                            }
                        }
                    });
                }
            });
            toggleBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                toggleBtn.click();
            });
        }
    });

    // Проверка перекрытия текста
    function checkTextOverlap() {
        const title = document.querySelector('.Title');
        const buttons = document.querySelectorAll('.toggle-btn, .map-btn');
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
                console.warn(`Text overlap detected with: ${button.id}`);
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
        windows.forEach(window => {
            const slideWindow = document.getElementById(window.id);
            const toggleBtn = document.getElementById(window.btnId);
            if (slideWindow && slideWindow.classList.contains('closed')) {
                slideWindow.style.left = getClosedPosition();
            }
            if (toggleBtn && !slideWindow.classList.contains('open')) {
                toggleBtn.style.opacity = '1';
                toggleBtn.classList.remove('hidden');
            }
        });
    });
    window.addEventListener('load', checkTextOverlap);

    // Обработка кнопки карты
    function handleMapButtonClick() {
        const gameMode = mapBtn.dataset.mode;
        console.log('Map button clicked, redirecting to map.html with mode:', gameMode);
        transitionOverlay.classList.add('active');
        console.log('Transition overlay activated (smooth)');
        setTimeout(() => {
            console.log('Redirecting to map.html');
            window.location.href = `map.html?mode=${gameMode}`;
        }, 400);
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
        windows.forEach(window => {
            const slideWindow = document.getElementById(window.id);
            if (slideWindow && slideWindow.classList.contains('open')) {
                const isClickInside = slideWindow.contains(e.target) || document.getElementById(window.btnId).contains(e.target);
                if (!isClickInside) {
                    slideWindow.style.left = getClosedPosition();
                    slideWindow.classList.remove('open');
                    slideWindow.classList.add('closed');
                    windows.forEach(otherWindow => {
                        const btn = document.getElementById(otherWindow.btnId);
                        if (btn) {
                            btn.style.opacity = '1';
                            btn.classList.remove('hidden');
                            console.log(`Button ${otherWindow.btnId} shown on outside click`);
                        }
                    }); 
                }
            }
        });
    });

    // Плавное появление карты при загрузке
    document.body.style.opacity = '1';
    transitionOverlay.classList.remove('active');

    // Кнопка перехода
    const rightArrow = document.getElementById('right-arrow');
    const transitionScreen = document.getElementById('transition-screen');
    
    rightArrow.addEventListener('click', () => {
        // Активируем шторку
        transitionScreen.classList.add('active');
        
        // Через 500ms (когда анимация завершится) переходим на новую страницу
        setTimeout(() => {
            window.location.href = 'gmain.html';
        }, 500);
    });
    
    // Плавное появление страницы
    document.body.style.opacity = '1';
});
