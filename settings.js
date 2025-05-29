document.addEventListener('DOMContentLoaded', () => {
    const gearWindow = document.getElementById('gear-window');
    const gearToggle = document.getElementById('gear-toggle');
    const mapBtn = document.getElementById('map-btn');
    const levelIframe = document.getElementById('level-iframe');
    const newGameBtn = document.getElementById('new-game-btn');

    if (!gearWindow || !gearToggle || !mapBtn || !newGameBtn) {
        console.error('Required elements not found');
        return;
    }

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

    const playerNameContainer = document.createElement('div');
    playerNameContainer.className = 'player-name-container';
    playerNameContainer.innerHTML = `
        <label for="player-name-input" class="player-name-label">Имя игрока:</label>
        <input type="text" id="player-name-input" class="player-name-input" 
               placeholder="Введите ваше имя" maxlength="20"
               value="${localStorage.getItem('currentPlayer') || ''}">
        <button id="change-name-btn" class="change-name-btn">Сменить имя</button>
    `;
    gearWindow.querySelector('.settings-container').insertBefore(playerNameContainer, gearWindow.querySelector('.mode-toggle'));

    function showNotification(message) {
        const notificationElement = document.querySelector('.custom-notification');
        const messageElement = notificationElement.querySelector('.notification-message');
        messageElement.textContent = message;
        notificationElement.classList.remove('hidden');

        // Скрываем уведомление через 3 секунды
        setTimeout(() => {
            notificationElement.classList.add('hidden');
        }, 3000);
    }

    document.getElementById('change-name-btn').addEventListener('click', () => {
        const playerName = document.getElementById('player-name-input').value.trim();
        if (playerName) {
            localStorage.setItem('currentPlayer', playerName);
            showNotification(`Имя игрока изменено на: ${playerName}`);
            window.dispatchEvent(new Event('playerNameChanged'));
        } 
        else {
            showNotification('Пожалуйста, введите имя игрока');
        }
    });

    function updateIframeMode(mode) {
        if (levelIframe.style.display !== 'none') {
            levelIframe.src = `map.html?mode=${mode}`;
        }
    }

    // Проверка, установлено ли имя игрока
    if (!localStorage.getItem('currentPlayer')) {
        localStorage.setItem('currentPlayer', 'Anonymous');
        document.getElementById('player-name-input').value = 'Anonymous';
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

    document.getElementById('competition-mode').addEventListener('click', () => {
        mapBtn.dataset.mode = 'competition';
        localStorage.setItem('gameMode', 'competition');
        updateModeButtons('competition');
        updateIframeMode('competition');
        showNotification('Режим изменен на Соревнование');
    });

    newGameBtn.addEventListener('click', () => {
        localStorage.removeItem('completedLevels');
        localStorage.removeItem('competitionScores');
        if (levelIframe.style.display !== 'none') {
            levelIframe.contentWindow.postMessage({ type: 'resetGame' }, '*');
        }
        window.dispatchEvent(new Event('resetRating'));
        showNotification('Прогресс игры сброшен!');
    });

    function updateModeButtons(mode) {
        const normalBtn = document.getElementById('normal-mode');
        const passingBtn = document.getElementById('passing-mode');
        const competitionBtn = document.getElementById('competition-mode');
        normalBtn.classList.toggle('active', mode === 'normal');
        passingBtn.classList.toggle('active', mode === 'passing');
        competitionBtn.classList.toggle('active', mode === 'competition');
    }
});