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

    const windows = [
        { id: 'gsettings-window', btnId: 'gsettings-toggle' },
        { id: 'grating-window', btnId: 'grating-toggle' }
    ];

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

    // Функция для определения закрытой позиции
    const getClosedPosition = () => {
        const width = window.innerWidth;
        if (width <= 768) return '-90vw';
        return '-85vw';
    };

    // Инициализация окон
    function initializeWindows() {
        windows.forEach(window => {
            const toggleBtn = document.getElementById(window.btnId);
            const slideWindow = document.getElementById(window.id);
            
            if (toggleBtn && slideWindow) {
                toggleBtn.style.opacity = '1';
                toggleBtn.classList.remove('hidden');
                slideWindow.style.right = getClosedPosition();
                slideWindow.classList.add('closed');
            }
        });
    }

    // Переключение окна
    function toggleWindow(windowId) {
        const targetWindow = document.getElementById(windowId);
        const isOpen = targetWindow.classList.contains('open');
        const windowConfig = windows.find(w => w.id === windowId);
        const targetBtn = windowConfig ? document.getElementById(windowConfig.btnId) : null;
        
        if (isOpen) {
            // Закрытие окна
            targetWindow.style.right = getClosedPosition();
            targetWindow.classList.remove('open');
            targetWindow.classList.add('closed');
            
            // Возвращаем кнопку на место
            if (targetBtn) {
                targetBtn.style.right = '0';
            }
            
            // Показываем все кнопки
            windows.forEach(w => {
                const btn = document.getElementById(w.btnId);
                if (btn) {
                    btn.style.opacity = '1';
                    btn.classList.remove('hidden');
                    btn.style.right = '0';
                }
            });
        } 
        else {
            // Закрытие всех других окон
            windows.forEach(w => {
                if (w.id !== windowId) {
                    const win = document.getElementById(w.id);
                    const btn = document.getElementById(w.btnId);
                    
                    if (win) {
                        win.style.right = getClosedPosition();
                        win.classList.remove('open');
                        win.classList.add('closed');
                    }
                    
                    if (btn) {
                        btn.style.right = '0';
                    }
                }
            });
            
            // Открытие текущего окна
            targetWindow.style.right = '0';
            targetWindow.classList.remove('closed');
            targetWindow.classList.add('open');
            
            // Двигаем кнопку вместе с окном
            if (targetBtn) {
                const windowWidth = targetWindow.offsetWidth;
                targetBtn.style.right = `${windowWidth}px`;
            }
            
            // Скрытие других кнопок
            windows.forEach(w => {
                if (w.id !== windowId) {
                    const btn = document.getElementById(w.btnId);
                    if (btn) {
                        btn.style.opacity = '0';
                        btn.classList.add('hidden');
                    }
                }
            });
        }
    }

    // Обработчики событий для кнопок
    function setupButtonListeners() {
        // Обработчики для toggle-кнопок
        windows.forEach(window => {
            const toggleBtn = document.getElementById(window.btnId);
            if (toggleBtn) {
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleWindow(window.id);
                });
                
                // Для touch-устройств
                toggleBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    toggleBtn.click();
                });
            }
        });

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
                
                // шторка слева-направо ВАШУ МЫШЬ
                leftTransition.classList.add('active');
                
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 500);
            });
        }
    }

    // Закрытие окон при клике вне их
    function setupDocumentClickListener() {
        document.addEventListener('click', (e) => {
            let isClickInside = false;
            
            windows.forEach(w => {
                const window = document.getElementById(w.id);
                const btn = document.getElementById(w.btnId);
                
                if ((window && window.contains(e.target))) {
                    isClickInside = true;
                }
                if (btn && btn.contains(e.target)) {
                    isClickInside = true;
                }
            });
            
            if (!isClickInside) {
                windows.forEach(w => {
                    const window = document.getElementById(w.id);
                    if (window && window.classList.contains('open')) {
                        window.style.right = getClosedPosition();
                        window.classList.remove('open');
                        window.classList.add('closed');
                        
                        const btn = document.getElementById(w.btnId);
                        if (btn) {
                            btn.style.opacity = '1';
                            btn.classList.remove('hidden');
                            btn.style.right = '0';
                        }
                    }
                });
            }
        });
    }

    positionToggleButtons();
    initializeWindows();
    setupButtonListeners();
    setupDocumentClickListener();
    
    window.addEventListener('resize', () => {
        positionToggleButtons();
        windows.forEach(window => {
            const slideWindow = document.getElementById(window.id);
            if (slideWindow && slideWindow.classList.contains('closed')) {
                slideWindow.style.right = getClosedPosition();
            }
        });
    });
    
    // Плавное появление страницы
    document.body.style.opacity = '1';

});
