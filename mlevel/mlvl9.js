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
          adjacencyMatrix = task.matrix;
          correctSCC = task.correctAnswer;
          currentNodes = adjacencyMatrix.length;
          renderMatrix(adjacencyMatrix);
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
      adjacencyMatrix = Array.from({ length: currentNodes }, (_, i) =>
          Array.from({ length: currentNodes }, (_, j) =>
              i === j ? 0 : Math.random() > 0.7 ? 1 : 0
          )
      );
      renderMatrix(adjacencyMatrix);
      updateGraph();
  }

  function renderMatrix(matrix) {
      matrixContainer.innerHTML = '<div class="matrix-wrapper"></div>';
      const wrapper = matrixContainer.querySelector('.matrix-wrapper');

      const n = matrix.length;
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
              if (adjacencyMatrix[i][j] === 1 && i !== j) {
                  vertices[i].addEdge(vertices[j]);
              }
          }
      }

      const nodes = new vis.DataSet(
          vertices.map((v, i) => ({ id: i, label: v.name }))
      );

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

      new vis.Network(graphContainer, data, options);
  }

  function calculateSCC(matrix) {
      const visited = Array(matrix.length).fill(false);
      const order = [];
      const components = [];

      function dfs1(v) {
          visited[v] = true;
          for (let i = 0; i < matrix.length; i++) {
              if (matrix[v][i] && !visited[i]) dfs1(i);
          }
          order.push(v);
      }

      function dfs2(v, component) {
          visited[v] = true;
          component.push(v);
          for (let i = 0; i < matrix.length; i++) {
              if (matrix[i][v] && !visited[i]) dfs2(i, component);
          }
      }

      for (let i = 0; i < matrix.length; i++) {
          if (!visited[i]) dfs1(i);
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

  checkBtn.addEventListener('click', () => {
      if (hasAnswered) return;

      const userInput = userAnswerInput.value.trim();
      if (!/^\d+$/.test(userInput)) {
          showFeedback("Введите целое число", "error");
          return;
      }

      const userSCC = parseInt(userInput);

      if (isMultiplayer) {
          hasAnswered = true;
          checkBtn.disabled = true;
          checkBtn.style.opacity = '0.5';
          checkBtn.style.cursor = 'not-allowed';

          socket.emit('playerAnswer', {
              room: roomCode,
              answer: userSCC,
              timestamp: Date.now(),
              correctAnswer: correctSCC
          });

          showFeedback("Ответ отправлен! Ожидаем других игроков...", "info");
      } 
      else {
          const actual = calculateSCC(adjacencyMatrix).length;
          if (userSCC === actual) {
              showFeedback("✅ Правильно!", "correct");
          } 
          else {
              showFeedback(`❌ Неправильно. Правильное количество компонент: ${actual}`, "incorrect");
          }
      }
  });

  function showFeedback(message, type) {
      feedback.textContent = message;
      feedback.className = `feedback ${type} show`;
      setTimeout(() => {
          feedback.className = `feedback ${type}`;
      }, 2000);
  }

  if (!isMultiplayer) {
      generateMatrix();
  }
});
