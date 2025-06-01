document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  let gameMode = urlParams.get('mode') || localStorage.getItem('gameMode') || 'normal';
  localStorage.setItem('gameMode', gameMode);
  console.log('[GameLevel3] Initialized gameMode:', gameMode);
  
  const matrixContainer = document.getElementById('matrixContainer');
  const checkBtn = document.getElementById('checkBtn');
  const tryAgainBtn = document.getElementById('tryAgainBtn');
  const generateBtn = document.getElementById('generateBtn');
  const toMap = document.getElementById('toMap');
  const toLevel2 = document.getElementById('toLevel2');
  const toLevel4 = document.getElementById('toLevel4');
  const verticesInput = document.getElementById('vertices');
  const userAnswerInput = document.getElementById('userAnswer');
  const feedback = document.getElementById('feedback');
  const graphContainer = document.getElementById('graph-visualization');
  graphContainer.style.height = '100%';

  let scoreDisplay = document.getElementById('score-display');
  if (!scoreDisplay) {
      scoreDisplay = document.createElement('div');
      scoreDisplay.id = 'score-display';
      scoreDisplay.className = 'score-display';
      document.querySelector('.level-container').appendChild(scoreDisplay);
      console.log('[GameLevel3] Created score-display element');
  }

  const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
  let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
  if (!allPlayersData[currentPlayer]) {
      allPlayersData[currentPlayer] = { scores: {}, gScores: {} };
  }
  if (!allPlayersData[currentPlayer].gScores[3]) {
      allPlayersData[currentPlayer].gScores[3] = { points: 0 };
  }
  let score = parseInt(allPlayersData[currentPlayer].gScores[3].points) || 0;
  scoreDisplay.textContent = `Счёт: ${score}`;
  scoreDisplay.style.display = gameMode === 'competition' ? 'block' : 'none';

  let gCompletedLevels = JSON.parse(localStorage.getItem('gCompletedLevels')) || [];
  let hasWon = gCompletedLevels.includes(3);

  toMap?.addEventListener('click', () => {
      console.log('[GameLevel3] Navigating to gmap.html with mode:', gameMode);
      window.location.href = `../gmap.html?mode=${gameMode}`;
  });
  toLevel2?.addEventListener('click', () => {
      console.log('[GameLevel3] Navigating to glevel2.html with mode:', gameMode);
      window.location.href = `glevel2.html?mode=${gameMode}`;
  });
  toLevel4?.addEventListener('click', () => {
      if (gameMode === 'passing' && !hasWon) {
          showFeedback('Сначала завершите текущий уровень', 'error');
          return;
      }
      console.log('[GameLevel3] Navigating to glevel4.html with mode:', gameMode);
      window.location.href = `glevel4.html?mode=${gameMode}`;
  });

  if (gameMode === 'passing') {
      toLevel4.disabled = !hasWon;
      toLevel4.style.opacity = hasWon ? '1' : '0.5';
      toLevel4.style.cursor = hasWon ? 'pointer' : 'not-allowed';
  }

  generateBtn.addEventListener('click', generateMatrix);
  checkBtn.addEventListener('click', checkAnswer);
  tryAgainBtn.addEventListener('click', resetTask);

  userAnswerInput.addEventListener('input', function () {
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
  let correctSCC = 0;

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

      const inputs = matrixContainer.querySelectorAll('input');
      inputs.forEach(input => {
          input.readOnly = true;
      });

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

  function updateScore(points) {
      if (gameMode !== 'competition') return;
      allPlayersData[currentPlayer].gScores[3].points += points;
      localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
      score = allPlayersData[currentPlayer].gScores[3].points;
      scoreDisplay.textContent = `Счёт: ${score >= 0 ? score : '-' + Math.abs(score)}`; 
      console.log('[GameLevel3] Updated score:', score, 'Added points:', points, 'for player:', currentPlayer);
      window.parent.postMessage({ 
          type: 'updateScore', 
          level: 3, 
          points: points, 
          isGraphLevel: true 
      }, '*');
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
          if (gameMode === 'competition') {
              updateScore(10);
          }
          if (gameMode === 'passing' && !hasWon) {
              hasWon = true;
              if (!gCompletedLevels.includes(3)) {
                  gCompletedLevels.push(3);
                  localStorage.setItem('gCompletedLevels', JSON.stringify(gCompletedLevels));
                  window.parent.postMessage({ type: 'levelCompleted', level: 3 }, '*');
                  console.log('[GameLevel3] Level 3 completed, gCompletedLevels:', gCompletedLevels);
              }
              toLevel4.disabled = false;
              toLevel4.style.opacity = '1';
              toLevel4.style.cursor = 'pointer';
          }
      } 
      else {
          showFeedback(`❌ Неправильно. Правильное количество компонент: ${correctSCC}`, "incorrect");
          if (gameMode === 'competition') {
              updateScore(-10);
          }
      }

      checkBtn.style.display = 'none';
      tryAgainBtn.style.display = 'inline-block';
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
      }, 2000);
  }

  generateMatrix();
});