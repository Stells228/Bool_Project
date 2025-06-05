document.addEventListener('DOMContentLoaded', () => {
    const socket = io('https://lichinkis.ru/');

    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    const isHost = params.get('isHost') === 'true';
    const username = localStorage.getItem('username') || 'Игрок';

    // Обновление UI
    document.getElementById('room-code-display').textContent = roomCode;
    if (isHost) {
        document.getElementById('start-btn').disabled = false;
    } 
    else {
        document.getElementById('start-btn').style.display = 'none';
    }

    socket.emit('joinLobby', { roomCode, username, isHost });

    socket.on('updatePlayers', (players) => {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';

        players.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = `player ${player.ready ? 'ready' : ''} ${player.isHost ? 'host' : ''}`;

            playerElement.innerHTML = `
                <div class="player-avatar">${index + 1}</div>
                <div class="player-info">
                    <span class="player-name">${player.username}</span>
                    <span class="player-status">${player.ready ? 'Готов' : 'Ожидание'}</span>
                </div>
                ${player.isHost ? '<div class="host-badge">Хост</div>' : ''}
            `;

            playersList.appendChild(playerElement);
        });

        // Проверяем, все ли готовы (для хоста)
        if (isHost) {
            const allReady = players.every(p => p.ready);
            document.getElementById('start-btn').disabled = !allReady;
        }
    });

    // Обработка готовности игрока
    document.getElementById('ready-btn').addEventListener('click', function () {
        const isReady = !this.classList.contains('active');
        socket.emit('setReady', isReady);
        this.classList.toggle('active');
        this.textContent = isReady ? 'Отменить готовность' : 'Я готов';
    });

    // Начало игры (для хоста)
    document.getElementById('start-btn').addEventListener('click', () => {
        if (!isHost) return;

        socket.emit('startGame', roomCode, (response) => {
            if (response.success) {
                console.log('Игра начата');
            } 
            else {
                alert('Ошибка: ' + response.message);
            }
        });
    });

    document.getElementById('home-btn').addEventListener('click', () => {
        socket.emit('leaveRoom');
        window.location.href = 'main.html';
    });

    socket.on('gameStarting', (data) => {
        localStorage.setItem('currentTask', JSON.stringify(data.task));
        window.location.href = `mlevel${data.level}.html?room=${roomCode}&mode=multiplayer`;
    });

    socket.on('gameFinished', (results) => {
        alert('Игра завершена! Финальные результаты: \n' +
            results.map((p, i) => `${i + 1}. ${p.username}: ${p.score} очков`).join('\n'));
        window.location.href = 'main.html';
    });

    socket.on('error', (message) => {
        alert('Ошибка: ' + message);
    });

    socket.on('roomClosed', () => {
        alert('Комната была закрыта хостом');
        window.location.href = 'main.html';
    });

    // Таймер для автообновления (на случай проблем с подключением)
    const heartbeat = setInterval(() => {
        socket.emit('heartbeat', roomCode);
    }, 5000);

    // Очистка при закрытии страницы
    window.addEventListener('beforeunload', () => {
        socket.emit('leaveRoom');
        clearInterval(heartbeat);
    });

    socket.on('showResults', (results) => {
        window.location.href = `results.html?room=${roomCode}`;
    });

    socket.on('playerReadyForNext', (playerId) => {
        const players = document.querySelectorAll('.player');
        players.forEach(player => {
            if (player.dataset.id === playerId) {
                const status = player.querySelector('.player-status');
                status.textContent = 'Готов к следующему';
            }
        });
    });
});