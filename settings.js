document.addEventListener('DOMContentLoaded', () => {
    const gearWindow = document.getElementById('gear-window');
    const gearToggle = document.getElementById('gear-toggle');
    const mapBtn = document.getElementById('map-btn');
    const levelIframe = document.getElementById('level-iframe');
    const newGameBtn = document.getElementById('new-game-btn');

    if (!gearWindow || !gearToggle || !mapBtn || !levelIframe || !newGameBtn) {
        console.error('Required elements not found');
        return;
    }

    // Создаем элемент для уведомления
    const notification = document.createElement('div');
    notification.className = 'custom-notification hidden';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message"></span>
        </div>
    `;
    document.body.appendChild(notification);

    const savedMode = localStorage.getItem('gameMode') || 'normal';
    mapBtn.dataset.mode = savedMode;
    updateModeButtons(savedMode);

    function showNotification(message, duration = 2000) {
        const notificationElement = document.querySelector('.custom-notification');
        const messageElement = notificationElement.querySelector('.notification-message');
        
        messageElement.textContent = message;
        notificationElement.classList.remove('hidden');
        
        setTimeout(() => {
            notificationElement.classList.add('hidden');
        }, duration);
    }

    function updateIframeMode(mode) {
        if (levelIframe.style.display !== 'none') {
            levelIframe.src = `map.html?mode=${mode}`;
        }
    }

    document.getElementById('normal-mode').addEventListener('click', () => {
        mapBtn.dataset.mode = 'normal';
        localStorage.setItem('gameMode', 'normal');
        updateModeButtons('normal');
        updateIframeMode('normal');
        showNotification('Режим изменен на Свободный');
    });

    document.getElementById('passing-mode').addEventListener('click', () => {
        mapBtn.dataset.mode = 'passing';
        localStorage.setItem('gameMode', 'passing');
        updateModeButtons('passing');
        updateIframeMode('passing');
        showNotification('Режим изменен на Прохождение');
    });

    newGameBtn.addEventListener('click', () => {
        localStorage.removeItem('completedLevels');
        if (levelIframe.style.display !== 'none') {
            levelIframe.contentWindow.postMessage({ type: 'resetGame' }, '*');
        }
        showNotification('Прогресс игры сброшен!');
    });

    function updateModeButtons(mode) {
        const normalBtn = document.getElementById('normal-mode');
        const passingBtn = document.getElementById('passing-mode');
        normalBtn.classList.toggle('active', mode === 'normal');
        passingBtn.classList.toggle('active', mode === 'passing');
    }
});