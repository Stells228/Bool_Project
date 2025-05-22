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
    let network;

    const transitionOverlay = document.getElementById('transitionOverlay');
    const mainMenuBtn = document.getElementById('main-menu-btn');

    if (mainMenuBtn && transitionOverlay) {
        mainMenuBtn.addEventListener('click', () => {
            document.querySelectorAll('.cloud1, .cloud2, .cloud3, .cloud4, .cloud5').forEach(el => {
                el.style.animation = 'none';
            });
            transitionOverlay.classList.add('active');
            setTimeout(() => {
                window.location.href = 'gmain.html';
            }, 600); 
        });
    } 

    // Обработчик кнопки главного меню
    mainMenuBtn.addEventListener('click', () => {
        document.querySelectorAll('.cloud1, .cloud2, .cloud3, .cloud4, .cloud5').forEach(el => {
            el.style.animation = 'none';
        });

        setTimeout(() => {
            window.location.href = 'gmain.html';
        }, 300); 
    });

    function initNetwork() {
        if (network) {
            network.destroy();
        }

        network = new vis.Network(container, { nodes, edges }, {
            nodes: { 
                shape: 'circle', 
                size: calculateNodeSize(),
                font: { 
                    color: '#fff', 
                    size: calculateFontSize(),
                    face: 'Comfortaa'
                },
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
    }

    function calculateNodeSize() {
        const width = window.innerWidth;
        if (width < 768) return 20;
        if (width < 1024) return 25;
        return 30;
    }

    function calculateFontSize() {
        const width = window.innerWidth;
        if (width < 768) return 14;
        if (width < 1024) return 16;
        return 20;
    }

    window.addEventListener('resize', function() {
        if (network) {
            network.setOptions({
                nodes: {
                    size: calculateNodeSize(),
                    font: {
                        size: calculateFontSize()
                    }
                }
            });
            network.fit();
        }
    });

    initNetwork();

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
        
        nodes.get().forEach(node => {
            adjacencyList[node.id] = [];
            colors[node.id] = -1;
        });

        edges.get().forEach(edge => {
            adjacencyList[edge.from].push(edge.to);
            adjacencyList[edge.to].push(edge.from);
        });

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

    // Эл-ты для мобильного меню
    const panelToggle = document.createElement('button');
    panelToggle.className = 'panel-toggle';
    document.body.appendChild(panelToggle);

    const panelOverlay = document.createElement('div');
    panelOverlay.className = 'panel-overlay';
    document.body.appendChild(panelOverlay);

    const panel = document.querySelector('.panel');

    // Обработчики для мобильного меню
    panelToggle.addEventListener('click', () => {
        panelToggle.classList.toggle('active');
        panel.classList.toggle('active');
        panelOverlay.classList.toggle('active');
    });

    panelOverlay.addEventListener('click', () => {
        panelToggle.classList.remove('active');
        panel.classList.remove('active');
        panelOverlay.classList.remove('active');
    });


    /**
     * Генерирует таблицу матрицы смежности
     */
    function generateMatrix() {
        const n = nodes.length;
        const matrixContainer = document.getElementById('matrixContainer');
        matrixContainer.innerHTML = '';

        // Обновляем значение в input кол-ва вершин
        document.getElementById('vertices').value = n;

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
        updateStartVertexSelect(n);
        updateMatrixFromGraph(); // Обновляем матрицу по текущему графу
    }

    /**
     * Обновляет список начальных вершин
     */
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

    /**
     * DFS для первой фазы (алгоритм Косарайю)
     */
    function dfs1(matrix, node, visited, stack) {
        visited[node] = true;
        for (let neighbor = 0; neighbor < matrix.length; neighbor++) {
            if (matrix[node][neighbor] && !visited[neighbor]) {
                dfs1(matrix, neighbor, visited, stack);
            }
        }
        stack.push(node);
    }

    /**
     * DFS для второй фазы (алгоритм Косарайю)
     */
    function dfs2(matrix, node, visited, component) {
        visited[node] = true;
        component.push(node);
        for (let neighbor = 0; neighbor < matrix.length; neighbor++) {
            if (matrix[neighbor][node] && !visited[neighbor]) {
                dfs2(matrix, neighbor, visited, component);
            }
        }
    }

    /**
     * Транспонирование матрицы
     */
    function transpose(matrix) {
        const n = matrix.length;
        const t = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                t[i][j] = matrix[j][i];
            }
        }
        return t;
    }

    /**
     * Алгоритм Косарайю для подсчёта SCC
     */
    function countSCC(matrix) {
        const n = matrix.length;
        const visited = Array(n).fill(false);
        const stack = [];

        // Фаза 1: обход по порядку завершения
        for (let i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs1(matrix, i, visited, stack);
            }
        }

        // Фаза 2: транспонируем граф
        const transposeMatrix = transpose(matrix);
        visited.fill(false);
        let sccCount = 0;

        while (stack.length > 0) {
            const node = stack.pop();
            if (!visited[node]) {
                dfs2(transposeMatrix, node, visited, []);
                sccCount++;
            }
        }

        return sccCount;
    }

    /**
     * Подсчитывает степень каждой вершины
     */
    function calculateVertexDegrees() {
        const nodeList = nodes.get();
        const degrees = {};
        
        // Инициализируем степени всех вершин нулями
        nodeList.forEach(node => {
            degrees[node.id] = 0;
        });

        // Считаем степени вершин
        edges.get().forEach(edge => {
            degrees[edge.from]++;
            degrees[edge.to]++;
        });

        // Формируем результат
        const result = nodeList.map(node => 
            `Вершина ${node.label}: степень ${degrees[node.id]}`
        ).join('\n');
        
        showResult("Степени вершин:\n" + result, 'correct');
    }

    /**
     * Проверяет, является ли граф эйлеровым или полуэйлеровым
     */
    function checkEulerian() {
        const nodeList = nodes.get();
        const degrees = {};
        let oddDegreeCount = 0;

        // Инициализируем степени всех вершин нулями
        nodeList.forEach(node => {
            degrees[node.id] = 0;
        });

        // Считаем степени вершин
        edges.get().forEach(edge => {
            degrees[edge.from]++;
            degrees[edge.to]++;
        });

        // Подсчитываем вершины с нечетной степенью
        nodeList.forEach(node => {
            if (degrees[node.id] % 2 !== 0) {
                oddDegreeCount++;
            }
        });

        // Проверяем условия эйлеровости
        if (oddDegreeCount === 0) {
            showResult("Граф является эйлеровым (содержит эйлеров цикл)", 'correct');
        } 
        else if (oddDegreeCount === 2) {
            showResult("Граф является полуэйлеровым (содержит эйлеров путь)", 'correct');
        } 
        else {
            showResult("Граф не является эйлеровым", 'info');
        }
    }

    /**
     * Проверяет, является ли граф двудольным
     */
    function checkBipartite() {
        const nodeList = nodes.get();
        const adjacencyList = {};
        const colors = {};
        let isBipartite = true;

        // Строим список смежности
        nodeList.forEach(node => {
            adjacencyList[node.id] = [];
            colors[node.id] = -1; // -1 означает непокрашенную вершину
        });

        edges.get().forEach(edge => {
            adjacencyList[edge.from].push(edge.to);
            adjacencyList[edge.to].push(edge.from);
        });

        // Проверяем двудольность с помощью BFS
        for (let i = 0; i < nodeList.length && isBipartite; i++) {
            const startNode = nodeList[i];
            if (colors[startNode.id] === -1) {
                const queue = [startNode.id];
                colors[startNode.id] = 0;

                while (queue.length > 0 && isBipartite) {
                    const nodeId = queue.shift();
                    const currentColor = colors[nodeId];

                    adjacencyList[nodeId].forEach(neighborId => {
                        if (colors[neighborId] === -1) {
                            colors[neighborId] = 1 - currentColor;
                            queue.push(neighborId);
                        } 
                        else if (colors[neighborId] === currentColor) {
                            isBipartite = false;
                        }
                    });
                }
            }
        }

        if (isBipartite) {
            // Проверяем, является ли граф полным двудольным
            const partitions = [[], []];
            nodeList.forEach(node => {
                partitions[colors[node.id]].push(node.label);
            });

            // Проверяем все возможные связи между долями
            let isComplete = true;
            for (let i = 0; i < partitions[0].length && isComplete; i++) {
                for (let j = 0; j < partitions[1].length && isComplete; j++) {
                    const from = nodeList.find(n => n.label === partitions[0][i]).id;
                    const to = nodeList.find(n => n.label === partitions[1][j]).id;
                    
                    const hasEdge = edges.get({
                        filter: e => (e.from === from && e.to === to) || (e.from === to && e.to === from)
                    }).length > 0;
                    
                    if (!hasEdge) {
                        isComplete = false;
                    }
                }
            }

            if (isComplete) {
                showResult(`Граф является полным двудольным (K${partitions[0].length},${partitions[1].length})`, 'correct');
            } 
            else {
                showResult("Граф является двудольным", 'correct');
            }
        } 
        else {
            showResult("Граф не является двудольным", 'info');
        }
    }

    /**
     * Показывает информацию о графе (степени вершин, эйлеровость, двудольность)
     */
    function showGraphInfo() {
        calculateVertexDegrees();
        checkEulerian();
        checkBipartite();
    }

    /**
     * Подсчитывает число компонент связности
     */
    function countConnectedComponents() {
        const matrix = getCurrentMatrix();
        const scc = countSCC(matrix);
        showResult(`Число сильно связных компонент (SCC): ${scc}`, 'correct');
    }

    /**
     * Получает текущую матрицу смежности из графа
     */
    function getCurrentMatrix() {
        const nodeList = nodes.get();
        const n = nodeList.length;
        const matrix = Array.from({ length: n }, () => Array(n).fill(0));

        edges.get().forEach(edge => {
            const fromIndex = nodeList.findIndex(node => node.id === edge.from);
            const toIndex = nodeList.findIndex(node => node.id === edge.to);
            if (fromIndex !== -1 && toIndex !== -1) {
                matrix[fromIndex][toIndex] = 1;
                matrix[toIndex][fromIndex] = 1; // Для неориентированного графа
            }
        });

        return matrix;
    }

    /**
     * Обновляет матрицу смежности по текущему графу
     */
    function updateMatrixFromGraph() {
        const matrix = getCurrentMatrix();
        const matrixContainer = document.getElementById('matrixContainer');
        const inputs = matrixContainer.querySelectorAll('input');
        
        if (inputs.length === 0) return;

        inputs.forEach(input => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            if (row < matrix.length && col < matrix.length) {
                input.value = matrix[row][col];
            }
        });
    }

    /**
     * Обновляет граф по текущей матрице смежности
     */
    function updateGraphFromMatrix() {
        const inputs = document.querySelectorAll('#matrixContainer input');
        if (inputs.length === 0) return;

        const n = parseInt(document.getElementById('vertices').value);
        const matrix = [];

        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
              const input = document.querySelector(`input[data-row='${i}'][data-col='${j}']`);
              let val = 0;
              if (input) {
                val = parseInt(input.value);
              }
              row.push(isNaN(val) ? 0 : Math.min(1, Math.max(0, val)));
            }
            matrix.push(row);
          }
          

        const newNodes = [];
        for (let i = 0; i < n; i++) {
            newNodes.push({
                id: i + 1,
                label: String.fromCharCode(65 + i),
                color: {
                    background: '#9b59b6',
                    border: '#8e44ad',
                    highlight: {
                        background: '#e74c3c',
                        border: '#c0392b'
                    }
                }
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

    /**
     * Алгоритм поиска в ширину (BFS)
     * param {number[][]} matrix - Матрица смежности
     * param {number} start - Стартовая вершина
     * returns {number[]} - Порядок обхода вершин
     */
    async function bfs(matrix, start) {
        const visited = Array(matrix.length).fill(false);
        const queue = [start];
        const result = [];
        
        visited[start] = true;
        await highlightNode(start + 1, '#FF5722');

        while (queue.length > 0) {
            const node = queue.shift();
            result.push(node);

            await highlightNode(node + 1, '#4CAF50');
            
            for (let neighbor = 0; neighbor < matrix.length; neighbor++) {
                if (matrix[node][neighbor] !== 0 && !visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.push(neighbor);
                    
                    await highlightEdge(node + 1, neighbor + 1, '#FFC107');
                    await highlightNode(neighbor + 1, '#9C27B0');
                }
            }
        }

        colorGraph();
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

    async function runBFS() {
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

        const order = await bfs(matrix, start);
        const labeledOrder = order.map(v => String.fromCharCode(65 + v));
        showResult(`Обход графа в ширину (BFS): ${labeledOrder.join(' → ')}`, 'correct');
    }

    function applyMatrixToGraph() {
        updateGraphFromMatrix();
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
            generateMatrix();
        }
    }

    function addEdge(from, to) {
        const existingEdge = edges.get({
            filter: item => (item.from === from && item.to === to) || (item.from === to && item.to === from)
        })[0];

        if (!existingEdge) {
            edges.add({ from, to });
            showResult(`Добавлено ребро: ${nodes.get(from).label} ↔ ${nodes.get(to).label}`, 'correct');
            updateMatrixFromGraph();
        }
    }

    function addNode() {
        const label = String.fromCharCode(64 + nextNodeId);
        nodes.add({ 
            id: nextNodeId, 
            label,
            color: {
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
        generateMatrix(); 
    }

    // Алгоритм Краскала для поиска минимального остовного дерева
    async function runKruskal() {
        const matrix = getCurrentMatrix();
        const n = matrix.length;
        
        // Собираем все рёбра, где есть вес > 0
        const allEdges = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const weight = matrix[i][j];
                if (weight > 0) {
                    allEdges.push({ 
                        u: i, 
                        v: j, 
                        weight,
                        from: i + 1, 
                        to: j + 1
                    });
                }
            }
        }
    
        // Сортируем рёбра по возрастанию веса
        allEdges.sort((a, b) => a.weight - b.weight);
    
        const parent = Array(n).fill(0).map((_, i) => i);
    
        function find(u) {
            if (parent[u] !== u) {
                parent[u] = find(parent[u]);
            }
            return parent[u];
        }
    
        function union(u, v) {
            const rootU = find(u);
            const rootV = find(v);
            if (rootU !== rootV) {
                parent[rootV] = rootU;
                return true;
            }
            return false;
        }
    
        const mstEdges = [];
        let totalWeight = 0;
    
        // Сначала сбросим все цвета
        const nodeUpdates = nodes.get().map(node => ({
            id: node.id,
            color: {
                background: '#9b59b6',
                border: '#8e44ad',
                highlight: {
                    background: '#e74c3c',
                    border: '#c0392b'
                }
            }
        }));
        nodes.update(nodeUpdates);
        
        const edgeUpdates = edges.get().map(edge => ({
            id: edge.id,
            color: '#fff',
            width: 2
        }));
        edges.update(edgeUpdates);
    
        // Визуализация процесса
        for (const edge of allEdges) {
            // Подсвечиваем текущее рассматриваемое ребро
            await highlightEdge(edge.from, edge.to, '#FF5722');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (union(edge.u, edge.v)) {
                mstEdges.push(edge);
                totalWeight += edge.weight;
                
                // Подсвечиваем ребро MST
                await highlightEdge(edge.from, edge.to, '#4CAF50');
                await highlightNode(edge.from, '#FFC107');
                await highlightNode(edge.to, '#FFC107');
                await new Promise(resolve => setTimeout(resolve, 500));
            } 
            else {
                // Возвращаем обычный цвет для ребра, не вошедшего в MST
                await highlightEdge(edge.from, edge.to, '#fff');
            }
        }
    
        // Проверяем, все ли вершины связаны
        const root = find(0);
        const isConnected = parent.every(p => find(p) === root);
    
        if (!isConnected || mstEdges.length < n - 1) {
            showResult('❌ Граф несвязный — минимальное остовное дерево построить нельзя.', 'error');
            return;
        }
    
        let text = '✅ Минимальное остовное дерево:\n';
        text += 'Рёбра (u → v): вес\n';
        for (const edge of mstEdges) {
            text += `${String.fromCharCode(65 + edge.u)} → ${String.fromCharCode(65 + edge.v)}: ${edge.weight}\n`;
        }
        text += `\nОбщий вес: ${totalWeight}`;
        showResult(text, 'correct');
    }

    // Алгоритм Дейкстры для нахождения кратчайших путей
    async function runDijkstra() {
        const matrix = getCurrentMatrix();
        const n = matrix.length;
        const start = parseInt(document.getElementById('startVertex').value);
        
        if (isNaN(start)) {
            showNotification("Выберите начальную вершину", "error");
            return;
        }

        // Сброс цветов
        const nodeUpdates = nodes.get().map(node => ({
            id: node.id,
            color: {
                background: '#9b59b6',
                border: '#8e44ad',
                highlight: {
                    background: '#e74c3c',
                    border: '#c0392b'
                }
            }
        }));
        nodes.update(nodeUpdates);
        
        const edgeUpdates = edges.get().map(edge => ({
            id: edge.id,
            color: '#fff',
            width: 2
        }));
        edges.update(edgeUpdates);

        // Подсветка стартовой вершины
        await highlightNode(start + 1, '#FF5722');
        await new Promise(resolve => setTimeout(resolve, 500));

        const dist = Array(n).fill(Infinity);
        const prev = Array(n).fill(null);
        const visited = Array(n).fill(false);

        dist[start] = 0;

        for (let count = 0; count < n - 1; count++) {
            // Находим вершину с мин расстоянием
            let u = -1;
            let minDist = Infinity;

            for (let i = 0; i < n; i++) {
                if (!visited[i] && dist[i] < minDist) {
                    minDist = dist[i];
                    u = i;
                }
            }

            if (u === -1) break; // Не достижимые вершины
            visited[u] = true;

            // Подсветка текущей вершины
            await highlightNode(u + 1, '#4CAF50');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Обновляем расстояния до соседних вершин
            for (let v = 0; v < n; v++) {
                if (!visited[v] && matrix[u][v] > 0) {
                    const newDist = dist[u] + matrix[u][v];
                    
                    // Подсветка нашего ребра
                    await highlightEdge(u + 1, v + 1, '#FFC107');
                    await new Promise(resolve => setTimeout(resolve, 300));

                    if (newDist < dist[v]) {
                        dist[v] = newDist;
                        prev[v] = u;
                        
                        // Подсветка нового кратчайшего пути
                        await highlightNode(v + 1, '#9C27B0');
                        await highlightEdge(u + 1, v + 1, '#4CAF50');
                        await new Promise(resolve => setTimeout(resolve, 300));
                    } 
                    else {
                        // Возвращаем обычный цвет ребра
                        await highlightEdge(u + 1, v + 1, '#fff');
                    }
                }
            }
        }

        // Восстановление путей и вывод результатов
        let resultText = `Кратчайшие пути из вершины ${String.fromCharCode(65 + start)}:\n\n`;
        
        for (let i = 0; i < n; i++) {
            if (i === start) continue;

            const path = reconstructPath(prev, i);
            const cost = dist[i];

            if (path.length === 0) {
                resultText += `До вершины ${String.fromCharCode(65 + i)}: недостижим\n`;
            } 
            else {
                const labeledPath = path.map(v => String.fromCharCode(65 + v)).join(' → ');
                resultText += `До вершины ${String.fromCharCode(65 + i)}: ${labeledPath} | Длина: ${cost}\n`;
            }
        }

        showResult(resultText, 'correct');
    }

    // Восстановление пути
    function reconstructPath(prev, target) {
        const path = [];
        let current = target;

        while (current !== null) {
            path.unshift(current);
            current = prev[current];
        }

        return path.length > 1 ? path : [];
    }

    // Алгоритм Флойда-Уоршелла для нахождения кратчайших путей между всеми парами вершин
    async function runFloydWarshall() {
        const matrix = getCurrentMatrix();
        const n = matrix.length;

        // Создаём копию матрицы с учетом бесконечности для отсутствующих связей
        const dist = matrix.map(row => row.slice());
        
        // Матрица расстояний
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j && dist[i][j] === 0) {
                    dist[i][j] = Infinity;
                }
            }
        }
        await visualizeMatrix(dist, "Исходная матрица расстояний");

        // Основна
        for (let k = 0; k < n; k++) {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                        
                        await visualizeUpdate(i, j, k, dist[i][j]);
                    }
                }
            }
        }

        displayResultMatrix(dist);
    }

    // Визуализация матрицы расстояний
    async function visualizeMatrix(matrix, title) {
        let resultText = `${title}:\n\n`;
        
        // Заголовок
        resultText += "     ";
        for (let j = 0; j < matrix.length; j++) {
            resultText += `${String.fromCharCode(65 + j)}`.padEnd(6);
        }
        resultText += "\n";
        
        // Строки матрицы
        for (let i = 0; i < matrix.length; i++) {
            resultText += `${String.fromCharCode(65 + i)} | `;
            for (let j = 0; j < matrix.length; j++) {
                const value = matrix[i][j] === Infinity ? "∞" : matrix[i][j];
                resultText += `${value}`.padEnd(6);
            }
            resultText += "\n";
        }
        
        showResult(resultText, 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Визуализация обновления расстояния
    async function visualizeUpdate(i, j, k, newDist) {
        // Подсветка вершин и ребер, участвующих в обновлении
        await highlightNode(i + 1, '#FF5722'); // i - красный
        await highlightNode(k + 1, '#4CAF50'); // k - зеленый
        await highlightNode(j + 1, '#2196F3'); // j - синий
        
        // Подсветка ребер (если они существуют)
        if (i !== k) {
            await highlightEdge(i + 1, k + 1, '#FFC107'); // i-k - желтый
        }
        if (k !== j) {
            await highlightEdge(k + 1, j + 1, '#FFC107'); // k-j - желтый
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Возвращаем стандартные цвета
        await highlightNode(i + 1, '#9b59b6');
        await highlightNode(k + 1, '#9b59b6');
        await highlightNode(j + 1, '#9b59b6');
        
        if (i !== k) {
            await highlightEdge(i + 1, k + 1, '#fff');
        }
        if (k !== j) {
            await highlightEdge(k + 1, j + 1, '#fff');
        }
    }

    // Отображение результирующей матрицы
    function displayResultMatrix(matrix) {
        let resultText = "Матрица кратчайших путей:\n\n";
        
        // Заголовок
        resultText += "     ";
        for (let j = 0; j < matrix.length; j++) {
            resultText += `${String.fromCharCode(65 + j)}`.padEnd(8);
        }
        resultText += "\n";
        
        // Строки матрицы
        for (let i = 0; i < matrix.length; i++) {
            resultText += `${String.fromCharCode(65 + i)} | `;
            for (let j = 0; j < matrix.length; j++) {
                const value = matrix[i][j] === Infinity ? "∞" : matrix[i][j];
                resultText += `${value}`.padEnd(8);
            }
            resultText += "\n";
        }
        
        showResult(resultText, 'correct');
    }

    // Проверка, граф ли дерево
    function isTree(matrix) {
        const n = matrix.length;
        const visited = Array(n).fill(false);
        let edgesCount = 0;
        let isTree = true;

        function dfs(u, parent) {
            visited[u] = true;
            for (let v = 0; v < n; v++) {
                if (matrix[u][v] > 0) {
                    if (!visited[v]) {
                        edgesCount++;
                        dfs(v, u);
                    }
                    else if (v !== parent) {
                        isTree = false;
                    }
                }
            }
        }

        dfs(0);

        if (!isTree) {
            return { isTree: false, reason: "Граф содержит циклы" };
        }

        if (edgesCount !== n - 1) {
            return { isTree: false, reason: "Число рёбер не равно n - 1" };
        }

        for (let i = 0; i < n; i++) {
            if (!visited[i]) {
                return { isTree: false, reason: "Граф несвязный" };
            }
        }

        return { isTree: true };
    }

    // Алгоритм построения кода Прюфера
    async function runPrufer() {
        const matrix = getCurrentMatrix();
        const n = matrix.length;
        
        // Проверка, что граф является деревом
        const resultCheck = isTree(matrix);
        if (!resultCheck.isTree) {
            showResult(`❌ Не является деревом: ${resultCheck.reason}`, 'error');
            return;
        }

        // Создаём копию матрицы и вычисляем степени вершин
        const degrees = matrix.map(row => 
            row.reduce((acc, val) => acc + (val > 0 ? 1 : 0), 0)
        );
        const code = [];

        // Начальное состояния
        await visualizeTree(matrix, degrees, "Исходное дерево");

        // Основа
        for (let step = 0; step < n - 2; step++) {
            // Находим мин листовую вершину
            let leaf = -1;
            for (let i = 0; i < n; i++) {
                if (degrees[i] === 1) {
                    leaf = i;
                    break;
                }
            }

            if (leaf === -1) break;

            // Находим соседа
            let neighbor = -1;
            for (let i = 0; i < n; i++) {
                if (matrix[leaf][i] > 0 && degrees[i] > 0) {
                    neighbor = i;
                    break;
                }
            }

            if (neighbor === -1) break;
            code.push(neighbor);

            await visualizeStep(leaf, neighbor, matrix, degrees, step + 1, code);

            degrees[leaf]--;
            degrees[neighbor]--;
        }

        showResult(`✅ Код Прюфера: [${code.join(', ')}]`, 'correct');
    }

    // Визуализация дерева
    async function visualizeTree(matrix, degrees, title) {
        // Сброс цветов
        const nodeUpdates = nodes.get().map(node => ({
            id: node.id,
            color: {
                background: '#9b59b6',
                border: '#8e44ad',
                highlight: {
                    background: '#e74c3c',
                    border: '#c0392b'
                }
            }
        }));
        nodes.update(nodeUpdates);
        
        const edgeUpdates = edges.get().map(edge => ({
            id: edge.id,
            color: '#fff',
            width: 2
        }));
        edges.update(edgeUpdates);

        // Подсветка листьев
        const leaves = [];
        for (let i = 0; i < degrees.length; i++) {
            if (degrees[i] === 1) {
                leaves.push(i + 1); // ААА +1 тк в vis.js вершины нумеруются с 1 КАКОГО-ТО ПЁСЕЛЯ
            }
        }

        for (const leaf of leaves) {
            await highlightNode(leaf, '#FFC107');
        }

        showResult(`${title}\nЛистья подсвечены желтым`, 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Визуализация шага алгоритма
    async function visualizeStep(leaf, neighbor, matrix, degrees, step, code) {
        // Подсветка текущего листа и его соседа
        await highlightNode(leaf + 1, '#FF5722'); // Лист - красный
        await highlightNode(neighbor + 1, '#4CAF50'); // Сосед - зеленый

        // Подсветка ребра между ними
        await highlightEdge(leaf + 1, neighbor + 1, '#9C27B0');
        
        let info = `Шаг ${step}:\n`;
        info += `Удаляем лист ${String.fromCharCode(65 + leaf)} (красный)\n`;
        info += `Добавляем в код Прюфера вершину ${String.fromCharCode(65 + neighbor)} (зелёный)\n`;
        info += `Текущий код: [${code.join(', ')}]`;
        
        showResult(info, 'info');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Возвращаем стандартные цвета для оставшихся вершин
        for (let i = 0; i < degrees.length; i++) {
            if (degrees[i] > 0) {
                await highlightNode(i + 1, '#9b59b6');
            }
        }
        
        // Подсветка новых листьев
        for (let i = 0; i < degrees.length; i++) {
            if (degrees[i] === 1) {
                await highlightNode(i + 1, '#FFC107');
            }
        }
    }

    // Декодирование кода Прюфера и восстановление дерева
    async function runPruferDecode() {
        const modal = document.getElementById('prufer-modal');
        const input = document.getElementById('prufer-code-input');
        const cancelBtn = document.getElementById('prufer-cancel');
        const okBtn = document.getElementById('prufer-ok');
        
        input.value = '';
        modal.style.display = 'flex';
        input.focus();
        
        // Ввод пользователя
        const codeInput = await new Promise(resolve => {
            okBtn.onclick = () => {
                modal.style.display = 'none';
                resolve(input.value.trim());
            };
            
            cancelBtn.onclick = () => {
                modal.style.display = 'none';
                resolve(null);
            };
            
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    modal.style.display = 'none';
                    resolve(input.value.trim());
                }
            };
        });
        
        if (!codeInput) return;
    
        // Парсим код Прюфера
        const prufer = codeInput.split(' ').map(num => {
            const n = parseInt(num);
            return isNaN(n) ? 0 : n; // Некорректные значения в топку на 0
        });
        
        const n = prufer.length + 2; // Кол-во вершин в дереве
    
        // Проверка корректности кода
        if (prufer.some(v => v < 0 || v >= n)) {
            showResult("❌ Код Прюфера содержит недопустимые значения (должны быть числа от 0 до " + (n-1) + ")", 'error');
            return;
        }
    
        // Считаем степени вершин
        const degree = Array(n).fill(1);
        for (let num of prufer) {
            degree[num]++;
        }
            const copyDegree = [...degree];
    
        // Находим начальные листья
        let leaves = [];
        for (let i = 0; i < n; i++) {
            if (copyDegree[i] === 1) {
                leaves.push(i);
            }
        }
        leaves.sort((a, b) => a - b);
    
        let edges = [];
        let steps = [];
    
        // Восстанавливаем рёбра по коду Прюфера
        for (let i = 0; i < prufer.length; i++) {
            const leaf = leaves.shift();  // Берём мин лист
            const node = prufer[i];
            edges.push([leaf, node]);
            copyDegree[leaf]--;
            copyDegree[node]--;
    
            // Сохраняем шаг для визуализации
            steps.push({
                leaf,
                node,
                edges: [...edges],
                degrees: [...copyDegree],
                remainingLeaves: [...leaves]
            });
    
            if (copyDegree[node] === 1) {
                leaves.push(node);
                leaves.sort((a, b) => a - b); // Поддерживаем порядок А ТО ПА ЖОПЕ ПОЛУЧИТЕ
            }
        }
    
        // Последнее ребро между оставшимися двумя листьями ААААА ОНО НАКОНЕЦ-ТО ВСТАЛО МАТЬ ВАШУ
        let lastLeaves = [];
        for (let i = 0; i < n; i++) {
            if (copyDegree[i] === 1) {
                lastLeaves.push(i);
            }
        }
    
        if (lastLeaves.length >= 2) {
            edges.push([lastLeaves[0], lastLeaves[1]]);
            steps.push({
                leaf: lastLeaves[0],
                node: lastLeaves[1],
                edges: [...edges],
                degrees: [...copyDegree],
                remainingLeaves: []
            });
        }
    
        await visualizePruferDecoding(steps, prufer);
    
        // Выводим результат
        const sortedEdges = edges.map(edge =>
            edge[0] <= edge[1] ? edge : [edge[1], edge[0]]
        ).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    
        let resultText = "✅ Восстановленное дерево:\n\n";
        resultText += "Рёбра:\n";
        sortedEdges.forEach(edge => {
            resultText += `${String.fromCharCode(65 + edge[0])} — ${String.fromCharCode(65 + edge[1])}\n`;
        });
    
        showResult(resultText, 'correct');
    }

    // Визуализация процесса декодирования
    async function visualizePruferDecoding(steps, prufer) {
        // Сначала очистим граф
        nodes.clear();
        edges.clear();
    
        const n = prufer.length + 2;
        
        // Создаем вершины
        const newNodes = [];
        for (let i = 0; i < n; i++) {
            newNodes.push({
                id: i + 1,
                label: String.fromCharCode(65 + i), // A, B, C, ...
                color: {
                    background: '#9b59b6',
                    border: '#8e44ad',
                    highlight: {
                        background: '#e74c3c',
                        border: '#c0392b'
                    }
                }
            });
        }
        nodes.add(newNodes);
    
        // Визуализируем каждый шаг
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            let stepInfo = `Шаг ${i + 1}:\n`;
            
            if (i < prufer.length) {
                stepInfo += `Код Прюфера: ${String.fromCharCode(65 + prufer[i])}\n`;
            }
            
            stepInfo += `Добавляем ребро: ${String.fromCharCode(65 + step.leaf)} — ${String.fromCharCode(65 + step.node)}`;
            showResult(stepInfo, 'info');
    
            // Подсветка текущего листа и узла
            await highlightNode(step.leaf + 1, '#FF5722'); // Лист - красный
            await highlightNode(step.node + 1, '#4CAF50'); // Узел - зеленый
            await new Promise(resolve => setTimeout(resolve, 500));
    
            // Добавляем ребро
            edges.add({
                from: step.leaf + 1,
                to: step.node + 1,
                color: '#9C27B0',
                width: 3,
                label: String(i + 1) // Номер шага
            });
    
            // Подсветка новых листьев
            for (const leaf of step.remainingLeaves) {
                await highlightNode(leaf + 1, '#FFC107');
            }
    
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    document.getElementById('add-edge').addEventListener('click', () => {
        if (!edgeFrom) {
            showNotification("Выберите первую вершину", "info");
            network.once('click', (params) => {
                if (params.nodes.length) {
                    edgeFrom = params.nodes[0];
                    showNotification(`Теперь выберите вторую вершину для ребра из ${nodes.get(edgeFrom).label}`, "info");
                    network.once('click', (params) => {
                        if (params.nodes.length && params.nodes[0] !== edgeFrom) {
                            addEdge(edgeFrom, params.nodes[0]);
                        }
                        edgeFrom = null;
                    });
                }
            });
        }
    });

    // Обработчик изменений в матрице
    document.getElementById('matrixContainer').addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT') {
            const input = e.target;
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            
            // Проверяем, чтобы значение было 0 или 1
            let val = parseInt(input.value);
            if (isNaN(val) || val < 0) {
                input.value = '0';
            } 
            else if (val > 1) {
                input.value = '1';
            }
            
            // Для неориентированного графа синхронизируем симметричную ячейку
            if (row !== col) {
                const symmetricInput = document.querySelector(`input[data-row='${col}'][data-col='${row}']`);
                if (symmetricInput) {
                    symmetricInput.value = input.value;
                }
            }
            
            updateGraphFromMatrix();
        }
    });

    document.getElementById('toggle-traversal').addEventListener('click', function() {
        this.classList.toggle('active');
        const content = document.getElementById('traversal-section');
        content.classList.toggle('show');
    });

    document.getElementById('show-info').addEventListener('click', showGraphInfo);
    document.getElementById('run-kruskal').addEventListener('click', runKruskal);
    document.getElementById('run-dijkstra').addEventListener('click', runDijkstra);
    document.getElementById('run-floyd-warshall').addEventListener('click', runFloydWarshall);
    document.getElementById('run-prufer').addEventListener('click', runPrufer);
    document.getElementById('run-prufer-decode').addEventListener('click', runPruferDecode);
    document.getElementById('count-components').addEventListener('click', countConnectedComponents);
    document.getElementById('run-dfs').addEventListener('click', runDFS);
    document.getElementById('run-bfs').addEventListener('click', runBFS);
    document.getElementById('generate-matrix').addEventListener('click', generateMatrix);
    document.getElementById('add-node').addEventListener('click', addNode);
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
    document.getElementById('toggle-other').addEventListener('click', function() {
        this.classList.toggle('active');
        const content = document.getElementById('other-section');
        content.classList.toggle('show');
    });

    generateMatrix();
});
