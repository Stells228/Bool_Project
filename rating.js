// Объявляем переменную для хранения общего счета
let totalScore = 0;

// Функция для обновления отображения счета
function updateScoreDisplay(score) {
    const totalScoreElement = document.querySelector('.rating-summary');
    if (totalScoreElement) {
        totalScoreElement.setAttribute('data-score', score);
        if (window.innerWidth > 768) {
            document.getElementById('total-score').textContent = `Общий счёт: ${score}`;
        }
    }
}

// Инициализация
updateScoreDisplay(0); 

document.addEventListener('DOMContentLoaded', () => {
    updateScoreDisplay();
    const totalScoreElement = document.getElementById('total-score');
    const levelScoresList = document.getElementById('level-scores');

    let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};

    const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
    if (!allPlayersData[currentPlayer]) {
        allPlayersData[currentPlayer] = { scores: {} };
        localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
    }

    updateScoreDisplay();
    updateRating();

    function updateRating() {
        const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
        if (!allPlayersData[currentPlayer]) {
            allPlayersData[currentPlayer] = { scores: {} };
            localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        }
        
        const sortedPlayers = Object.entries(allPlayersData)
        .map(([name, data]) => ({
            name,
            totalScore: Object.values(data.scores || {}).reduce((sum, score) => sum + (score.points || 0), 0),
            levelScores: data.scores || {}
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

        levelScoresList.innerHTML = '';
        sortedPlayers.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'player-item';
            
            const playerHeader = document.createElement('div');
            playerHeader.className = 'player-header';
            playerHeader.innerHTML = `
                <span class="player-rank">${index + 1}.</span>
                <span class="player-name">${player.name}</span>
                <span class="player-score">Очки: ${player.totalScore}</span>
                <span class="toggle-levels">▼</span>
            `;
            
            const levelDetails = document.createElement('div');
            levelDetails.className = 'level-details';
            
            // Добавляем детали по уровням
            const levelsUl = document.createElement('ul');
            levelsUl.className = 'level-sublist';
            
            // Сортируем уровни по номеру
            const sortedLevels = Object.entries(player.levelScores)
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
            
            if (sortedLevels.length > 0) {
                sortedLevels.forEach(([level, scoreData]) => {
                    const levelLi = document.createElement('li');
                    levelLi.innerHTML = `Уровень ${level}: ${scoreData.points > 0 ? '+' : ''}${scoreData.points} очков`;
                    levelsUl.appendChild(levelLi);
                });
            } 
            else {
                const levelLi = document.createElement('li');
                levelLi.textContent = 'Нет данных по уровням';
                levelsUl.appendChild(levelLi);
            }
            
            levelDetails.appendChild(levelsUl);
            
            li.appendChild(playerHeader);
            li.appendChild(levelDetails);
            levelScoresList.appendChild(li);

            // Добавляем обработчик клика для раскрытия/скрытия деталей
            playerHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                levelDetails.classList.toggle('collapsed');
                const toggleSpan = playerHeader.querySelector('.toggle-levels');
                toggleSpan.textContent = levelDetails.classList.contains('collapsed') ? '▼' : '▲';
            });

            // Инициализируем свернутым
            levelDetails.classList.add('collapsed');
        });

        // Обновляем общий счет текущего игрока
        const currentPlayerData = allPlayersData[currentPlayer] || {};
        const totalScore = Object.values(currentPlayerData.scores || {}).reduce((sum, score) => sum + (score.points || 0), 0);
        totalScoreElement.textContent = `Общий счёт: ${totalScore}`;
    }

    // Остальные обработчики событий остаются без изменений
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'updateScore') {
            const { level, points } = event.data;
            const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
            
            if (!allPlayersData[currentPlayer]) {
                allPlayersData[currentPlayer] = { scores: {} };
            }
            
            allPlayersData[currentPlayer].scores[level] = {
                points: (allPlayersData[currentPlayer].scores[level]?.points || 0) + points,
            };
            
            localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
            updateRating();
        }
    });

    window.addEventListener('resetRating', () => {
        const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
        if (allPlayersData[currentPlayer]) {
            allPlayersData[currentPlayer].scores = {};
            localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        }
        updateRating();
    });

    window.addEventListener('playerNameChanged', updateRating);

    // Обновляем отображение рейтинга для мобильных устройств
    function updateScoreDisplay() {
    const totalScoreElement = document.getElementById('total-score');
    const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
    const allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
    const currentPlayerData = allPlayersData[currentPlayer] || { scores: {} };
    const totalScore = Object.values(currentPlayerData.scores).reduce((sum, score) => sum + (score.points || 0), 0);

    if (totalScoreElement) {
        if (window.innerWidth <= 768) {
            totalScoreElement.textContent = totalScore.toString();
        } 
        else {
            totalScoreElement.textContent = `Общий счёт: ${totalScore}`;
        }
    }
}
 
    // Вызываем при загрузке и при изменении размера окна
    window.addEventListener('load', updateScoreDisplay);
    window.addEventListener('resize', updateScoreDisplay);

    updateRating();
    window.addEventListener('resize', updateScoreDisplay);

    
});
