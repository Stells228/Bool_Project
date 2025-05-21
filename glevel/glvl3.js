document.addEventListener('DOMContentLoaded', () => {
    const matrixContainer = document.getElementById('matrixContainer');
    const checkBtn = document.getElementById('checkBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const verticesInput = document.getElementById('vertices');
    const userAnswerInput = document.getElementById('userAnswer');
    const feedback = document.getElementById('feedback');
    const graphContainer = document.getElementById('graph-visualization');
    graphContainer.style.height = '100%';
  
    let correctSCC = 0;
    let currentNodes = 0;

    const container = document.getElementById('graph-visualization');
    if (container) container.style.height = '100%';
  
    // Навигация между страницами
    document.getElementById('toMap')?.addEventListener('click', () => {
      window.location.href = '../gmap.html';
    });
  
    document.getElementById('toLevel2')?.addEventListener('click', () => {
      window.location.href = 'glevel2.html';
    });
  
    document.querySelector('.submit-btn').addEventListener('click', generateMatrix);
    checkBtn.addEventListener('click', checkAnswer);
    tryAgainBtn.addEventListener('click', generateMatrix);
  
    function generateMatrix() {
      const n = parseInt(verticesInput.value);
      if (isNaN(n) || n < 1 || n > 20) {
        showFeedback("Введите корректное количество вершин (1-20)", "error");
        return;
      }
  
      currentNodes = n;
      matrixContainer.innerHTML = '<div class="matrix-wrapper"></div>';
      const wrapper = matrixContainer.querySelector('.matrix-wrapper');
  
      feedback.textContent = '';
      feedback.className = 'feedback';
      userAnswerInput.value = '';
      checkBtn.style.display = 'inline-block';
      tryAgainBtn.style.display = 'none';
  
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
  
      const nodes = new vis.DataSet([]);
      const edges = new vis.DataSet([]);
  
      for (let i = 0; i < currentNodes; i++) {
        nodes.add({ id: i, label: String.fromCharCode(65 + i) });
      }
  
      const inputs = matrixContainer.querySelectorAll('input');
      inputs.forEach(input => {
        const from = parseInt(input.dataset.row);
        const to = parseInt(input.dataset.col);
        const value = parseInt(input.value);
        if (value === 1 && from !== to) {
          edges.add({ from, to, arrows: 'to', width: 2 });
        }
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

    /**
    * Проверяет ответ пользователя
    */
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
  
      const matrix = [];
      let hasEdges = false;
  
      // Считываем матрицу
      for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
          const input = document.querySelector(`input[data-row='${i}'][data-col='${j}']`);
          if (!input) return showFeedback("Сначала создайте матрицу", "error");
  
          let val = parseInt(input.value);
          if (isNaN(val) || val < 0) return showFeedback("В матрице должны быть числа 0 или 1", "error");
          if (val > 1) val = 1;
          input.value = val;
          row.push(!!val); // Преобразуем в булево значение
          if (i !== j && val === 1) hasEdges = true;
        }
        matrix.push(row);
      }
  
      if (!hasEdges) return showFeedback("Граф должен содержать хотя бы одно ребро", "error");
  
      // Получаем ответ пользователя
      const userAnswer = parseInt(userAnswerInput.value);
      if (isNaN(userAnswer) || userAnswer < 1) return showFeedback("Введите число компонент ≥ 1", "error");
  
      // Вычисляем число сильно связных компонент
      correctSCC = countSCC(matrix);
  
      if (userAnswer === correctSCC) {
        showFeedback("✅ Правильно!", "correct");
      } 
      else {
        showFeedback(`❌ Неправильно. Правильный ответ: ${correctSCC}`, "incorrect");
      }
  
      checkBtn.style.display = 'none';
      tryAgainBtn.style.display = 'inline-block';
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
        if (!visited[i]) dfs1(matrix, i, visited, stack);
      }
  
      // Фаза 2: транспонируем граф
      const t = transpose(matrix);
      visited.fill(false);
      let sccCount = 0;
  
      while (stack.length > 0) {
        const node = stack.pop();
        if (!visited[node]) {
          dfs2(t, node, visited, []);
          sccCount++;
        }
      }
      return sccCount;
    }
  
    /**
    * DFS для первой фазы
    */
    function dfs1(matrix, node, visited, stack) {
      visited[node] = true;
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[node][i] && !visited[i]) {
          dfs1(matrix, i, visited, stack);
        }
      }
      stack.push(node);
    }
  
    /**
    * DFS для второй фазы
    */
    function dfs2(matrix, node, visited, component) {
      visited[node] = true;
      component.push(node);
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[i][node] && !visited[i]) {
          dfs2(matrix, i, visited, component);
        }
      }
    }
  
    //Транспонирование матрицы

    function transpose(matrix) {
      return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    }
  
    function showFeedback(message, type) {
      feedback.textContent = message;
      feedback.className = `feedback ${type} show`;
      setTimeout(() => {
        feedback.className = `feedback ${type}`;
      }, 5000);
    }
  });
  