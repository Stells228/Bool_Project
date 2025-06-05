document.addEventListener('DOMContentLoaded', () => {
    const matrixContainer = document.getElementById('matrixContainer');
    const checkBtn = document.getElementById('checkBtn');
    const userAnswerInput = document.getElementById('userAnswer');
    const feedback = document.getElementById('feedback');
    const graphContainer = document.getElementById('graph-visualization');
    graphContainer.style.height = '100%';

    const colorPalette = [
        '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
        '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
        '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
        '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
    ];

    let currentNodes = 0;
    let adjacencyMatrix = [];
    let currentColoring = [];
    let chromaticNumber = 0;
    let isMultiplayer = false;
    let hasAnswered = false;
    let socket = null;
    let roomCode = '';

    const params = new URLSearchParams(window.location.search);
    isMultiplayer = params.get('mode') === 'multiplayer';
    roomCode = params.get('room');

    if (isMultiplayer) {
        socket = io('https://lichinkis.ru/');
        const task = JSON.parse(localStorage.getItem('currentTask'));
        if (task) {
            adjacencyMatrix = task.matrix;
            chromaticNumber = task.correctAnswer;
            currentNodes = adjacencyMatrix.length;
            renderMatrix(adjacencyMatrix);
            updateGraphVisualization(adjacencyMatrix, []);
        }

        checkBtn.textContent = 'Готов';

        socket.on('showResults', () => {
            window.location.href = `../results.html?room=${roomCode}`;
        });

        socket.on('timeUpdate', (timeLeft) => {
            if (timeLeft <= 10) {
                showFeedback(`Осталось ${timeLeft} секунд!`, 'error');
            }
        });
    } 
    else {
        generateGraph();
    }

    function generateGraph() {
        currentNodes = Math.floor(Math.random() * 2) + 3;
        adjacencyMatrix = generateRandomUndirectedGraph(currentNodes, 0.3);
        currentColoring = greedyColoring(adjacencyMatrix);
        chromaticNumber = new Set(currentColoring).size;

        renderMatrix(adjacencyMatrix);
        updateGraphVisualization(adjacencyMatrix, []);
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
                input.value = matrix[i][j];
                input.readOnly = true;
                input.dataset.row = i;
                input.dataset.col = j;
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
                color: coloring[i] !== undefined ? colorPalette[coloring[i] % colorPalette.length] : '#97c2fc'
            }))
        );

        const edges = new vis.DataSet([]);
        for (let i = 0; i < currentNodes; i++) {
            for (let j = i + 1; j < currentNodes; j++) {
                if (matrix[i][j] === 1) {
                    edges.add({ from: i, to: j, width: 2 });
                }
            }
        }

        const data = { nodes, edges };
        const options = {
            physics: false,
            interaction: { dragNodes: false, dragView: false, zoomView: false, selectable: false },
            nodes: { font: { size: 16 } },
            edges: { smooth: false },
            layout: { improvedLayout: true, randomSeed: 1 },
            configure: false
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

            for (let c = 0; c < n; c++) {
                if (available[c]) {
                    result[u] = c;
                    break;
                }
            }
            available.fill(true);
        }

        return result;
    }

    function checkAnswer() {
        if (hasAnswered) return;

        const userAnswer = parseInt(userAnswerInput.value);
        if (isNaN(userAnswer)) {
            showFeedback("Введите число цветов", "error");
            return;
        }

        const coloring = greedyColoring(adjacencyMatrix);
        updateGraphVisualization(adjacencyMatrix, coloring);

        if (isMultiplayer) {
            hasAnswered = true;
            checkBtn.disabled = true;
            checkBtn.style.opacity = '0.5';
            checkBtn.style.cursor = 'not-allowed';

            socket.emit('playerAnswer', {
                room: roomCode,
                answer: userAnswer,
                timestamp: Date.now(),
                correctAnswer: chromaticNumber
            });

            showFeedback("Ответ отправлен! Ожидаем других игроков...", "info");
        } else {
            if (userAnswer === chromaticNumber) {
                showFeedback(`✅ Правильно! Хроматическое число: ${chromaticNumber}`, "correct");
            } else {
                showFeedback(`❌ Неправильно. Хроматическое число: ${chromaticNumber}`, "incorrect");
            }
        }
    }

    checkBtn.addEventListener('click', checkAnswer);

    if (!isMultiplayer) {
        generateGraph();
    }
});
