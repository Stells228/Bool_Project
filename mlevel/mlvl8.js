document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        matrixContainer: document.getElementById('matrixContainer'),
        checkBtn: document.getElementById('checkBtn'),
        userAnswerInput: document.getElementById('userAnswer'),
        feedback: document.getElementById('feedback'),
        graphContainer: document.getElementById('graph-visualization')
    };

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
    let adjacencyMatrix = [];
    let currentNodes = 0;
    let startVertex = 0;

    elements.checkBtn.addEventListener('click', checkAnswer);

    elements.userAnswerInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    });

    function generateMatrix() {
        // Случайное число вершин от 1 до 4
        const n = Math.floor(Math.random() * 4) + 1;
        currentNodes = n;
        // Случайная начальная вершина
        startVertex = Math.floor(Math.random() * n);

        elements.matrixContainer.innerHTML = '<div class="matrix-wrapper"></div>';
        const wrapper = elements.matrixContainer.querySelector('.matrix-wrapper');

        if (n > 4) {
            wrapper.style.overflowX = 'auto';
            wrapper.style.maxHeight = '300px';
        } else {
            wrapper.style.overflowX = 'visible';
            wrapper.style.maxHeight = 'none';
        }

        elements.feedback.textContent = '';
        elements.feedback.className = 'feedback';
        elements.userAnswerInput.value = '';
        elements.checkBtn.style.display = 'inline-block';

        // Создаем таблицу матрицы смежности
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
                input.max = '1';
                input.value = i === j ? '0' : Math.random() > 0.7 ? '1' : '0';
                input.dataset.row = i;
                input.dataset.col = j;
                input.readOnly = true;
                cell.appendChild(input);
                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        wrapper.appendChild(table);

        updateGraph();
    }

    function updateGraph() {
        elements.graphContainer.innerHTML = '';
        vertices = [];
        adjacencyMatrix = [];

        for (let i = 0; i < currentNodes; i++) {
            vertices.push(new Vertex(String.fromCharCode(65 + i)));
        }

        for (let i = 0; i < currentNodes; i++) {
            adjacencyMatrix[i] = [];
            for (let j = 0; j < currentNodes; j++) {
                const input = document.querySelector(`input[data-row='${i}'][data-col='${j}']`);
                const value = parseInt(input.value);
                adjacencyMatrix[i][j] = value;
                if (value === 1 && i !== j) {
                    vertices[i].addEdge(vertices[j]);
                }
            }
        }

        // Визуально выделяем начальную вершину цветом и пометкой
        const nodes = new vis.DataSet(
            vertices.map((v, i) => ({
                id: i,
                label: i === startVertex ? v.name : v.name,
                color: i === startVertex ? { background: '#ff6666', border: '#cc0000' } : undefined,
                font: { color: i === startVertex ? '#ffffff' : undefined }
            }))
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

        const network = new vis.Network(elements.graphContainer, data, options);

        network.once('stabilizationIterationsDone', () => {
            network.fit({ animation: { duration: 0 }, scale: 1.0 });
            setTimeout(() => {
                const canvas = elements.graphContainer.querySelector('canvas');
                if (canvas && canvas.width > elements.graphContainer.clientWidth) {
                    network.moveTo({
                        scale: elements.graphContainer.clientWidth / canvas.width * 0.9,
                        animation: { duration: 0 }
                    });
                }
            }, 50);
        });
    }

    function calculateBFS(matrix, start) {
        const visited = Array(matrix.length).fill(false);
        const result = [];
        const queue = [];

        queue.push(start);
        visited[start] = true;

        while (queue.length > 0) {
            const node = queue.shift();
            result.push(node);

            const neighbors = [];
            for (let i = 0; i < matrix.length; i++) {
                if (matrix[node][i] === 1 && !visited[i]) {
                    neighbors.push(i);
                    visited[i] = true;
                }
            }

            neighbors.sort((a, b) => a - b);
            queue.push(...neighbors);
        }

        return result;
    }

    function checkAnswer() {
        if (!elements.matrixContainer.querySelector('table')) {
            showFeedback("Сначала создайте матрицу", "error");
            return;
        }

        const userAnswer = elements.userAnswerInput.value.trim();
        if (!userAnswer) {
            showFeedback("Введите порядок обхода", "error");
            return;
        }

        if (!/^[A-Z\s]+$/.test(userAnswer)) {
            showFeedback("Вводите только заглавные английские буквы (A-Z), разделённые пробелами", "error");
            return;
        }

        const userOrderLetters = userAnswer.split(/\s+/).filter(x => x);
        const correctBFS = calculateBFS(adjacencyMatrix, startVertex);
        const reachableCount = correctBFS.length;

        if (userOrderLetters.length !== reachableCount) {
            showFeedback(`Введите обход для ${reachableCount} достижимых вершин`, "error");
            return;
        }

        const validLetters = new Set();
        for (let i = 0; i < reachableCount; i++) {
            validLetters.add(String.fromCharCode(65 + correctBFS[i]));
        }

        const usedLetters = new Set();
        for (const letter of userOrderLetters) {
            if (!validLetters.has(letter)) {
                showFeedback(`Вершина "${letter}" недостижима из начальной`, "error");
                return;
            }
            if (usedLetters.has(letter)) {
                showFeedback(`Вершина "${letter}" повторяется`, "error");
                return;
            }
            usedLetters.add(letter);
        }

        const userOrder = userOrderLetters.map(l => l.charCodeAt(0) - 65);

        if (JSON.stringify(userOrder) === JSON.stringify(correctBFS)) {
            showFeedback("✅ Правильно! Порядок обхода вершин верный", "correct");
        } else {
            const correctOrderStr = correctBFS.map(i => String.fromCharCode(65 + i)).join(' ');
            showFeedback(`❌ Неправильно. Правильный порядок: ${correctOrderStr}`, "incorrect");
        }

        elements.checkBtn.style.display = 'none';
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type} show`;
        setTimeout(() => {
            elements.feedback.className = `feedback ${type}`;
        }, 2000);
    }

    // Генерируем граф при загрузке страницы
    generateMatrix();
});
