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
            //if сущ-ет, добавляется обработчик события
            toggleBtn.addEventListener('click', () => {
                const isOpen = slideWindow.classList.contains('open');
                const isFirstClick = firstClickStates[window.btnId]; //состояние клика для текущей кнопки

                //переключеник классов в зависимости от состояния объекта
                slideWindow.classList.toggle('open');
                slideWindow.classList.toggle('closed', !isOpen && !isFirstClick);

                //обработчик для других окон в проецесс совершения действия над "главным" окном
                windows.forEach(otherWindow => {
                    const otherBtn = document.getElementById(otherWindow.btnId);
                    if (slideWindow.classList.contains('open')) {
                        otherBtn.classList.toggle('hidden', otherWindow.btnId !== window.btnId);
                    } 
                    else {
                        otherBtn.classList.remove('hidden');
                    }
                });

                //обновление состояния 1-го клика
                firstClickStates[window.btnId] = false;

                //Логировние - нужно, чтобы в конце, обработчик знал что, как и где происходит
                console.log(`${window.btnId} clicked, window state:`, 
                    slideWindow.classList.contains('open') ? 'open' : slideWindow.classList.contains('closed') ? 'closed' : 'hidden');
            });
        } 
        else {
            console.error(`Elements not found for ${window.id}:`, { toggleBtn, slideWindow });
        }
    });
});
