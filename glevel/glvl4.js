document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    let gameMode = urlParams.get('mode') || localStorage.getItem('gameMode') || 'normal';
    localStorage.setItem('gameMode', gameMode);
    console.log('[GameLevel4] Initialized gameMode:', gameMode);

    const matrixContainer = document.getElementById('matrixContainer');
    const checkBtn = document.getElementById('checkBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const generateBtn = document.getElementById('generateBtn');
    const toMap = document.getElementById('toMap');
    const toLevel3 = document.getElementById('toLevel3');
    const toLevel5 = document.getElementById('toLevel5');
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
        console.log('[GameLevel4] Created score-display element');
    }

    const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
    let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
    if (!allPlayersData[currentPlayer]) {
        allPlayersData[currentPlayer] = { scores: {}, gScores: {} };
    }
    if (!allPlayersData[currentPlayer].gScores[4]) {
        allPlayersData[currentPlayer].gScores[4] = { points: 0 };
    }
    let score = parseInt(allPlayersData[currentPlayer].gScores[4].points) || 0;
    scoreDisplay.textContent = `Счёт: ${score}`;
    scoreDisplay.style.display = gameMode === 'competition' ? 'block' : 'none';

    let gCompletedLevels = JSON.parse(localStorage.getItem('gCompletedLevels')) || [];
    let hasWon = gCompletedLevels.includes(4);

    toMap?.addEventListener('click', () => {
        console.log('[GameLevel4] Navigating to gmap.html with mode:', gameMode);
        window.location.href = `../gmap.html?mode=${gameMode}`;
    });
    toLevel3?.addEventListener('click', () => {
        console.log('[GameLevel4] Navigating to glevel3.html with mode:', gameMode);
        window.location.href = `glevel3.html?mode=${gameMode}`;
    });
    toLevel5?.addEventListener('click', () => {
        if (gameMode === 'passing' && !hasWon) {
            showFeedback('Сначала завершите текущий уровень', 'error');
            return;
        }
        console.log('[GameLevel4] Navigating to glevel5.html with mode:', gameMode);
        window.location.href = `glevel5.html?mode=${gameMode}`;
    });

    if (gameMode === 'passing') {
        toLevel5.disabled = !hasWon;
        toLevel5.style.opacity = hasWon ? '1' : '0.5';
        toLevel5.style.cursor = hasWon ? 'pointer' : 'not-allowed';
    }

    generateBtn.addEventListener('click', generateMatrix);
    checkBtn.addEventListener('click', checkAnswer);
    tryAgainBtn.addEventListener('click', resetTask);

    class Vertex {
        constructor(name) {
            this.name = name;
            this.adjacent = [];
        }
        addEdge(vertex) {
            if (!this.adjacent.includes(vertex)) {
                this.adjacent.push(vertex);
            }
        }
    }

    let vertices = [];
    let capacityMatrix = [];
    let currentNodes = 0;

    function generateMatrix() {
        const n = parseInt(verticesInput.value);
        if (isNaN(n) || n < 2 || n > 20) {
            showFeedback("Введите корректное количество вершин (2-20)", "error");
            return;
        }

        currentNodes = n;
        matrixContainer.innerHTML = '<div class="matrix-wrapper"></div>';
        const wrapper = matrixContainer.querySelector('.matrix-wrapper');

        if (n > 4) {
            wrapper.style.overflowX = 'auto';
            wrapper.style.maxHeight = '300px';
        } 
        else {
            wrapper.style.overflowX = 'visible';
            wrapper.style.maxHeight = 'none';
        }

        feedback.textContent = '';
        feedback.className = 'feedback';
        userAnswerInput.value = '';
        checkBtn.style.display = 'inline-block';
        tryAgainBtn.style.display = 'none';

        const table = document.createElement('table');
        const header = document.createElement('tr');
        header.appendChild(document.createElement('th'));

        for (let j = 0; j < n; j++) {
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + j);
            header.appendChild(th);
        }
        table.appendChild(header);

        for (let i = 0; i < n; i++) {
            const row = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + i);
            row.appendChild(th);

            for (let j = 0; j < n; j++) {
                const cell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.max = '20';
                input.value = i === j ? 0 : (Math.random() < 0.3 ? Math.floor(Math.random() * 10) + 1 : 0);
                input.dataset.row = i;
                input.dataset.col = j;
                input.addEventListener('change', updateGraph);
                cell.appendChild(input);
                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        wrapper.appendChild(table);

        const inputs = matrixContainer.querySelectorAll('input');
        inputs.forEach(input => {
            input.readOnly = true;
        });

        updateGraph();
    }

    function updateGraph() {
        graphContainer.innerHTML = '';
        vertices = [];
        capacityMatrix = Array.from({ length: currentNodes }, () => Array(currentNodes).fill(0));

        for (let i = 0; i < currentNodes; i++) {
            vertices.push(new Vertex(String.fromCharCode(65 + i)));
        }

        const inputs = matrixContainer.querySelectorAll('input');
        inputs.forEach(input => {
            const from = parseInt(input.dataset.row);
            const to = parseInt(input.dataset.col);
            const val = parseInt(input.value);
            capacityMatrix[from][to] = val;

            if (val > 0 && from !== to) {
                vertices[from].addEdge(vertices[to]);
            }
        });

        drawGraph();
    }

    function drawGraph() {
        const nodes = new vis.DataSet(
            vertices.map((v, i) => ({
                id: i,
                label: v.name,
                color: i === 0 ? '#7BE141' : (i === currentNodes - 1 ? '#FF6C6C' : '#97C2FC')
            }))
        );

        const edges = new vis.DataSet([]);
        vertices.forEach((vertex, i) => {
            vertex.adjacent.forEach(adjVertex => {
                const j = vertices.indexOf(adjVertex);
                edges.add({
                    from: i,
                    to: j,
                    arrows: 'to',
                    label: capacityMatrix[i][j].toString(),
                    font: { align: 'top' },
                    color: { color: '#848484' }
                });
            });
        });

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

    function bfs(residualGraph, s, t, parent) {
        const visited = Array(currentNodes).fill(false);
        const queue = [];
        queue.push(s);
        visited[s] = true;
        parent[s] = -1;

        while (queue.length > 0) {
            const u = queue.shift();
            for (let v = 0; v < currentNodes; v++) {
                if (!visited[v] && residualGraph[u][v] > 0) {
                    queue.push(v);
                    parent[v] = u;
                    visited[v] = true;
                    if (v === t) return true;
                }
            }
        }
        return false;
    }

    function fordFulkerson(graph, source, sink) {
        const residualGraph = graph.map(row => row.slice());
        const parent = Array(currentNodes).fill(-1);
        let maxFlow = 0;

        while (bfs(residualGraph, source, sink, parent)) {
            let pathFlow = Infinity;
            for (let v = sink; v !== source; v = parent[v]) {
                const u = parent[v];
                pathFlow = Math.min(pathFlow, residualGraph[u][v]);
            }

            for (let v = sink; v !== source; v = parent[v]) {
                const u = parent[v];
                residualGraph[u][v] -= pathFlow;
                residualGraph[v][u] += pathFlow;
            }

            maxFlow += pathFlow;
        }

        return maxFlow;
    }

    function updateScore(points) {
        if (gameMode !== 'competition') return;
        allPlayersData[currentPlayer].gScores[4].points += points;
        localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        score = allPlayersData[currentPlayer].gScores[4].points;
        scoreDisplay.textContent = `Счёт: ${score >= 0 ? score : '-' + Math.abs(score)}`;
        console.log('[GameLevel4] Updated score:', score, 'Added points:', points, 'for player:', currentPlayer);
        window.parent.postMessage({
            type: 'updateScore',
            level: 4,
            points: points,
            isGraphLevel: true
        }, '*');
    }

    function checkAnswer() {
        if (!matrixContainer.querySelector('table')) {
            showFeedback("Сначала создайте матрицу", "error");
            return;
        }

        const n = parseInt(verticesInput.value);
        if (isNaN(n) || n < 2 || n > 20) {
            showFeedback("Сначала создайте матрицу", "error");
            return;
        }

        const userAnswer = parseInt(userAnswerInput.value);
        if (isNaN(userAnswer) || userAnswer < 0) {
            showFeedback("Введите корректное значение максимального потока", "error");
            return;
        }

        const maxFlow = fordFulkerson(capacityMatrix, 0, currentNodes - 1);

        if (userAnswer === maxFlow) {
            showFeedback(`✅ Правильно! Максимальный поток: ${maxFlow}`, "correct");
            if (gameMode === 'competition') {
                updateScore(10);
            }
            if (gameMode === 'passing' && !hasWon) {
                hasWon = true;
                if (!gCompletedLevels.includes(4)) {
                    gCompletedLevels.push(4);
                    localStorage.setItem('gCompletedLevels', JSON.stringify(gCompletedLevels));
                    window.parent.postMessage({ type: 'levelCompleted', level: 4 }, '*');
                    console.log('[GameLevel4] Level 4 completed, gCompletedLevels:', gCompletedLevels);
                }
                toLevel5.disabled = false;
                toLevel5.style.opacity = '1';
                toLevel5.style.cursor = 'pointer';
            }
        } 
        else {
            showFeedback(`❌ Неправильно. Максимальный поток: ${maxFlow}`, "incorrect");
            if (gameMode === 'competition') {
                updateScore(-10);
            }
        }

        checkBtn.style.display = 'none';
        tryAgainBtn.style.display = 'inline-block';
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

    generateMatrix();
});