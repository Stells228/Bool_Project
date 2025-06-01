let totalScore = 0;

function updateScoreDisplay() {
    const totalScoreElement = document.getElementById('total-score');
    const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
    const allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
    const currentPlayerData = allPlayersData[currentPlayer] || { scores: {}, gScores: {} };

    if (!allPlayersData[currentPlayer]) {
        allPlayersData[currentPlayer] = { scores: {}, gScores: {} };
        localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
    }

    const totalScore = 
        Object.values(currentPlayerData.scores || {}).reduce((sum, score) => sum + (score.points || 0), 0) +
        Object.values(currentPlayerData.gScores || {}).reduce((sum, score) => sum + (score.points || 0), 0);

    if (totalScoreElement) {
        if (window.innerWidth <= 768) {
            totalScoreElement.textContent = totalScore.toString();
        } 
        else {
            totalScoreElement.textContent = `Общий счёт: ${totalScore}`;
        }
    }

    const ratingSummary = document.querySelector('.rating-summary');
    if (ratingSummary) {
        ratingSummary.setAttribute('data-score', totalScore);
    }
    console.log('rating.js: Обновлён общий счёт:', totalScore, 'Игрок:', currentPlayer);
}

document.addEventListener('DOMContentLoaded', () => {
    const levelScoresList = document.getElementById('level-scores');

    let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
    const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
    if (!allPlayersData[currentPlayer]) {
        allPlayersData[currentPlayer] = { scores: {}, gScores: {} };
        localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
    }

    updateScoreDisplay();
    updateRating();

    function updateRating() {
        const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
        const allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};

        if (!allPlayersData[currentPlayer]) {
            allPlayersData[currentPlayer] = { scores: {}, gScores: {} };
            localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        }

        const sortedPlayers = Object.entries(allPlayersData)
            .map(([name, data]) => ({
                name,
                boolScore: Object.values(data.scores || {}).reduce((sum, score) => sum + (score.points || 0), 0),
                graphScore: Object.values(data.gScores || {}).reduce((sum, score) => sum + (score.points || 0), 0),
                totalScore: Object.values(data.scores || {}).reduce((sum, score) => sum + (score.points || 0), 0) +
                           Object.values(data.gScores || {}).reduce((sum, score) => sum + (score.points || 0), 0),
                boolScores: data.scores || {},
                graphScores: data.gScores || {}
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
            levelDetails.className = 'level-details collapsed';

            const categoriesDiv = document.createElement('div');
            categoriesDiv.className = 'categories-container';

            const boolCategory = document.createElement('div');
            boolCategory.className = 'category';
            boolCategory.innerHTML = `<h4>Булевы функции: ${player.boolScore}</h4>`;

            const boolLevelsUl = document.createElement('ul');
            boolLevelsUl.className = 'level-sublist';

            Object.entries(player.boolScores).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([level, scoreData]) => {
                const levelLi = document.createElement('li');
                levelLi.innerHTML = `Уровень ${level}: ${scoreData.points > 0 ? '+' : ''}${scoreData.points} очков`;
                boolLevelsUl.appendChild(levelLi);
            });

            boolCategory.appendChild(boolLevelsUl);
            categoriesDiv.appendChild(boolCategory);

            const graphCategory = document.createElement('div');
            graphCategory.className = 'category';
            graphCategory.innerHTML = `<h4>Графы: ${player.graphScore}</h4>`;

            const graphLevelsUl = document.createElement('ul');
            graphLevelsUl.className = 'level-sublist';

            Object.entries(player.graphScores).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([level, scoreData]) => {
                const levelLi = document.createElement('li');
                levelLi.innerHTML = `Уровень ${level}: ${scoreData.points > 0 ? '+' : ''}${scoreData.points} очков`;
                graphLevelsUl.appendChild(levelLi);
            });

            graphCategory.appendChild(graphLevelsUl);
            categoriesDiv.appendChild(graphCategory);

            levelDetails.appendChild(categoriesDiv);
            li.appendChild(playerHeader);
            li.appendChild(levelDetails);
            levelScoresList.appendChild(li);

            playerHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                levelDetails.classList.toggle('collapsed');
                const toggleSpan = playerHeader.querySelector('.toggle-levels');
                toggleSpan.textContent = levelDetails.classList.contains('collapsed') ? '▼' : '▲';
            });
        });

        updateScoreDisplay();
        console.log('rating.js: Рейтинг обновлён для игрока:', currentPlayer);
    }

    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'updateScore') {
            console.log('rating.js: Получено сообщение:', event.data);
            const { level, points, isGraphLevel } = event.data;
            const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';

            if (!allPlayersData[currentPlayer]) {
                allPlayersData[currentPlayer] = { scores: {}, gScores: {} };
            }

            if (isGraphLevel) {
                allPlayersData[currentPlayer].gScores[level] = {
                    points: (allPlayersData[currentPlayer].gScores[level]?.points || 0) + points,
                };
            } 
            else {
                allPlayersData[currentPlayer].scores[level] = {
                    points: (allPlayersData[currentPlayer].scores[level]?.points || 0) + points,
                };
            }

            localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
            updateRating();
        }
    });

    window.addEventListener('resetRating', () => {
        const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
        if (allPlayersData[currentPlayer]) {
            allPlayersData[currentPlayer].scores = {};
            allPlayersData[currentPlayer].gScores = {};
            localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        }
        updateRating();
        console.log('rating.js: Рейтинг сброшен для игрока:', currentPlayer);
    });

    window.addEventListener('playerNameChanged', updateRating);
    window.addEventListener('updateRating', updateRating);

    window.addEventListener('load', updateScoreDisplay);
    window.addEventListener('resize', updateScoreDisplay);

    updateRating();
});