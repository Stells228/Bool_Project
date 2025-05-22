document.addEventListener('DOMContentLoaded', () => {
    const matrixContainer = document.getElementById('matrixContainer');
    const checkBtn = document.getElementById('checkBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const generateBtn = document.getElementById('generateBtn');
    const toMap = document.getElementById('toMap');
    const toLevel3 = document.getElementById('toLevel3');
    const toLevel1 = document.getElementById('toLevel1');
    const verticesInput = document.getElementById('vertices');
    const userAnswerInput = document.getElementById('userAnswer');
    const startVertexSelect = document.getElementById('startVertex');
    const feedback = document.getElementById('feedback');
    const graphContainer = document.getElementById('graph-visualization');
    graphContainer.style.height = '100%';

    toMap?.addEventListener('click', () => window.location.href = '../gmap.html');
    toLevel1?.addEventListener('click', () => window.location.href = 'glevel1.html');
    toLevel3?.addEventListener('click', () => window.location.href = 'glevel3.html');

    generateBtn.addEventListener('click', generateMatrix);
    checkBtn.addEventListener('click', checkAnswer);
    tryAgainBtn.addEventListener('click', resetTask);

    userAnswerInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    });

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

    function generateMatrix() {
        const n = parseInt(verticesInput.value);
        if (isNaN(n) || n < 1 || n > 20) {
            showFeedback("Введите корректное количество вершин (1-20)", "error");
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

        updateStartVertexSelect(n);

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
                input.addEventListener('change', updateGraph);
                cell.appendChild(input);
                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        wrapper.appendChild(table);
        updateGraph();
    }

    function updateGraph() {
        graphContainer.innerHTML = '';
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
        
        const inputs = matrixContainer.querySelectorAll('input');
        inputs.forEach(input => {
            const from = parseInt(input.dataset.row);
            const to = parseInt(input.dataset.col);
            const value = parseInt(input.value);
            if (value === 1 && from !== to) {
                vertices[from].addEdge(vertices[to]);
            }
        });
    
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
    
        const network = new vis.Network(graphContainer, data, options);
    
        network.once('stabilizationIterationsDone', () => {
            network.fit({ animation: { duration: 0 }, scale: 1.0 });
            setTimeout(() => {
                const canvas = graphContainer.querySelector('canvas');
                if (canvas && canvas.width > graphContainer.clientWidth) {
                    network.moveTo({
                        scale: graphContainer.clientWidth / canvas.width * 0.9,
                        animation: { duration: 0 }
                    });
                }
            }, 50);
        });
    }

    function updateStartVertexSelect(n) {
        startVertexSelect.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = String.fromCharCode(65 + i);
            startVertexSelect.appendChild(option);
        }
    }

    function checkAnswer() {
        if (!matrixContainer.querySelector('table')) {
            showFeedback("Сначала создайте матрицу", "error");
            return;
        }
    
        const n = parseInt(verticesInput.value);
        if (isNaN(n) || n < 1 || n > 20) {
            showFeedback("Сначала создайте матрицу", "error");
            return;
        }
    
        const userAnswer = userAnswerInput.value.trim();
        if (!userAnswer) {
            showFeedback("Введите порядок обхода", "error");
            return;
        }
    
        if (!/^[A-Z\s]+$/.test(userAnswer)) {
            showFeedback("Вводите только заглавные английские буквы (A-Z), разделённые пробелами", "error");
            return;
        }
    
        const userOrderLetters = userAnswer.split(/\s+/).filter(x => x);
        const startVertex = parseInt(startVertexSelect.value);
        const correctBFS = calculateBFS(adjacencyMatrix, startVertex);
    
        // Проверяем только достижимые вершины
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
        } 
        else {
            const correctOrderStr = correctBFS.map(i => String.fromCharCode(65 + i)).join(' ');
            showFeedback(`❌ Неправильно. Правильный порядок: ${correctOrderStr}`, "incorrect");
        }
    
        checkBtn.style.display = 'none';
        tryAgainBtn.style.display = 'inline-block';
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
            
            // Получаем соседей в порядке возрастания (A, B, C, ...)
            const neighbors = [];
            for (let i = 0; i < matrix.length; i++) {
                if (matrix[node][i] === 1 && !visited[i]) {
                    neighbors.push(i);
                    visited[i] = true;
                }
            }
            
            // Сортируем соседей по возрастанию (A, B, C, ...)
            neighbors.sort((a, b) => a - b);
            
            // Добавляем соседей в очередь
            queue.push(...neighbors);
        }
        
        return result;
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
        }, 4000);
    }
    generateMatrix();
});
