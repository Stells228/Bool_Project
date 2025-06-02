document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    const isHost = params.get('isHost') === 'true';

    document.getElementById('room-code-display').textContent = roomCode;
    if (isHost) document.getElementById('start-btn').disabled = false;

    socket.on('updatePlayers', (players) => {
        const playerSlots = document.querySelector('.player-slots');
        playerSlots.innerHTML = '';
        
        players.forEach((player, index) => {
            const slot = document.createElement('div');
            slot.className = 'player-slot';
            slot.innerHTML = `
                <div class="player-avatar">${index + 1}</div>
                <div class="player-name">${player.username}</div>
                <div class="player-status">${player.ready ? 'Готов' : 'Ожидание'}</div>
            `;
            if (player.ready) slot.classList.add('ready');
            playerSlots.appendChild(slot);
        });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        socket.emit('startGame', roomCode);
    });

    document.getElementById('home-btn').addEventListener('click', () => {
        socket.emit('leaveRoom');
        window.location.href = 'main.html';
    });
});