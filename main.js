document.addEventListener('DOMContentLoaded', () => {
    const windows = [
        { id: 'calc-window', btnId: 'calc-toggle' },
        { id: 'gear-window', btnId: 'gear-toggle' },
        { id: 'cup-window', btnId: 'cup-toggle' },
        { id: 'construction-window', btnId: 'construction-toggle' }
    ];

    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);

    // Функция для определения закрытой позиции
    const getClosedPosition = () => {
        const width = window.innerWidth;
        if (width <= 507) return '-80vw';
        if (width <= 754) return '-70vw';
        if (width <= 1024) return '-50vw';
        if (width <= 1360) return '-40vw';
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
        } else {
            console.warn(`Button ${window.btnId} or window ${window.id} not found in DOM`);
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
                    // Закрываем окно
                    slideWindow.style.left = closedPosition;
                    slideWindow.classList.remove('open');
                    slideWindow.classList.add('closed');
                    
                    // Показываем все кнопки
                    windows.forEach(otherWindow => {
                        const btn = document.getElementById(otherWindow.btnId);
                        if (btn) {
                            btn.style.opacity = '1';
                            btn.classList.remove('hidden');
                            console.log(`Button ${otherWindow.btnId} shown`);
                        }
                    });
                } else {
                    // Закрываем все другие окна
                    windows.forEach(otherWindow => {
                        const otherSlide = document.getElementById(otherWindow.id);
                        if (otherSlide && otherSlide !== slideWindow) {
                            otherSlide.style.left = closedPosition;
                            otherSlide.classList.remove('open');
                            otherSlide.classList.add('closed');
                        }
                    });

                    // Открываем текущее окно
                    slideWindow.style.left = '0px';
                    slideWindow.classList.remove('closed');
                    slideWindow.classList.add('open');
                    
                    // Скрываем другие кнопки
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

            // Поддержка тач-событий
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
        if (!title) return;

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
                console.warn('Перекрытие текста с элементом:', button.id);
                button.style.opacity = '0.5';
            } else if (!button.classList.contains('hidden')) {
                button.style.opacity = '1';
            }
        });
    }

    window.addEventListener('resize', () => {
        checkTextOverlap();
        // Обновляем позицию закрытых окон и видимость кнопок
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
    const mapBtn = document.getElementById('map-btn');
    const mainScreen = document.getElementById('main-screen');
    const levelIframe = document.getElementById('level-iframe');

    if (mapBtn && mainScreen && levelIframe) {
        mapBtn.addEventListener('click', async () => {
            const gameMode = mapBtn.dataset.mode;
            transitionOverlay.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 150));
            mainScreen.classList.add('hidden');
            levelIframe.src = `map.html?mode=${gameMode}`;
            levelIframe.style.display = 'block';
            await new Promise(resolve => requestAnimationFrame(resolve));
            levelIframe.classList.add('active');
            transitionOverlay.classList.remove('active');
            
            const closedPosition = getClosedPosition();
            windows.forEach(window => {
                const slideWindow = document.getElementById(window.id);
                if (slideWindow) {
                    slideWindow.style.left = closedPosition;
                    slideWindow.classList.remove('open');
                    slideWindow.classList.add('closed');
                }
                const btn = document.getElementById(window.btnId);
                if (btn) {
                    btn.style.opacity = '1';
                    btn.classList.remove('hidden');
                    console.log(`Button ${window.btnId} shown after map click`);
                }
            });
            mapBtn.style.display = 'none';
        });
    } else {
        console.warn('Map button, main screen, or iframe not found');
    }

    window.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'return-to-main') {
            transitionOverlay.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 150));
            levelIframe.classList.remove('active');
            await new Promise(resolve => setTimeout(resolve, 150));
            levelIframe.style.display = 'none';
            levelIframe.src = 'about:blank';
            mainScreen.classList.remove('hidden');
            transitionOverlay.classList.remove('active');
            mapBtn.style.display = 'block';
            
            const closedPosition = getClosedPosition();
            windows.forEach(window => {
                const slideWindow = document.getElementById(window.id);
                if (slideWindow) {
                    slideWindow.style.left = closedPosition;
                    slideWindow.classList.remove('open');
                    slideWindow.classList.add('closed');
                }
                const btn = document.getElementById(window.btnId);
                if (btn) {
                    btn.style.opacity = '1';
                    btn.classList.remove('hidden');
                    console.log(`Button ${window.btnId} shown after return-to-main`);
                }
            });
        }
    });

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
});
