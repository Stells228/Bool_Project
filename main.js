document.addEventListener('DOMContentLoaded', () => {
    // создала массив объектов со св-ами
    const windows = [
        { id: 'calc-window', btnId: 'calc-toggle' },
        { id: 'gear-window', btnId: 'gear-toggle' },
        { id: 'cup-window', btnId: 'cup-toggle' }
    ];

    // Храню состояние нажатия кнопок
    const firstClickStates = {
        'calc-toggle': true,
        'gear-toggle': true,
        'cup-toggle': true
    };

    windows.forEach(window => {
        //получаю данные об эл-ах
        const slideWindow = document.getElementById(window.id);
        const toggleBtn = document.getElementById(window.btnId);

        if (toggleBtn && slideWindow) {
            toggleBtn.addEventListener('click', () => {
                const isOpen = slideWindow.classList.contains('open');
                const isClosed = slideWindow.classList.contains('closed');

                if (isOpen) {
                    slideWindow.classList.remove('open');
                    slideWindow.classList.add('closed');
                    windows.forEach(otherWindow => {
                        document.getElementById(otherWindow.btnId).classList.remove('hidden');
                    });
                } 
                else {
                    slideWindow.classList.remove('closed');
                    slideWindow.classList.add('open');
                    if (firstClickStates[window.btnId]) {
                        firstClickStates[window.btnId] = false;
                    }
                    windows.forEach(otherWindow => {
                        if (otherWindow.btnId !== window.btnId) {
                            document.getElementById(otherWindow.btnId).classList.add('hidden');
                        }
                    });
                }

                // тернарные опреаторы это, конечно, супер, но я опять в них запуталась
                let state;
                if (slideWindow.classList.contains('open')) {
                    state = 'open';
                }
                else if (slideWindow.classList.contains('closed')) {
                    state = 'closed';
                }  
                else {
                    state = 'hidden';
                }
                console.log(`${window.btnId} clicked, window state: ${state}`);
            });
        } 
        else {
            console.error(`Elements not found for ${window.id}:`, { toggleBtn, slideWindow });
        }
    });

    // Логика кнопки для "Play"
    const mapBtn = document.getElementById('map-btn');
    const mainScreen = document.getElementById('main-screen');
    const levelIframe = document.getElementById('level-iframe');

    if (mapBtn && mainScreen && levelIframe) {
        mapBtn.addEventListener('click', () => {
            mainScreen.classList.add('hidden'); // Скрыть основной экран
            levelIframe.classList.remove('hidden');  // Показать карту уровней
            setTimeout(() => {
                levelIframe.style.opacity = '1'; //чтоб всё плавненько показывалось
                windows.forEach(window => {
                    document.getElementById(window.id).style.display = 'none';  // Скрыть все окна
                });
                mapBtn.style.display = 'none'; 
            }, 100); // задержка для плавности перехода
            console.log('Map button clicked, transitioning to level map');
        });
    } 
    else {
    console.error('Map elements not found:', { mapBtn, mainScreen, levelIframe });
    }
});
