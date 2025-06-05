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
    let isMultiplayer = false;
    let socket = null;
    let roomCode = '';
    let hasAnswered = false;
    let correctAnswer = '';

    const params = new URLSearchParams(window.location.search);
    isMultiplayer = params.get('mode') === 'multiplayer';
    roomCode = params.get('room');

    if (isMultiplayer) {
        socket = io('http://localhost:3000');

        const task = JSON.parse(localStorage.getItem('currentTask'));
        if (task) {
            adjacencyMatrix = task.matrix;
            startVertex = task.start;
            currentNodes = adjacencyMatrix.length;
            correctAnswer = task.correctAnswer;
            renderMatrix(adjacencyMatrix);
            updateGraph();
        }

        elements.checkBtn.textContent = 'Готов';

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
        generateMatrix();
    }

    elements.checkBtn.addEventListener('click', () => {
        if (hasAnswered) return;

        if (elements.checkBtn) {
            elements.checkBtn.addEventListener('click', checkAnswer);
        }

        const userAnswer = elements.userAnswerInput.value.trim().toUpperCase();
        if (!userAnswer || !/^[A-Z\s]+$/.test(userAnswer)) {
            showFeedback('Введите корректный порядок обхода (заглавные буквы через пробел)', 'error');
            return;
        }

        const userOrder = userAnswer.split(/\s+/).filter(Boolean);

        if (isMultiplayer) {
            hasAnswered = true;
            elements.checkBtn.disabled = true;
            elements.checkBtn.style.opacity = '0.5';
            elements.checkBtn.style.cursor = 'not-allowed';

            socket.emit('playerAnswer', {
                room: roomCode,
                answer: userOrder.join(' '),
                timestamp: Date.now(),
                correctAnswer: correctAnswer
            });

            showFeedback('Ответ отправлен! Ожидаем других игроков...', 'info');
        } 
        else {
            const dfsOrder = calculateDFS(adjacencyMatrix, startVertex);
            const expected = dfsOrder.map(i => String.fromCharCode(65 + i));
            if (JSON.stringify(expected) === JSON.stringify(userOrder)) {
                showFeedback('✅ Правильно!', 'correct');
            } 
            else {
                showFeedback(`❌ Неправильно. Правильный порядок: ${expected.join(' → ')}`, 'incorrect');
            }

            elements.checkBtn.style.display = 'none';
        }
    });

    elements.userAnswerInput.addEventListener('input', function () {
        this.value = this.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    });

    function renderMatrix(matrix) {
        elements.matrixContainer.innerHTML = '<div class="matrix-wrapper"></div>';
        const wrapper = elements.matrixContainer.querySelector('.matrix-wrapper');

        const table = document.createElement('table');
        const header = document.createElement('tr');
        header.appendChild(document.createElement('th'));

        const n = matrix.length;
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
                input.value = matrix[i][j];
                input.readOnly = true;
                cell.appendChild(input);
                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        wrapper.appendChild(table);
    }

    function updateGraph() {
        elements.graphContainer.innerHTML = '';
        vertices = [];
        const n = adjacencyMatrix.length;

        for (let i = 0; i < n; i++) {
            vertices.push(new Vertex(String.fromCharCode(65 + i)));
        }

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (adjacencyMatrix[i][j] === 1 && i !== j) {
                    vertices[i].addEdge(vertices[j]);
                }
            }
        }

        const nodes = new vis.DataSet(vertices.map((v, i) => ({
            id: i,
            label: v.name,
            color: i === startVertex ? { background: '#ff6666', border: '#cc0000' } : undefined,
            font: { color: i === startVertex ? '#ffffff' : undefined }
        })));

        const edges = new vis.DataSet([]);
        vertices.forEach((vertex, i) => {
            vertex.adjacent.forEach(adj => {
                const j = vertices.indexOf(adj);
                edges.add({ from: i, to: j, arrows: 'to', width: 2 });
            });
        });

        const data = { nodes, edges };
        const options = {
            physics: false,
            interaction: { dragNodes: false, dragView: false, zoomView: false, selectable: false },
            nodes: { font: { size: 16 } },
            edges: { smooth: false, arrows: { to: { enabled: true, scaleFactor: 0.5 } } },
            layout: { improvedLayout: true, randomSeed: 1 },
            configure: false
        };

        const network = new vis.Network(elements.graphContainer, data, options);
        network.once('stabilizationIterationsDone', () => network.fit({ animation: { duration: 0 } }));
    }

    function calculateDFS(matrix, start) {
        const visited = Array(matrix.length).fill(false);
        const result = [];

        function traverse(node) {
            visited[node] = true;
            result.push(node);
            const neighbors = [];
            for (let i = 0; i < matrix.length; i++) {
                if (matrix[node][i] === 1 && !visited[i]) {
                    neighbors.push(i);
                }
            }
            neighbors.sort((a, b) => a - b);
            for (const neighbor of neighbors) {
                if (!visited[neighbor]) traverse(neighbor);
            }
        }

        traverse(start);
        return result;
    }

    function generateMatrix() {
        const n = Math.floor(Math.random() * 4) + 2;
        currentNodes = n;
        adjacencyMatrix = Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) =>
                i === j ? 0 : Math.random() > 0.7 ? 1 : 0
            )
        );
        startVertex = Math.floor(Math.random() * n);
        renderMatrix(adjacencyMatrix);
        updateGraph();
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type} show`;
        setTimeout(() => {
            elements.feedback.className = `feedback ${type}`;
        }, 2000);
    }
});
