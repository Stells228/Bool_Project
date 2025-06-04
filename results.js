document.addEventListener('DOMContentLoaded', () => {
    const socket = io('http://localhost:3000');
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    const nextBtn = document.getElementById('next-btn');
    const isFinal = params.get('final') === 'true';

    socket.emit('getResults', roomCode);

    socket.on('results', (results) => {
        const currentPlayer = results.find(player => player.id === socket.id);
        const otherPlayers = results.filter(player => player.id !== socket.id);
    
        if (currentPlayer) {
            document.getElementById('player-score').textContent = 
                `${currentPlayer.score} очков`;
            
            const feedback = document.getElementById('result-feedback');
            feedback.textContent = currentPlayer.isCorrect ? 'Правильно!' : 'Неправильно!';
            feedback.className = `result-feedback ${currentPlayer.isCorrect ? 'correct' : 'incorrect'}`;
        }
    
        const otherPlayersContainer = document.getElementById('other-players');
        otherPlayersContainer.innerHTML = '';
    
        otherPlayers.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-result';
            playerDiv.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${player.username}</span>
                    <span class="player-score">${player.score} очков</span>
                </div>
                <div class="result-feedback ${player.isCorrect ? 'correct' : 'incorrect'}">
                    ${player.isCorrect ? 'Правильно' : 'Неправильно'}
                </div>
            `;
            otherPlayersContainer.appendChild(playerDiv);
        });
    
        // Если игра завершена, показываем финальные результаты
        const gameFinished = isFinal || results.some(player => player.gameFinished);
        if (gameFinished) {
            showFinalResults(results);
            nextBtn.textContent = 'В главное меню';
            nextBtn.onclick = () => {
                window.location.href = '../main.html';
            };
        } 
        else {
            // Если игра продолжается, сбрасываем состояние кнопки через 3 секунды
            setTimeout(() => {
                nextBtn.disabled = false;
                nextBtn.textContent = 'Дальше';
            }, 3000);
        }
    });

    // Обработчик кнопки "Дальше"
    nextBtn.addEventListener('click', () => {
        if (nextBtn.textContent === 'В главное меню') {
            window.location.href = '../main.html';
            return;
        }
        
        socket.emit('playerReadyForNext', roomCode);
        nextBtn.disabled = true;
        nextBtn.textContent = 'Ожидаем других игроков...';
    });

    socket.on('nextLevel', ({ level, task }) => {
        localStorage.setItem('currentTask', JSON.stringify(task));
        window.location.href = `mlevel${level}.html?room=${roomCode}&mode=multiplayer`;
    });

    socket.on('gameFinished', (results) => {
        showFinalResults(results);
        nextBtn.textContent = 'В главное меню';
        nextBtn.onclick = () => {
            window.location.href = '../main.html';
        };
    });

    function showFinalResults(results) {
        const existingContainer = document.querySelector('.final-results');
        if (existingContainer) existingContainer.remove();

        const container = document.createElement('div');
        container.className = 'final-results';
        
        const title = document.createElement('h2');
        title.textContent = 'Финальные результаты игры:';
        container.appendChild(title);
        
        // Сортируем игроков по количеству очков (от большего к меньшему)
        results.sort((a, b) => b.score - a.score);
        
        results.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'final-player-result';
            playerDiv.innerHTML = `
                <span class="position">${index + 1}.</span>
                <span class="username">${player.username}</span>
                <span class="score">${player.score} очков</span>
                ${player.id === socket.id ? '<span class="you-badge">Вы</span>' : ''}
            `;
            container.appendChild(playerDiv);
        });
        
        document.querySelector('.results-container').appendChild(container);
    }

    socket.on('error', (message) => {
        alert('Ошибка: ' + message);
    });

    socket.on('roomClosed', () => {
        alert('Комната была закрыта хостом');
        window.location.href = '../main.html';
    });
});