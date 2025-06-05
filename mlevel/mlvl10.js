document.addEventListener('DOMContentLoaded', () => {
    const matrixContainer = document.getElementById('matrixContainer');
    const checkBtn = document.getElementById('checkBtn');
    const userAnswerInput = document.getElementById('userAnswer');
    const feedback = document.getElementById('feedback');
    const graphContainer = document.getElementById('graph-visualization');
    graphContainer.style.height = '100%';

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
    let correctFlow = 0;
    let isMultiplayer = false;
    let socket = null;
    let roomCode = '';
    let hasAnswered = false;

    const params = new URLSearchParams(window.location.search);
    isMultiplayer = params.get('mode') === 'multiplayer';
    roomCode = params.get('room');

    if (isMultiplayer) {
        socket = io('https://lichinkis.ru/');
        const task = JSON.parse(localStorage.getItem('currentTask'));
        if (task) {
            capacityMatrix = task.matrix;
            correctFlow = task.correctAnswer;
            currentNodes = capacityMatrix.length;
            renderMatrix(capacityMatrix);
            updateGraph();
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
        generateMatrix();
    }

    function generateMatrix() {
        currentNodes = Math.floor(Math.random() * 3) + 2;
        capacityMatrix = Array.from({ length: currentNodes }, (_, i) =>
            Array.from({ length: currentNodes }, (_, j) =>
                i === j ? 0 : (Math.random() < 0.3 ? Math.floor(Math.random() * 10) + 1 : 0)
            )
        );
        renderMatrix(capacityMatrix);
        updateGraph();
    }

    function renderMatrix(matrix) {
        matrixContainer.innerHTML = '<div class="matrix-wrapper"></div>';
        const wrapper = matrixContainer.querySelector('.matrix-wrapper');

        const table = document.createElement('table');
        const header = document.createElement('tr');
        header.appendChild(document.createElement('th'));

        for (let j = 0; j < matrix.length; j++) {
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + j);
            header.appendChild(th);
        }
        table.appendChild(header);

        for (let i = 0; i < matrix.length; i++) {
            const row = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + i);
            row.appendChild(th);

            for (let j = 0; j < matrix.length; j++) {
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

    function updateGraph() {
        graphContainer.innerHTML = '';
        vertices = [];

        for (let i = 0; i < currentNodes; i++) {
            vertices.push(new Vertex(String.fromCharCode(65 + i)));
        }

        for (let i = 0; i < currentNodes; i++) {
            for (let j = 0; j < currentNodes; j++) {
                const val = capacityMatrix[i][j];
                if (val > 0 && i !== j) {
                    vertices[i].addEdge(vertices[j]);
                }
            }
        }

        const nodes = new vis.DataSet(
            vertices.map((v, i) => ({
                id: i,
                label: v.name,
                color: i === 0 ? '#7BE141' : (i === currentNodes - 1 ? '#FF6C6C' : undefined)
            }))
        );

        const edges = new vis.DataSet([]);
        vertices.forEach((vertex, i) => {
            vertex.adjacent.forEach(adj => {
                const j = vertices.indexOf(adj);
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
            physics: false,
            interaction: { dragNodes: false, dragView: false, zoomView: false, selectable: false },
            nodes: { font: { size: 16 } },
            edges: { smooth: false },
            layout: { improvedLayout: true, randomSeed: 1 },
            configure: false
        };

        new vis.Network(graphContainer, data, options);
    }

    function checkAnswer() {
        if (hasAnswered) return;

        const userAnswer = parseInt(userAnswerInput.value);
        if (isNaN(userAnswer) || userAnswer < 0) {
            showFeedback("Введите корректное значение максимального потока", "error");
            return;
        }

        if (isMultiplayer) {
            hasAnswered = true;
            checkBtn.disabled = true;
            checkBtn.style.opacity = '0.5';
            checkBtn.style.cursor = 'not-allowed';

            socket.emit('playerAnswer', {
                room: roomCode,
                answer: userAnswer,
                timestamp: Date.now(),
                correctAnswer: correctFlow
            });

            showFeedback("Ответ отправлен! Ожидаем других игроков...", "info");
        } 
        else {
            const flow = fordFulkerson(capacityMatrix, 0, currentNodes - 1);
            if (userAnswer === flow) {
                showFeedback(`✅ Правильно! Максимальный поток: ${flow}`, "correct");
            } else {
                showFeedback(`❌ Неправильно. Максимальный поток: ${flow}`, "incorrect");
            }
        }
    }

    function fordFulkerson(graph, source, sink) {
        const residual = graph.map(row => row.slice());
        const parent = Array(graph.length).fill(-1);
        let maxFlow = 0;

        function bfs() {
            const visited = Array(graph.length).fill(false);
            const queue = [source];
            visited[source] = true;
            parent[source] = -1;

            while (queue.length > 0) {
                const u = queue.shift();
                for (let v = 0; v < graph.length; v++) {
                    if (!visited[v] && residual[u][v] > 0) {
                        queue.push(v);
                        parent[v] = u;
                        visited[v] = true;
                        if (v === sink) return true;
                    }
                }
            }
            return false;
        }

        while (bfs()) {
            let pathFlow = Infinity;
            for (let v = sink; v !== source; v = parent[v]) {
                const u = parent[v];
                pathFlow = Math.min(pathFlow, residual[u][v]);
            }

            for (let v = sink; v !== source; v = parent[v]) {
                const u = parent[v];
                residual[u][v] -= pathFlow;
                residual[v][u] += pathFlow;
            }

            maxFlow += pathFlow;
        }

        return maxFlow;
    }

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `feedback ${type} show`;
        setTimeout(() => {
            feedback.className = `feedback ${type}`;
        }, 2000);
    }

    checkBtn.addEventListener('click', checkAnswer);

    if (!isMultiplayer) {
        generateMatrix();
    }
});
