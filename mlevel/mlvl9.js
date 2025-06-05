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
    let adjacencyMatrix = [];
    let currentNodes = 0;
    let correctSCC = 0;
  
    // Случайное количество вершин от 1 до 4
    currentNodes = Math.floor(Math.random() * 4) + 1;
  
    function generateMatrix() {
      const n = currentNodes;
  
      matrixContainer.innerHTML = '<div class="matrix-wrapper"></div>';
      const wrapper = matrixContainer.querySelector('.matrix-wrapper');
  
      if (n > 4) {
        wrapper.style.overflowX = 'auto';
        wrapper.style.maxHeight = '300px';
      } else {
        wrapper.style.overflowX = 'visible';
        wrapper.style.maxHeight = 'none';
      }
  
      feedback.textContent = '';
      feedback.className = 'feedback';
      userAnswerInput.value = '';
      checkBtn.style.display = 'inline-block';
  
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
          input.readOnly = true; // запрет редактирования
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
      if (!matrixContainer.querySelector('table')) {
        showFeedback("Сначала создайте матрицу", "error");
        return;
      }
  
      const userAnswer = userAnswerInput.value.trim();
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
    }
  
    function showFeedback(message, type) {
      feedback.textContent = message;
      feedback.className = `feedback ${type} show`;
      setTimeout(() => {
        feedback.className = `feedback ${type}`;
      }, 2000);
    }
  
    checkBtn.addEventListener('click', checkAnswer);
  
    // Генерируем матрицу при загрузке с рандомным количеством вершин
    generateMatrix();
  });
  