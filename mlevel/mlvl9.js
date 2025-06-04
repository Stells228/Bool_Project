document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        matrixContainer: document.getElementById('matrixContainer'),
        checkBtn: document.getElementById('checkBtn'),
        tryAgainBtn: document.getElementById('tryAgainBtn'),
        generateBtn: document.getElementById('generateBtn'),
        verticesInput: document.getElementById('vertices'),
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
    let correctSCC = 0;

    elements.generateBtn.addEventListener('click', generateMatrix);
    elements.checkBtn.addEventListener('click', checkAnswer);
    elements.tryAgainBtn.addEventListener('click', resetTask);

    elements.userAnswerInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    });

    function generateMatrix() {
        const n = parseInt(elements.verticesInput.value);
        if (isNaN(n) || n < 1 || n > 20) {
            showFeedback("Введите корректное количество вершин (1-20)", "error");
            return;
        }

        currentNodes = n;
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
        elements.tryAgainBtn.style.display = 'none';

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

        const inputs = elements.matrixContainer.querySelectorAll('input');
        inputs.forEach(input => {
            input.readOnly = true;
        });

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

    function calculateSCC(matrix) {
        const visited = new Array(matrix.length).fill(false);
        const order = [];
        const components = [];
        
        function dfs1(v) {
            visited[v] = true;
            for (let i = 0; i < matrix.length; i++) {
                if (matrix[v][i] && !visited[i]) {
                    dfs1(i);
                }
            }
            order.push(v);
        }
        
        function dfs2(v, component) {
            visited[v] = true;
            component.push(v);
            for (let i = 0; i < matrix.length; i++) {
                if (matrix[i][v] && !visited[i]) {
                    dfs2(i, component);
                }
            }
        }
        
        for (let i = 0; i < matrix.length; i++) {
            if (!visited[i]) {
                dfs1(i);
            }
        }
        
        visited.fill(false);
        order.reverse();
        
        for (const v of order) {
            if (!visited[v]) {
                const component = [];
                dfs2(v, component);
                components.push(component);
            }
        }
        
        return components;
    }

    function checkAnswer() {
        if (!elements.matrixContainer.querySelector('table')) {
            showFeedback("Сначала создайте матрицу", "error");
            return;
        }

        const n = parseInt(elements.verticesInput.value);
        if (isNaN(n) || n < 1 || n > 20) {
            showFeedback("Сначала создайте матрицу", "error");
            return;
        }

        const userAnswer = elements.userAnswerInput.value.trim();
        if (!userAnswer) {
            showFeedback("Введите количество компонент сильной связности", "error");
            return;
        }

        if (!/^\d+$/.test(userAnswer)) {
            showFeedback("Введите целое число", "error");
            return;
        }

        const userSCC = parseInt(userAnswer);
        const components = calculateSCC(adjacencyMatrix);
        correctSCC = components.length;

        if (userSCC === correctSCC) {
            showFeedback("✅ Правильно! Количество компонент сильной связности верное", "correct");
        } else {
            showFeedback(`❌ Неправильно. Правильное количество компонент: ${correctSCC}`, "incorrect");
        }

        elements.checkBtn.style.display = 'none';
        elements.tryAgainBtn.style.display = 'inline-block';
    }

    function resetTask() {
        elements.userAnswerInput.value = '';
        elements.feedback.textContent = '';
        elements.feedback.className = 'feedback';
        elements.checkBtn.style.display = 'inline-block';
        elements.tryAgainBtn.style.display = 'none';
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type} show`;
        setTimeout(() => {
            elements.feedback.className = `feedback ${type}`;
        }, 2000);
    }

    generateMatrix();
});