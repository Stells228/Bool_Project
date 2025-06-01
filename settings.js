document.addEventListener('DOMContentLoaded', () => {
    const gearWindow = document.getElementById('gear-window');
    const mapBtn = document.getElementById('gmap-btn') || document.getElementById('map-btn');    
    const newGameBtn = document.getElementById('new-game-btn');

    if (!gearWindow || !mapBtn || !newGameBtn) {
        console.error('Не найдены обязательные элементы:', { gearWindow, mapBtn, newGameBtn });
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

    // Инициализация режима игры
    let savedMode = localStorage.getItem('gameMode') || 'normal';
    console.log('settings.js: Инициализация savedMode:', savedMode);
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
            console.log('settings.js: Имя игрока изменено:', playerName);
        } 
        else {
            showNotification('Пожалуйста, введите имя игрока');
        }
    });

    if (!localStorage.getItem('currentPlayer')) {
        localStorage.setItem('currentPlayer', 'Anonymous');
        document.getElementById('player-name-input').value = 'Anonymous';
        console.log('settings.js: Установлено имя по умолчанию: Anonymous');
    }

    function setGameMode(mode) {
        localStorage.setItem('gameMode', mode);
        mapBtn.dataset.mode = mode;
        updateModeButtons(mode);
        showNotification(`Режим изменён на ${mode === 'normal' ? 'Свободный' : mode === 'passing' ? 'Прохождение' : 'Соревнование'}`);
        console.log('settings.js: Установлен режим:', mode, 'localStorage:', localStorage.getItem('gameMode'));
    }

    document.getElementById('normal-mode').addEventListener('click', () => {
        setGameMode('normal');
    });

    document.getElementById('passing-mode').addEventListener('click', () => {
        setGameMode('passing');
    });

    document.getElementById('competition-mode').addEventListener('click', () => {
        setGameMode('competition');
    });

    mapBtn.addEventListener('click', () => {
        const mode = localStorage.getItem('gameMode') || 'normal';
        console.log('settings.js: Переход на gmap.html с режимом:', mode);
        window.location.href = `gmap.html?mode=${mode}`;
    });

    newGameBtn.addEventListener('click', () => {
        localStorage.removeItem('completedLevels');
        localStorage.removeItem('gCompletedLevels');
        localStorage.removeItem('competitionScores');
        localStorage.removeItem('gCompetitionScores');
        let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
        const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
        if (allPlayersData[currentPlayer]) {
            allPlayersData[currentPlayer].scores = {};
            allPlayersData[currentPlayer].gScores = {};
            localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        }
        window.dispatchEvent(new Event('resetRating'));
        showNotification('Прогресс игры сброшен!');
        console.log('settings.js: Прогресс сброшен, allPlayersData:', allPlayersData);
    });

    function updateModeButtons(mode) {
        const normalBtn = document.getElementById('normal-mode');
        const passingBtn = document.getElementById('passing-mode');
        const competitionBtn = document.getElementById('competition-mode');
        if (normalBtn && passingBtn && competitionBtn) {
            normalBtn.classList.toggle('active', mode === 'normal');
            passingBtn.classList.toggle('active', mode === 'passing');
            competitionBtn.classList.toggle('active', mode === 'competition');
            console.log('settings.js: Обновлены кнопки режима:', mode);
        } 
        else {
            console.error('settings.js: Кнопки режимов не найдены:', { normalBtn, passingBtn, competitionBtn });
        }
    }
});