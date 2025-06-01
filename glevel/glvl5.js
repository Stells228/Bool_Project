document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    let gameMode = urlParams.get('mode') || localStorage.getItem('gameMode') || 'normal';
    localStorage.setItem('gameMode', gameMode);
    console.log('[GameLevel5] Initialized gameMode:', gameMode);
    
    const matrixContainer = document.getElementById('matrixContainer');
    const checkBtn = document.getElementById('checkBtn');
    const alreadyHamiltonianBtn = document.getElementById('alreadyHamiltonianBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const generateBtn = document.getElementById('generateBtn');
    const toMap = document.getElementById('toMap');
    const toLevel4 = document.getElementById('toLevel4');
    const toLevel6 = document.getElementById('toLevel6');
    const verticesInput = document.getElementById('vertices');
    const feedback = document.getElementById('feedback');
    const graphContainer = document.getElementById('graph-visualization');
    graphContainer.style.height = '100%';

    let scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) {
        scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';
        scoreDisplay.className = 'score-display';
        document.querySelector('.level-container').appendChild(scoreDisplay);
        console.log('[GameLevel5] Created score-display element');
    }

    const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
    let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
    if (!allPlayersData[currentPlayer]) {
        allPlayersData[currentPlayer] = { scores: {}, gScores: {} };
    }
    if (!allPlayersData[currentPlayer].gScores[5]) {
        allPlayersData[currentPlayer].gScores[5] = { points: 0 };
    }
    let score = parseInt(allPlayersData[currentPlayer].gScores[5].points) || 0;
    scoreDisplay.textContent = `Счёт: ${score}`;
    scoreDisplay.style.display = gameMode === 'competition' ? 'block' : 'none';

    let gCompletedLevels = JSON.parse(localStorage.getItem('gCompletedLevels')) || [];
    let hasWon = gCompletedLevels.includes(5);

    toMap?.addEventListener('click', () => {
        console.log('[GameLevel5] Navigating to gmap.html with mode:', gameMode);
        window.location.href = `../gmap.html?mode=${gameMode}`;
    });
    toLevel4?.addEventListener('click', () => {
        console.log('[GameLevel5] Navigating to glevel4.html with mode:', gameMode);
        window.location.href = `glevel4.html?mode=${gameMode}`;
    });
    toLevel6?.addEventListener('click', () => {
        if (gameMode === 'passing' && !hasWon) {
            showFeedback('Сначала завершите текущий уровень', 'error');
            return;
        }
        console.log('[GameLevel5] Navigating to glevel6.html with mode:', gameMode);
        window.location.href = `glevel6.html?mode=${gameMode}`;
    });

    if (gameMode === 'passing') {
        toLevel6.disabled = !hasWon;
        toLevel6.style.opacity = hasWon ? '1' : '0.5';
        toLevel6.style.cursor = hasWon ? 'pointer' : 'not-allowed';
    }

    generateBtn.addEventListener('click', generateGraph);
    checkBtn.addEventListener('click', checkAnswer);
    alreadyHamiltonianBtn.addEventListener('click', () => {
        if (isHamiltonianCyclePresent()) {
            showFeedback('✅ Граф уже содержит гамильтонов цикл!', 'correct');
            toggleButtonsAfterCheck();
            handleCorrectAnswer();
        } 
        else {
            showFeedback('❌ В графе нет гамильтонова цикла.', 'incorrect');
            if (gameMode === 'competition') {
                updateScore(-5);
            }
        }
    });
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
    let currentNodes = 0;
    let lastGraphs = [];
    const MAX_REPEAT = 3;

    function generateGraph() {
        const n = parseInt(verticesInput.value);
        if (isNaN(n) || n < 3 || n > 20) {
            showFeedback("Введите корректное количество вершин (3-20)", "error");
            return;
        }

        currentNodes = n;
        const matrix = Array.from({ length: n }, () => Array(n).fill(0));
        
        // Генерация случайного графа
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j && Math.random() < 0.25) {
                    matrix[i][j] = 1;
                }
            }
        }

        const matrixString = matrixToString(matrix);
        if (countRepeats(matrixString) >= MAX_REPEAT) {
            showFeedback("Слишком много повторов одного и того же графа. Генерируем новый...", "error");
            return generateGraph();
        }
        saveGraph(matrixString);

        renderMatrix(matrix);
        updateGraphVisualization(matrix);
        resetTask();
    }

    function matrixToString(matrix) {
        return matrix.map(row => row.join('')).join('|');
    }

    function countRepeats(matrixString) {
        return lastGraphs.filter(g => g === matrixString).length;
    }

    function saveGraph(matrixString) {
        lastGraphs.push(matrixString);
        if (lastGraphs.length > MAX_REPEAT) {
            lastGraphs.shift();
        }
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
                input.addEventListener('change', onMatrixChange);
                cell.appendChild(input);
                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        wrapper.appendChild(table);
    }

    function onMatrixChange() {
        const matrix = readMatrix();
        updateGraphVisualization(matrix);
    }

    function readMatrix() {
        const inputs = matrixContainer.querySelectorAll('input');
        const matrix = Array.from({ length: currentNodes }, () => Array(currentNodes).fill(0));
        inputs.forEach(input => {
            const r = parseInt(input.dataset.row);
            const c = parseInt(input.dataset.col);
            const val = parseInt(input.value);
            matrix[r][c] = val === 1 ? 1 : 0;
        });
        return matrix;
    }

    function updateGraphVisualization(matrix) {
        graphContainer.innerHTML = '';
        vertices = [];
        for (let i = 0; i < currentNodes; i++) {
            vertices.push(new Vertex(String.fromCharCode(65 + i)));
        }

        for (let i = 0; i < currentNodes; i++) {
            for (let j = 0; j < currentNodes; j++) {
                if (matrix[i][j] === 1) {
                    vertices[i].addEdge(vertices[j]);
                }
            }
        }

        const nodes = new vis.DataSet(
            vertices.map((v, i) => ({ id: i, label: v.name }))
        );

        const edges = new vis.DataSet([]);
        vertices.forEach((vertex, i) => {
            vertex.adjacent.forEach(adjVertex => {
                const j = vertices.indexOf(adjVertex);
                edges.add({ from: i, to: j, arrows: 'to', width: 2 });
            });
        });

        const data = { nodes, edges };
        const options = {
            physics: { enabled: false },
            interaction: { dragNodes: false, dragView: false, zoomView: false, selectable: false },
            nodes: { font: { size: 16 } },
            edges: {
                smooth: false,
                arrows: { to: { enabled: true, scaleFactor: 0.5 } }
            },
            layout: { improvedLayout: true, randomSeed: 1 },
            configure: { enabled: false }
        };

        new vis.Network(graphContainer, data, options);
    }

    function checkAnswer() {
        const matrix = readMatrix();

        const matrixString = matrixToString(matrix);
        if (countRepeats(matrixString) >= MAX_REPEAT) {
            showFeedback("Нельзя отправлять один и тот же граф более 3 раз подряд", "error");
            return;
        }
        saveGraph(matrixString);

        if (!isStronglyConnected(matrix)) {
            showFeedback("❌ Граф не является сильно связным, гамильтонова цикла нет.", "incorrect");
            if (gameMode === 'competition') {
                updateScore(-5);
            }
            return;
        }

        if (isHamiltonianCyclePresent(matrix)) {
            showFeedback("✅ Поздравляем! Граф содержит гамильтонов цикл.", "correct");
            toggleButtonsAfterCheck();
            handleCorrectAnswer();
        } 
        else {
            showFeedback("❌ Гамильтонова цикла в графе нет. Продолжайте редактировать.", "incorrect");
            if (gameMode === 'competition') {
                updateScore(-5);
            }
        }
    }

    function isStronglyConnected(matrix) {
        const n = matrix.length;
        if (n === 0) return false;

        function dfs(v, visited, graph) {
            visited[v] = true;
            for (let u = 0; u < n; u++) {
                if (graph[v][u] === 1 && !visited[u]) {
                    dfs(u, visited, graph);
                }
            }
        }

        let visited = Array(n).fill(false);
        dfs(0, visited, matrix);
        if (visited.some(v => !v)) return false;

        const transposed = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                transposed[j][i] = matrix[i][j];
            }
        }

        visited = Array(n).fill(false);
        dfs(0, visited, transposed);
        if (visited.some(v => !v)) return false;

        return true;
    }

    function isHamiltonianCyclePresent(matrix = null) {
        if (!matrix) matrix = readMatrix();
        const n = currentNodes;
        if (n < 3) return false;

        for (let i = 0; i < n; i++) {
            let outDeg = 0, inDeg = 0;
            for (let j = 0; j < n; j++) {
                if (matrix[i][j] === 1) outDeg++;
                if (matrix[j][i] === 1) inDeg++;
            }
            if (outDeg < 1 || inDeg < 1) return false;
        }

        const visited = Array(n).fill(false);
        const path = [];

        function dfs(v, depth) {
            path.push(v);
            visited[v] = true;

            if (depth === n) {
                if (matrix[v][path[0]] === 1) return true;
                path.pop();
                visited[v] = false;
                return false;
            }

            for (let u = 0; u < n; u++) {
                if (matrix[v][u] === 1 && !visited[u]) {
                    if (dfs(u, depth + 1)) return true;
                }
            }

            path.pop();
            visited[v] = false;
            return false;
        }

        return dfs(0, 1);
    }

    function handleCorrectAnswer() {
        if (gameMode === 'competition') {
            updateScore(10);
        }

        if (gameMode === 'passing' && !hasWon) {
            hasWon = true;
            if (!gCompletedLevels.includes(5)) {
                gCompletedLevels.push(5);
                localStorage.setItem('gCompletedLevels', JSON.stringify(gCompletedLevels));
                window.parent.postMessage({ type: 'levelCompleted', level: 5 }, '*');
                console.log('[GameLevel5] Level 5 completed, gCompletedLevels:', gCompletedLevels);
            }
            toLevel6.disabled = false;
            toLevel6.style.opacity = '1';
            toLevel6.style.cursor = 'pointer';
        }
    }

    function updateScore(points) {
        if (gameMode !== 'competition') return;
        allPlayersData[currentPlayer].gScores[5].points += points;
        localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        score = allPlayersData[currentPlayer].gScores[5].points;
        scoreDisplay.textContent = `Счёт: ${score >= 0 ? score : '-' + Math.abs(score)}`; 
        console.log('[GameLevel5] Updated score:', score, 'Added points:', points, 'for player:', currentPlayer);
        window.parent.postMessage({ 
            type: 'updateScore', 
            level: 5, 
            points: points, 
            isGraphLevel: true 
        }, '*');
    }

    function toggleButtonsAfterCheck() {
        checkBtn.style.display = 'none';
        alreadyHamiltonianBtn.style.display = 'none';
        tryAgainBtn.style.display = 'inline-block';
    }

    function resetTask() {
        feedback.textContent = '';
        feedback.className = 'feedback';
        checkBtn.style.display = 'inline-block';
        alreadyHamiltonianBtn.style.display = 'inline-block';
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