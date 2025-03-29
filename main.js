document.addEventListener('DOMContentLoaded', () => {
    // Массив объектов для выдвижных окон
    const windows = [
        { id: 'calc-window', btnId: 'calc-toggle' },
        { id: 'gear-window', btnId: 'gear-toggle' },
        { id: 'cup-window', btnId: 'cup-toggle' }
    ];

    // Храним состояние первого клика для кнопок
    const firstClickStates = {
        'calc-toggle': true,
        'gear-toggle': true,
        'cup-toggle': true
    };

    windows.forEach(window => {
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

    // Логика кнопки "Play"
     const mapBtn = document.getElementById('map-btn');
    const mainScreen = document.getElementById('main-screen');
    const levelIframe = document.getElementById('level-iframe');

    if (mapBtn && mainScreen && levelIframe) {
        mapBtn.addEventListener('click', () => {
            const gameMode = mapBtn.dataset.mode;
            mainScreen.classList.add('hidden');
            
            // чистим iframe src 
            levelIframe.src = '';
            setTimeout(() => {
                levelIframe.src = `map.html?mode=${gameMode}`;
                levelIframe.classList.remove('hidden');
                levelIframe.style.display = 'block';
                
                setTimeout(() => {
                    levelIframe.style.opacity = '1';
                    
                    windows.forEach(window => {
                        const slideWindow = document.getElementById(window.id);
                        slideWindow.classList.remove('open');
                        slideWindow.classList.add('closed');
                        document.getElementById(window.btnId).classList.remove('hidden');
                    });
                    
                    mapBtn.style.display = 'none';
                }, 100);
            }, 50);
        });
    }

    window.addEventListener('message', (event) => {
        console.log('Received message:', event.data);
        
        if (event.data && event.data.type === 'return-to-main') {
            console.log('Returning to main menu');
            mainScreen.classList.remove('hidden');
            levelIframe.classList.add('hidden');
            levelIframe.style.display = 'none';
            mapBtn.style.display = 'block';
            
            // сброс айфрейма
            setTimeout(() => {
                levelIframe.src = 'about:blank';
            }, 100);
        }
    });
});
