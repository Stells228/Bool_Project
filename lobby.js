document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    const isHost = params.get('isHost') === 'true';

    document.getElementById('room-code-display').textContent = roomCode;
    if (isHost) document.getElementById('start-btn').disabled = false;

    socket.on('updatePlayers', (players) => {
        const list = document.getElementById('players-list');
        list.innerHTML = players.map(player => `<div class="player">${player}</div>`).join('');
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        socket.emit('startGame', roomCode);
    });

    document.getElementById('home-btn').addEventListener('click', () => {
        window.location.href = 'main.html';
    });
});