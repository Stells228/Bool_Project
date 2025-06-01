document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    let gameMode = urlParams.get('mode') || localStorage.getItem('gameMode') || 'normal';
    localStorage.setItem('gameMode', gameMode);
    console.log('[GameLevel6] Initialized gameMode:', gameMode);
    
    const matrixContainer = document.getElementById('matrixContainer');
    const checkBtn = document.getElementById('checkBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const generateBtn = document.getElementById('generateBtn');
    const toMap = document.getElementById('toMap');
    const toLevel5 = document.getElementById('toLevel5');
    const toLevel7 = document.getElementById('toLevel7');
    const verticesInput = document.getElementById('vertices');
    const userAnswerInput = document.getElementById('userAnswer');
    const feedback = document.getElementById('feedback');
    const graphContainer = document.getElementById('graph-visualization');
    graphContainer.style.height = '100%';

    let scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) {
        scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';
        scoreDisplay.className = 'score-display';
        document.querySelector('.level-container').appendChild(scoreDisplay);
        console.log('[GameLevel6] Created score-display element');
    }

    const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
    let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
    if (!allPlayersData[currentPlayer]) {
        allPlayersData[currentPlayer] = { scores: {}, gScores: {} };
    }
    if (!allPlayersData[currentPlayer].gScores[6]) {
        allPlayersData[currentPlayer].gScores[6] = { points: 0 };
    }
    let score = parseInt(allPlayersData[currentPlayer].gScores[6].points) || 0;
    scoreDisplay.textContent = `Счёт: ${score >= 0 ? score : '-' + Math.abs(score)}`; 
    scoreDisplay.style.display = gameMode === 'competition' ? 'block' : 'none';

    let gCompletedLevels = JSON.parse(localStorage.getItem('gCompletedLevels')) || [];
    let hasWon = gCompletedLevels.includes(6);

    toMap?.addEventListener('click', () => {
        console.log('[GameLevel6] Navigating to gmap.html with mode:', gameMode);
        window.location.href = `../gmap.html?mode=${gameMode}`;
    });
    toLevel5?.addEventListener('click', () => {
        console.log('[GameLevel6] Navigating to glevel5.html with mode:', gameMode);
        window.location.href = `glevel5.html?mode=${gameMode}`;
    });
    toLevel7?.addEventListener('click', () => {
        if (gameMode === 'passing' && !hasWon) {
            showFeedback('Сначала завершите текущий уровень', 'error');
            return;
        }
        console.log('[GameLevel6] Navigating to glevel7.html with mode:', gameMode);
        window.location.href = `glevel7.html?mode=${gameMode}`;
    });

    if (gameMode === 'passing' && toLevel7) {
        toLevel7.disabled = !hasWon;
        toLevel7.style.opacity = hasWon ? '1' : '0.5';
        toLevel7.style.cursor = hasWon ? 'pointer' : 'not-allowed';
    }

    generateBtn.addEventListener('click', generateGraph);
    checkBtn.addEventListener('click', checkAnswer);
    tryAgainBtn.addEventListener('click', resetTask);

    let currentNodes = 0;
    let adjacencyMatrix = [];
    let currentColoring = [];

    const colorPalette = [
        '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
        '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
        '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
        '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
    ];

    function generateGraph() {
        const n = parseInt(verticesInput.value);
        if (isNaN(n) || n < 3 || n > 20) {
            showFeedback("Введите корректное количество вершин (3-20)", "error");
            return;
        }

        currentNodes = n;
        adjacencyMatrix = generateRandomUndirectedGraph(n, 0.3);
        currentColoring = [];

        renderMatrix(adjacencyMatrix);
        updateGraphVisualization(adjacencyMatrix, currentColoring);
        resetTask();
    }

    function generateRandomUndirectedGraph(n, edgeProb) {
        const matrix = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (Math.random() < edgeProb) {
                    matrix[i][j] = 1;
                    matrix[j][i] = 1;
                }
            }
        }
        return matrix;
    }

    function renderMatrix(matrix) {
        matrixContainer.innerHTML = '<div class="matrix-wrapper"></div>';
        const wrapper = matrixContainer.querySelector('.matrix-wrapper');

        const table = document.createElement('table');
        const header = document.createElement('tr');
        header.appendChild(document.createElement('th'));
        for (let j = 0; j < currentNodes; j++) {
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + j);
            header.appendChild(th);
        }
        table.appendChild(header);

        for (let i = 0; i < currentNodes; i++) {
            const row = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + i);
            row.appendChild(th);

            for (let j = 0; j < currentNodes; j++) {
                const cell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.max = '1';
                input.value = matrix[i][j];
                input.dataset.row = i;
                input.dataset.col = j;
                input.readOnly = true;
                cell.appendChild(input);
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        wrapper.appendChild(table);
    }

    function updateGraphVisualization(matrix, coloring) {
        graphContainer.innerHTML = '';
        const nodes = new vis.DataSet(
            Array.from({ length: currentNodes }, (_, i) => ({
                id: i,
                label: String.fromCharCode(65 + i),
                color: coloring && coloring[i] !== undefined ? 
                       colorPalette[coloring[i] % colorPalette.length] : '#97c2fc'
            }))
        );

        const edges = new vis.DataSet([]);
        for (let i = 0; i < currentNodes; i++) {
            for (let j = i + 1; j < currentNodes; j++) {
                if (matrix[i][j] === 1) {
                    edges.add({ from: i, to: j, width: 2 });
                    edges.add({ from: j, to: i, width: 2 });
                }
            }
        }

        const data = { nodes, edges };
        const options = {
            physics: { enabled: false },
            interaction: { dragNodes: false, dragView: false, zoomView: false, selectable: false },
            nodes: { font: { size: 16 } },
            edges: { smooth: false },
            layout: { improvedLayout: true, randomSeed: 1 },
            configure: { enabled: false }
        };

        new vis.Network(graphContainer, data, options);
    }

    function greedyColoring(matrix) {
        const n = matrix.length;
        const result = Array(n).fill(-1);
        result[0] = 0;

        const available = Array(n).fill(true);

        for (let u = 1; u < n; u++) {
            for (let i = 0; i < n; i++) {
                if (matrix[u][i] === 1 && result[i] !== -1) {
                    available[result[i]] = false;
                }
            }

            let cr;
            for (cr = 0; cr < n; cr++) {
                if (available[cr]) break;
            }

            result[u] = cr;
            available.fill(true);
        }
        return result;
    }

    function checkAnswer() {
        const userAnswer = parseInt(userAnswerInput.value);
        if (isNaN(userAnswer)) {
            showFeedback("Введите число цветов", "error");
            return;
        }

        const coloring = greedyColoring(adjacencyMatrix);
        currentColoring = coloring;
        const usedColors = new Set(coloring);
        const chromaticNumber = usedColors.size;

        updateGraphVisualization(adjacencyMatrix, coloring);

        if (userAnswer === chromaticNumber) {
            showFeedback(`✅ Правильно! Хроматическое число: ${chromaticNumber}`, "correct");
            if (gameMode === 'competition') {
                updateScore(10);
            }
            if (gameMode === 'passing' && !hasWon) {
                hasWon = true;
                if (!gCompletedLevels.includes(6)) {
                    gCompletedLevels.push(6);
                    localStorage.setItem('gCompletedLevels', JSON.stringify(gCompletedLevels));
                    window.parent.postMessage({ type: 'levelCompleted', level: 6 }, '*');
                    console.log('[GameLevel6] Level 6 completed, gCompletedLevels:', gCompletedLevels);
                }
                if (toLevel7) {
                    toLevel7.disabled = false;
                    toLevel7.style.opacity = '1';
                    toLevel7.style.cursor = 'pointer';
                }
            }
        } 
        else {
            showFeedback(`❌ Неправильно. Хроматическое число: ${chromaticNumber}`, "incorrect");
            if (gameMode === 'competition') {
                updateScore(-5);
            }
        }

        checkBtn.style.display = 'none';
        tryAgainBtn.style.display = 'inline-block';
    }

    function updateScore(points) {
        if (gameMode !== 'competition') return;
        allPlayersData[currentPlayer].gScores[6].points += points;
        localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        score = allPlayersData[currentPlayer].gScores[6].points;
        scoreDisplay.textContent = `Счёт: ${score}`;
        console.log('[GameLevel6] Updated score:', score, 'Added points:', points, 'for player:', currentPlayer);
        window.parent.postMessage({ 
            type: 'updateScore', 
            level: 6, 
            points: points, 
            isGraphLevel: true 
        }, '*');
    }

    function resetTask() {
        userAnswerInput.value = '';
        feedback.textContent = '';
        feedback.className = 'feedback';
        checkBtn.style.display = 'inline-block';
        tryAgainBtn.style.display = 'none';
    }

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `feedback ${type} show`;
        setTimeout(() => {
            feedback.className = `feedback ${type}`;
        }, 2000);
    }

    generateGraph();
});