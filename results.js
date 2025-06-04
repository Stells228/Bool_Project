document.addEventListener('DOMContentLoaded', () => {
    const socket = io('http://localhost:3000');
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    const score = params.get('score');
    const isCorrect = params.get('correct') === 'true';

    document.getElementById('player-score').textContent = `${score} очков`;
    document.getElementById('result-feedback').textContent = isCorrect ? 'Правильно!' : 'Неправильно';
    document.getElementById('result-feedback').className = `result-feedback ${isCorrect ? 'correct' : 'incorrect'}`;

    socket.emit('getPlayerResults', roomCode);
    socket.on('playerResults', (results) => {
        const container = document.getElementById('other-players');
        container.innerHTML = '';

        results.forEach(player => {
            if (player.playerId !== socket.id) {
                const div = document.createElement('div');
                div.className = 'player-result';
                div.innerHTML = `
                    <div class="player-name">${player.username}</div>
                    <div class="player-score">${player.score} очков</div>
                    <div class="result-feedback ${player.isCorrect ? 'correct' : 'incorrect'}">
                        ${player.isCorrect ? 'Правильно' : 'Неправильно'}
                    </div>
                `;
                container.appendChild(div);
            }
        });
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        socket.emit('playerReadyForNext');
    });

    socket.on('nextLevel', (data) => {
        window.location.href = `mlevel${data.level}.html?room=${roomCode}`;
    });
});