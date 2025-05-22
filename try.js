document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('graph-container');
    let nodes = new vis.DataSet([
        { id: 1, label: "A", color: { background: '#9b59b6', border: '#8e44ad', highlight: { background: '#e74c3c', border: '#c0392b' } } },
        { id: 2, label: "B", color: { background: '#9b59b6', border: '#8e44ad', highlight: { background: '#e74c3c', border: '#c0392b' } } }
    ]);
    let edges = new vis.DataSet([]);
    let nextNodeId = 3;
    let edgeFrom = null;
    const colorPalette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292', '#7986CB', '#9575CD'];

    const notification = document.getElementById('graph-notification');
    const resultMessage = document.getElementById('resultMessage');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    let confirmResolve;

    const network = new vis.Network(container, { nodes, edges }, {
        nodes: { 
            shape: 'circle', 
            size: 30,
            font: { color: '#fff', size: 20 },
            color: {
                background: '#9b59b6',
                border: '#8e44ad',
                highlight: {
                    background: '#e74c3c',
                    border: '#c0392b'
                }
            }
        },
        edges: { 
            color: '#fff', 
            width: 2,
            smooth: true
        },
        physics: {
            enabled: true,
            stabilization: false
        }
    });

    function showNotification(message, type = 'info', duration = 8000) {
        notification.textContent = message;
        notification.className = '';
        notification.classList.add('feedback', type);
        notification.style.display = 'block';
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, duration);
    }

    function showResult(message, type = 'info') {
        const resultDiv = document.createElement('div');
        resultDiv.className = `feedback ${type}`;
        resultDiv.textContent = message;
        resultMessage.appendChild(resultDiv);
        resultMessage.scrollTop = resultMessage.scrollHeight;
    }

    function clearResults() {
        resultMessage.innerHTML = '';
    }

    function showConfirm(message) {
        confirmMessage.textContent = message;
        confirmModal.style.display = 'flex';
        return new Promise(resolve => {
            confirmResolve = resolve;
        });
    }

    function colorGraph() {
        const adjacencyList = {};
        const colors = {};
        
        // Инициализация списка смежности
        nodes.get().forEach(node => {
            adjacencyList[node.id] = [];
            colors[node.id] = -1;
        });

        // Заполнение списка смежности
        edges.get().forEach(edge => {
            adjacencyList[edge.from].push(edge.to);
            adjacencyList[edge.to].push(edge.from);
        });

        // Раскраска вершин
        nodes.get().forEach(node => {
            const usedColors = new Set();
            adjacencyList[node.id].forEach(neighborId => {
                if (colors[neighborId] !== -1) {
                    usedColors.add(colors[neighborId]);
                }
            });

            let color = 0;
            while (usedColors.has(color)) color++;
            colors[node.id] = color;
        });

        // Обновление цветов на графе
        const updates = nodes.get().map(node => ({
            id: node.id,
            color: {
                background: colorPalette[colors[node.id] % colorPalette.length],
                border: '#8e44ad',
                highlight: {
                    background: colorPalette[(colors[node.id] + 2) % colorPalette.length],
                    border: '#c0392b'
                }
            }
        }));
        nodes.update(updates);
        
        const colorInfo = nodes.get().map(node => 
            `Вершина ${node.label}: цвет ${colors[node.id] + 1}`
        ).join('\n');
        showResult("Граф раскрашен!\n" + colorInfo, 'correct');
    }

    function generateMatrix() {
        const n = Math.min(20, parseInt(document.getElementById('vertices').value));
        if (isNaN(n) || n < 1) {
            showNotification("Введите корректное количество вершин (1-20)", "error");
            return;
        }

        const matrixContainer = document.getElementById('matrixContainer');
        matrixContainer.innerHTML = '';

        // Создание матрицы
        const matrixTable = document.createElement('table');
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th'));
        
        for (let j = 0; j < n; j++) {
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + j);
            headerRow.appendChild(th);
        }
        matrixTable.appendChild(headerRow);

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
                input.value = i === j ? '0' : '0';
                input.dataset.row = i;
                input.dataset.col = j;
                input.title = `Связь ${String.fromCharCode(65 + i)} → ${String.fromCharCode(65 + j)}`;
                cell.appendChild(input);
                row.appendChild(cell);
            }
            matrixTable.appendChild(row);
        }
        matrixContainer.appendChild(matrixTable);
        // Обновление выпадающего списка начальной вершины
        updateStartVertexSelect(n);
    }

    function updateStartVertexSelect(n) {
        const select = document.getElementById('startVertex');
        select.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = String.fromCharCode(65 + i);
            select.appendChild(option);
        }
    }

    async function dfs(matrix, start) {
        const visited = Array(matrix.length).fill(false);
        const result = [];

        await highlightNode(start + 1, '#FF5722');

        async function traverse(node) {
            visited[node] = true;
            result.push(node);

            for (let neighbor = 0; neighbor < matrix.length; neighbor++) {
                if (matrix[node][neighbor] !== 0 && !visited[neighbor]) {
                    await highlightEdge(node + 1, neighbor + 1, '#4CAF50');
                    await highlightNode(neighbor + 1, '#FFC107');
                    await traverse(neighbor);
                    await highlightNode(neighbor + 1, colorPalette[(result.indexOf(neighbor)) % colorPalette.length]);
                }
            }
        }

        await traverse(start);
        return result;
    }

    async function highlightNode(nodeId, color) {
        nodes.update({
            id: nodeId,
            color: {
                background: color,
                border: '#8e44ad',
                highlight: {
                    background: color,
                    border: '#c0392b'
                }
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async function highlightEdge(from, to, color) {
        const edge = edges.get({
            filter: item => (item.from === from && item.to === to) || (item.from === to && item.to === from)
        })[0];

        if (edge) {
            edges.update({
                id: edge.id,
                color: color,
                width: 3
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            edges.update({
                id: edge.id,
                color: '#fff',
                width: 2
            });
        }
    }

    async function runDFS() {
        const n = parseInt(document.getElementById('vertices').value);
        const matrix = [];

        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                const input = document.querySelector(`input[data-row='${i}'][data-col='${j}']`);
                let val = parseInt(input.value);
                row.push(isNaN(val) ? 0 : Math.min(1, Math.max(0, val)));
            }
            matrix.push(row);
        }

        const start = parseInt(document.getElementById('startVertex').value);
        if (isNaN(start)) {
            showNotification("Выберите начальную вершину", "error");
            return;
        }

        const order = await dfs(matrix, start);
        const labeledOrder = order.map(v => String.fromCharCode(65 + v));
        showResult(`Обход графа в глубину (DFS): ${labeledOrder.join(' → ')}`, 'correct');
    }

    function applyMatrixToGraph() {
        const n = parseInt(document.getElementById('vertices').value);
        const matrix = [];

        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                const input = document.querySelector(`input[data-row='${i}'][data-col='${j}']`);
                let val = parseInt(input.value);
                row.push(isNaN(val) ? 0 : Math.min(1, Math.max(0, val)));
            }
            matrix.push(row);
        }

        const newNodes = [];
        for (let i = 0; i < n; i++) {
            newNodes.push({
                id: i + 1,
                label: String.fromCharCode(65 + i)
            });
        }

        const newEdges = [];
        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                if (matrix[i][j] === 1) {
                    newEdges.push({
                        from: i + 1,
                        to: j + 1
                    });
                }
            }
        }

        nodes.clear();
        nodes.add(newNodes);
        edges.clear();
        edges.add(newEdges);
        nextNodeId = n + 1;

        showResult("Граф успешно обновлен по матрице смежности", 'correct');
    }

    async function resetGraph() {
        const confirmed = await showConfirm("Вы действительно хотите сбросить граф? Все данные будут удалены.");
        if (confirmed) {
            nodes.clear();
            edges.clear();
            nodes.add([
                { id: 1, label: "A", color: { background: '#9b59b6', border: '#8e44ad', highlight: { background: '#e74c3c', border: '#c0392b' } } },
                { id: 2, label: "B", color: { background: '#9b59b6', border: '#8e44ad', highlight: { background: '#e74c3c', border: '#c0392b' } } }
            ]);
            edges.add([]);
            nextNodeId = 3;
            showResult("Граф сброшен к начальному состоянию", 'info');
        }
    }

    document.getElementById('add-node').addEventListener('click', () => {
        const label = String.fromCharCode(64 + nextNodeId);
        nodes.add({ 
            id: nextNodeId, 
            label,
            color: {  // Стандартный цвет для новых узлов
                background: '#9b59b6',
                border: '#8e44ad',
                highlight: {
                    background: '#e74c3c',
                    border: '#c0392b'
                }
            }
        });
        nextNodeId++;
        showResult(`Добавлена вершина: ${label}`, 'correct');
    });

    document.getElementById('add-edge').addEventListener('click', () => {
        if (!edgeFrom) {
            showNotification("Выберите первую вершину", "info");
            network.once('click', (params) => {
                if (params.nodes.length) {
                    edgeFrom = params.nodes[0];
                    showNotification(`Теперь выберите вторую вершину для ребра из ${nodes.get(edgeFrom).label}`, "info");
                    network.once('click', (params) => {
                        if (params.nodes.length && params.nodes[0] !== edgeFrom) {
                            edges.add({ from: edgeFrom, to: params.nodes[0] });
                            showResult(`Добавлено ребро: ${nodes.get(edgeFrom).label} ↔ ${nodes.get(params.nodes[0]).label}`, 'correct');
                        }
                        edgeFrom = null;
                    });
                }
            });
        }
    });

    document.getElementById('toggle-dfs').addEventListener('click', function() {
        this.classList.toggle('active');
        document.getElementById('dfs-section').classList.toggle('show');
    });

    document.getElementById('run-dfs').addEventListener('click', function() {
        const vertices = parseInt(document.getElementById('vertices').value);
        
        if (isNaN(vertices)) {
            showNotification("Укажите количество вершин", "error");
            return;
        }
        runDFS();
    });

    document.getElementById('generate-matrix').addEventListener('click', generateMatrix);
    document.getElementById('apply-matrix').addEventListener('click', applyMatrixToGraph);
    document.getElementById('reset-graph').addEventListener('click', resetGraph);
    document.getElementById('color-graph').addEventListener('click', colorGraph);
    document.getElementById('clear-history').addEventListener('click', clearResults);
    document.getElementById('confirm-ok').addEventListener('click', () => {
        confirmModal.style.display = 'none';
        if (confirmResolve) confirmResolve(true);
    });
    document.getElementById('confirm-cancel').addEventListener('click', () => {
        confirmModal.style.display = 'none';
        if (confirmResolve) confirmResolve(false);
    });
    document.getElementById('vertices').addEventListener('change', function() {
        if (this.value > 20) {
            this.value = 20;
            showNotification("Максимальное количество вершин - 20", "error");
        }
    });

    generateMatrix();
});