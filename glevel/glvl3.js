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
  let vertices = [];

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
    vertices = [];
    
    // Создаем вершины
    for (let i = 0; i < currentNodes; i++) {
      vertices.push(new Vertex(String.fromCharCode(65 + i)));
    }
    
    // Добавляем ребра на основе матрицы
    const inputs = matrixContainer.querySelectorAll('input');
    inputs.forEach(input => {
      const from = parseInt(input.dataset.row);
      const to = parseInt(input.dataset.col);
      const value = parseInt(input.value);
      if (value === 1 && from !== to) {
        vertices[from].addEdge(vertices[to]);
      }
    });

    // Визуализация графа
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

    const userAnswer = parseInt(userAnswerInput.value);
    if (isNaN(userAnswer)) {
      showFeedback("Введите число компонент", "error");
      return;
    }
    
    if (userAnswer < 1 || userAnswer > n) {
      showFeedback(`Число компонент должно быть от 1 до ${n}`, "error");
      return;
    }

    // Подсчет компонент связности
    correctSCC = countComponents();

    if (userAnswer === correctSCC) {
      showFeedback("✅ Правильно!", "correct");
    } else {
      showFeedback(`❌ Неправильно. Правильный ответ: ${correctSCC}`, "incorrect");
    }

    checkBtn.style.display = 'none';
    tryAgainBtn.style.display = 'inline-block';
  }

  function countComponents() {
    let visited = new Set();
    let componentCount = 0;
    
    for (const vertex of vertices) {
      if (!visited.has(vertex)) {
        dfsComponent(vertex, visited);
        componentCount++;
      }
    }
    
    return componentCount;
  }
  
  function dfsComponent(vertex, visited) {
    visited.add(vertex);
    for (const neighbor of vertex.adjacent) {
      if (!visited.has(neighbor)) {
        dfsComponent(neighbor, visited);
      }
    }
  }

  function showFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = `feedback ${type} show`;
    setTimeout(() => {
      feedback.className = `feedback ${type}`;
    }, 5000);
  }
});
