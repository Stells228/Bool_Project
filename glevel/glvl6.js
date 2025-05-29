document.addEventListener('DOMContentLoaded', () => {
    const matrixContainer = document.getElementById('matrixContainer');
    const checkBtn = document.getElementById('checkBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const generateBtn = document.getElementById('generateBtn');
    const verticesInput = document.getElementById('vertices');
    const userAnswerInput = document.getElementById('userAnswer');
    const feedback = document.getElementById('feedback');
    const graphContainer = document.getElementById('graph-visualization');
    graphContainer.style.height = '100%';

    let currentNodes = 0;
    let adjacencyMatrix = [];
    let currentColoring = [];

    document.getElementById('toMap')?.addEventListener('click', () => window.location.href = '../gmap.html');
    document.getElementById('toLevel5')?.addEventListener('click', () => window.location.href = 'glevel5.html');

    generateBtn.addEventListener('click', generateGraph);
    checkBtn.addEventListener('click', checkAnswer);
    tryAgainBtn.addEventListener('click', () => {
        generateGraph();
        resetInputAndButtons();
        feedback.textContent = '';
        userAnswerInput.value = '';
    });

    function generateGraph() {
        const n = parseInt(verticesInput.value);
        if (isNaN(n) || n < 3 || n > 20) {
            showFeedback('Введите корректное количество вершин (3-20)', 'error');
            return;
        }

        currentNodes = n;
        adjacencyMatrix = generateRandomUndirectedGraph(n, 0.3); // вероятность ребра 30%
        currentColoring = [];

        renderMatrix(adjacencyMatrix);
        updateGraphVisualization(adjacencyMatrix, currentColoring);
        resetInputAndButtons();
        feedback.textContent = '';
        userAnswerInput.value = '';
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

    // Цвета для визуализации, добавила цвета поярче, чтоб прям глаза рябило
    const colorPalette = [
        '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
        '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
        '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
        '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
    ];

    function updateGraphVisualization(matrix, coloring) {
        graphContainer.innerHTML = '';
        const nodes = new vis.DataSet(
            Array.from({ length: currentNodes }, (_, i) => ({
                id: i,
                label: String.fromCharCode(65 + i),
                color: coloring && coloring[i] !== undefined ? colorPalette[coloring[i] % colorPalette.length] : '#97c2fc'
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

    // Жадный алгоритм 
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

            for (let i = 0; i < n; i++) {
                available[i] = true;
            }
        }
        return result;
    }

    function checkAnswer() {
        const userAnswer = parseInt(userAnswerInput.value);
        if (isNaN(userAnswer) || userAnswer < 1) {
            showFeedback('Введите корректное число цветов', 'error');
            return;
        }

        const coloring = greedyColoring(adjacencyMatrix);
        currentColoring = coloring;
        const usedColors = new Set(coloring);
        const chromaticNumber = usedColors.size;

        updateGraphVisualization(adjacencyMatrix, coloring);

        if (userAnswer === chromaticNumber) {
            showFeedback(`✅ Правильно! Минимальное число цветов: ${chromaticNumber}`, 'correct');
        }
        else {
            showFeedback(`❌ Неправильно. Минимальное число цветов: ${chromaticNumber}`, 'incorrect');
        }
        toggleInputAndButtonsAfterCheck();
    }

    function toggleInputAndButtonsAfterCheck() {
        userAnswerInput.style.display = 'none';
        checkBtn.style.display = 'none';
        tryAgainBtn.style.display = 'inline-block';
    }

    function resetInputAndButtons() {
        userAnswerInput.style.display = 'inline-block';
        checkBtn.style.display = 'inline-block';
        tryAgainBtn.style.display = 'none';
        userAnswerInput.value = '';
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
