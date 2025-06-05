const express = require('express');
const socketIo = require('socket.io');
const https = require('https');
const path = require('path');

const app = express();
const server = https.createServer(app);
const io = socketIo(server);

const LEVEL_BLOCKS = {
  bool: [1, 2, 3, 4, 5, 6],
  graphs: [7, 8, 9, 10, 11],
  all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const rooms = new Map();
const playerAnswers = new Map();
const playerScores = new Map();

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log(`Новое подключение: ${socket.id}`);

  socket.on('createRoom', (settings, callback) => {
    try {
      if (!settings.block || !LEVEL_BLOCKS[settings.block]) {
        return callback({ success: false, message: 'Неверный блок уровней' });
      }

      const roomCode = generateRoomCode();

      const newRoom = {
        code: roomCode,
        host: socket.id,
        maxPlayers: settings.maxPlayers,
        mode: settings.mode,
        levels: settings.levels,
        currentLevel: 1,
        players: [{
          id: socket.id,
          username: socket.username || 'Player1',
          ready: false,
          readyForNext: false
        }],
        gameStarting: false,
        gameFinished: false,
        block: settings.block,
        availableLevels: [...LEVEL_BLOCKS[settings.block]]
      };

      rooms.set(roomCode, newRoom);
      playerScores.set(roomCode, new Map());
      playerScores.get(roomCode).set(socket.id, 0);

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.isHost = true;

      callback({
        success: true,
        roomCode: roomCode,
        maxPlayers: settings.maxPlayers
      });

      console.log(`Создана комната: ${roomCode} (Уровней: ${settings.levels})`);
    }
    catch (error) {
      console.error('Ошибка создания комнаты:', error);
      callback({ success: false, message: 'Ошибка создания комнаты' });
    }
  });

  socket.on('joinRoom', (roomCode, username, callback) => {
    try {
      if (!rooms.has(roomCode)) {
        return callback({ success: false, message: 'Комната не найдена' });
      }

      const room = rooms.get(roomCode);

      if (room.players.length >= room.maxPlayers) {
        return callback({ success: false, message: 'Комната заполнена' });
      }

      const blockNames = {
        bool: 'Булевы функции',
        graphs: 'Графы',
        all: 'Все уровни'
      };

      document.getElementById('level-block-info').textContent = 
        `Блок: ${blockNames[room.block]}`;

      const player = {
        id: socket.id,
        username: username || `Player${room.players.length + 1}`,
        ready: false,
        readyForNext: false
      };

      room.players.push(player);
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.isHost = false;
      socket.username = username;

      // Инициализация счета для игрока
      if (!playerScores.has(roomCode)) {
        playerScores.set(roomCode, new Map());
      }
      playerScores.get(roomCode).set(socket.id, 0);

      callback({
        success: true,
        maxPlayers: room.maxPlayers,
        players: room.players.map(p => ({
          username: p.username,
          ready: p.ready
        }))
      });

      socket.to(roomCode).emit('playerJoined', {
        index: room.players.length - 1,
        username: player.username
      });

      console.log(`Игрок ${player.username} присоединился к комнате ${roomCode}`);
    } catch (error) {
      console.error('Ошибка подключения к комнате:', error);
      callback({ success: false, message: 'Ошибка подключения к комнате' });
    }
  });

  socket.on('startGame', (roomCode, callback) => {
    if (!rooms.has(roomCode)) return callback && callback({ success: false, message: 'Комната не найдена' });
    const room = rooms.get(roomCode);
    if (socket.id !== room.host) return callback && callback({ success: false, message: 'Только хост может начать игру' });

    const allReady = room.players.every(p => p.ready);
    if (allReady) {
      room.gameStaring = true;
      const level = getRandomLevelFromBlock(room);
      const task = generateTask(level);
      room.currentTask = task;
      io.to(roomCode).emit('gameStarting', { level, task });
      callback && callback({ success: true });
      console.log(`Игра начата в комнате ${roomCode}`);
    }
    else {
      callback && callback({ success: false, message: 'Не все игроки готовы' });
    }
  });

  function generateTask(level) {
    if (level === 1) {
      const functions = {
        "Нулевая функция": "0000",
        "Конъюнкция": "0001",
        "Запрет по x": "0100",
        "функция по x": "0011",
        "Запрет по y": "0010",
        "функция по y": "0101",
        "Сложение": "0110",
        "Дизъюнкция": "0111",
        "Стрелка Пирса": "1000",
        "Эквивалентность": "1001",
        "Отрицание y": "1010",
        "Обратная импликация": "1011",
        "Отрицание x": "1100",
        "Импликация": "1101",
        "Штрих Шеффера": "1110",
        "Единичная функция": "1111"
      };
      const keys = Object.keys(functions);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];

      return {
        vector: functions[randomKey],
        correctAnswer: randomKey
      };
    }
    else if (level === 2) {
      const n = 2 + Math.floor(Math.random() * 2);
      const vector = Array.from({ length: 2 ** n }, () =>
        Math.floor(Math.random() * 2)).join('');

      const result = findDummyAndEssentialVariables(vector, n);
      return {
        vector: vector,
        correctAnswer: {
          dummy: result.dummy,
          essential: result.essential
        },
        variablesCount: n
      };
    }
    else if (level === 3) {
      const n = 2 + Math.floor(Math.random() * 2);
      const vector = Array.from({ length: 2 ** n }, () =>
        Math.floor(Math.random() * 2)).join('');

      return {
        vector: vector,
        correctAnswer: getDNF(vector),
        variablesCount: n
      };
    }
    else if (level === 4) {
      const n = 2 + Math.floor(Math.random() * 2);
      const vector = Array.from({ length: 2 ** n }, () =>
        Math.floor(Math.random() * 2)).join('');

      return {
        vector: vector,
        correctAnswer: getCNF(vector),
        variablesCount: n
      };
    }
    else if (level === 5) {
      const n = 2 + Math.floor(Math.random() * 2); // 2-3 переменные
      const vector = Array.from({ length: 2 ** n }, () =>
        Math.floor(Math.random() * 2)).join('');

      // Вычисляем принадлежность к классам
      const classes = {
        T0: vector[0] === '0' ? 1 : 0,
        T1: vector[vector.length - 1] === '1' ? 1 : 0,
        S: checkS(vector),
        M: checkM(vector),
        L: checkL(vector)
      };

      return {
        vector: vector,
        correctAnswer: classes,
        variablesCount: n
      };
    }
    else if (level === 6) {
      const count = 2 + Math.floor(Math.random() * 2);
      const vectors = [];
      const classes = [];

      for (let i = 0; i < count; i++) {
        const n = 2 + Math.floor(Math.random() * 2);
        const vector = Array.from({ length: 2 ** n }, () =>
          Math.floor(Math.random() * 2)).join('');
        vectors.push(vector);
        classes.push({
          T0: vector[0] === '0' ? 1 : 0,
          T1: vector[vector.length - 1] === '1' ? 1 : 0,
          S: checkS(vector),
          M: checkM(vector),
          L: checkL(vector)
        });
      }
      // Определение, является ли система полной
      let isComplete = false;
      let closedClasses = '';

      // Проверяем каждый класс (T0, T1, S, M, L)
      const classChecks = ['T0', 'T1', 'S', 'M', 'L'];
      for (const cls of classChecks) {
        const allInClass = classes.every(func => func[cls] === 1);
        if (allInClass) {
          closedClasses += cls;
        }
      }

      isComplete = closedClasses === '';

      return {
        vectors: vectors,
        correctAnswer: {
          isComplete: isComplete,
          closedClasses: closedClasses
        }
      };
    }
    else if (level === 7) {
      const n = 2 + Math.floor(Math.random() * 3); // 2-4 вершины
      const matrix = generateRandomAdjMatrix(n);
      const start = Math.floor(Math.random() * n);
      const dfsOrder = calculateDFS(matrix, start);
      return {
        matrix: matrix,
        start: start,
        correctAnswer: dfsOrder.map(i => String.fromCharCode(65 + i)).join(' ')
      };
    }
    else if (level === 8) {
      const n = 2 + Math.floor(Math.random() * 3); // 2–4 вершины
      const matrix = generateRandomAdjMatrix(n);
      const start = Math.floor(Math.random() * n);
      const bfsOrder = calculateBFS(matrix, start);
      return {
        matrix: matrix,
        start: start,
        correctAnswer: bfsOrder.map(i => String.fromCharCode(65 + i)).join(' ')
      };
    }
    else if (level === 9) {
      const n = 2 + Math.floor(Math.random() * 3);
      const matrix = generateRandomAdjMatrix(n);
      const components = calculateSCC(matrix);
      return {
        matrix: matrix,
        correctAnswer: components.length
      };
    }
    else if (level === 10) {
      const n = 2 + Math.floor(Math.random() * 3); // 2–4 вершины
      const matrix = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) =>
          i === j ? 0 : (Math.random() < 0.3 ? Math.floor(Math.random() * 10) + 1 : 0)
        )
      );
      const maxFlow = calculateMaxFlow(matrix, 0, n - 1);

      return {
        matrix: matrix,
        correctAnswer: maxFlow
      };
    }
    else if (level === 11) {
      const nodes = Math.floor(Math.random() * 2) + 3;
      const matrix = generateRandomUndirectedGraph(nodes, 0.3);
      const coloring = greedyColoring(matrix);
      const chromaticNumber = new Set(coloring).size;

      return {
        matrix: matrix,
        correctAnswer: chromaticNumber
      };
    }

  }

  function getRandomLevelFromBlock(room) {
    if (room.availableLevels.length === 0) {
      // Если уровни закончились - восстанавливаем исходный набор
      room.availableLevels = [...LEVEL_BLOCKS[room.block]];
    }
    const randomIndex = Math.floor(Math.random() * room.availableLevels.length);
    const level = room.availableLevels[randomIndex];
    // Удаляем выбранный уровень, чтобы не повторялся
    room.availableLevels.splice(randomIndex, 1);

    return level;
  }

  function calculateMaxFlow(matrix, source, sink) {
    const n = matrix.length;
    const residual = matrix.map(row => row.slice());
    const parent = Array(n).fill(-1);
    let maxFlow = 0;

    function bfs() {
      const visited = Array(n).fill(false);
      const queue = [source];
      visited[source] = true;
      parent[source] = -1;

      while (queue.length > 0) {
        const u = queue.shift();
        for (let v = 0; v < n; v++) {
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

    function dfs2(v, comp) {
      visited[v] = true;
      comp.push(v);
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[i][v] && !visited[i]) dfs2(i, comp);
      }
    }

    for (let i = 0; i < matrix.length; i++) {
      if (!visited[i]) dfs1(i);
    }

    visited.fill(false);
    order.reverse();

    for (const v of order) {
      if (!visited[v]) {
        const comp = [];
        dfs2(v, comp);
        components.push(comp);
      }
    }

    return components;
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

      const neighbors = [];
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[node][i] && !visited[i]) {
          neighbors.push(i);
          visited[i] = true;
        }
      }

      neighbors.sort((a, b) => a - b);
      queue.push(...neighbors);
    }

    return result;
  }

  function generateRandomUndirectedGraph(n, edgeProb) {
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.random() < edgeProb) {
          matrix[i][j] = 1;
          matrix[j][i] = 1;
        }
      }
    }
    return matrix;
  }

  function greedyColoring(matrix) {
    const n = matrix.length;
    const result = Array(n).fill(-1);
    result[0] = 0;
    const available = Array(n).fill(true);

    for (let u = 1; u < n; u++) {
      for (let i = 0; i < n; i++) {
        if (matrix[u][i] === 1 && result[i] !== -1) {
          available[result[i]] = false;
        }
      }

      for (let c = 0; c < n; c++) {
        if (available[c]) {
          result[u] = c;
          break;
        }
      }

      available.fill(true);
    }

    return result;
  }


  function generateRandomAdjMatrix(n) {
    const matrix = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => (Math.random() > 0.7 ? 1 : 0))
    );
    for (let i = 0; i < n; i++) matrix[i][i] = 0;
    return matrix;
  }

  function calculateDFS(matrix, start) {
    const visited = Array(matrix.length).fill(false);
    const result = [];

    function dfs(v) {
      visited[v] = true;
      result.push(v);
      const neighbors = [];
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[v][i] && !visited[i]) neighbors.push(i);
      }
      neighbors.sort((a, b) => a - b);
      for (const u of neighbors) dfs(u);
    }

    dfs(start);
    return result;
  }

  function isLessOrEqual(i, j, vars) {
    for (let k = 0; k < vars; k++) {
      const bitI = (i >> k) & 1;
      const bitJ = (j >> k) & 1;
      if (bitI > bitJ) return false;
    }
    return true;
  }


  function checkS(vector) {
    const len = vector.length;
    for (let i = 0; i < len / 2; i++) {
      if (vector[i] === vector[len - 1 - i]) return 0;
    }
    return 1;
  }

  function checkM(vector) {
    const len = vector.length;
    const vars = Math.log2(len);
    for (let i = 0; i < len - 1; i++) {
      for (let j = i + 1; j < len; j++) {
        if (isLessOrEqual(i, j, vars)) {
          if (vector[i] > vector[j]) return 0;
        }
      }
    }
    return 1;
  }

  function checkL(vector) {
    const n = vector.length;
    const vars = Math.log2(n);
    for (let a = 0; a < n; a++) {
      let match = true;
      for (let x = 0; x < n; x++) {
        let product = 0;
        for (let i = 0; i < vars; i++) {
          product += ((a >> i) & 1) * ((x >> i) & 1);
        }
        if ((product % 2) !== parseInt(vector[x])) {
          match = false;
          break;
        }
      }
      if (match) return 1;
    }
    return 0;
  }

  // Функции для генерации ДНФ и КНФ
  function getDNF(vector) {
    const n = Math.log2(vector.length);
    if (!Number.isInteger(n)) throw new Error("Длина вектора должна быть степенью двойки");
    const variables = Array.from({ length: n }, (_, i) => `x${i + 1}`);
    let dnf = '';

    for (let i = 0; i < vector.length; i++) {
      if (vector[i] === '1') {
        const binary = i.toString(2).padStart(n, '0');
        let term = '';
        for (let j = 0; j < n; j++) {
          term += binary[j] === '0' ? `¬${variables[j]} ∧ ` : `${variables[j]} ∧ `;
        }
        dnf += `(${term.slice(0, -3)}) ∨ `;
      }
    }
    return dnf === '' ? '0' : dnf.slice(0, -3);
  }

  function getCNF(vector) {
    const n = Math.log2(vector.length);
    if (!Number.isInteger(n)) throw new Error("Длина вектора должна быть степенью двойки");
    const variables = Array.from({ length: n }, (_, i) => `x${i + 1}`);
    let cnf = '';

    for (let i = 0; i < vector.length; i++) {
      if (vector[i] === '0') {
        const binary = i.toString(2).padStart(n, '0');
        let term = '';
        for (let j = 0; j < n; j++) {
          term += binary[j] === '1' ? `¬${variables[j]} ∨ ` : `${variables[j]} ∨ `;
        }
        term = term.slice(0, -3);
        cnf += `(${term}) ∧ `;
      }
    }
    return cnf === '' ? '1' : cnf.slice(0, -3);
  }

  // Функция для определения фиктивных и существенных переменных
  function findDummyAndEssentialVariables(vector, n) {
    let dummyVars = '';
    let essentialVars = '';
    for (let j = 1; j <= n; j++) {
      let partLength = vector.length / (2 ** j);
      let zeroPart = '';
      let onePart = '';
      for (let i = 0; i < 2 ** j; i++) {
        let start = i * partLength;
        let end = start + partLength;
        if (i % 2 === 0) zeroPart += vector.slice(start, end);
        else onePart += vector.slice(start, end);
      }
      if (zeroPart === onePart) dummyVars += j;
      else essentialVars += j;
    }
    return { dummy: dummyVars, essential: essentialVars };
  }

  socket.on('setReady', (isReady) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms.has(roomCode)) return;

    const room = rooms.get(roomCode);
    const player = room.players.find(p => p.id === socket.id);

    if (player) {
      player.ready = isReady;
      io.to(roomCode).emit('updatePlayers', room.players);
      checkAllPlayersReady(roomCode);
    }
  });

  function checkAllPlayersReady(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    const allReady = room.players.every(p => p.ready);
    if (allReady && room.gameStarting) {
      io.to(roomCode).emit('allPlayersReady');
    }
  }

  // Обработка ответа игрока
  socket.on('playerAnswer', ({ room, answer, timestamp, correctAnswer }) => {
    if (!rooms.has(room)) return;

    const roomData = rooms.get(room);
    if (!playerAnswers.has(room)) {
      playerAnswers.set(room, new Map());
    }

    // Проверяем правильность ответа
    const isCorrect = checkAnswer(answer, correctAnswer);

    // Сохраняем ответ игрока
    playerAnswers.get(room).set(socket.id, {
      username: socket.username,
      answer: answer,
      timestamp: timestamp,
      isCorrect: isCorrect
    });

    checkAllPlayersAnswered(room);
  });

  function checkAllPlayersAnswered(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    const answers = playerAnswers.get(roomCode);
    if (!answers) return;

    // Проверяем, что все игроки ответили
    const allAnswered = room.players.every(player => answers.has(player.id));
    if (!allAnswered) return;

    // Сортируем ответы по времени (быстрее - выше)
    const sortedAnswers = [...answers.entries()]
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const scores = playerScores.get(roomCode);
    sortedAnswers.forEach((answer, index) => {
      const currentScore = scores.get(answer.id) || 0;
      let points = 0;

      if (answer.isCorrect) {
        switch (index) {
          case 0: points = 100; break;
          case 1: points = 70; break;
          case 2: points = 50; break;
          default: points = 10; break;
        }
      }
      else {
        points = -50;
      }

      scores.set(answer.id, currentScore + points);
    });

    // Формируем результаты
    const results = room.players.map(player => {
      const answerData = answers.get(player.id);
      return {
        id: player.id,
        username: player.username,
        isCorrect: answerData ? answerData.isCorrect : false,
        score: scores.get(player.id) || 0,
        gameFinished: room.gameFinished
      };
    });

    // Отправляем результаты всем игрокам
    io.to(roomCode).emit('showResults', results);

    const timerDuration = room.gameFinished ? 10000 : 5000;
    setTimeout(() => {
      proceedToNextLevel(roomCode);
    }, timerDuration);
  }

  function proceedToNextLevel(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.currentLevel++;

    if (room.currentLevel > room.levels) {
      // Игра завершена
      room.gameFinished = true;
      const finalResults = getPlayerResults(roomCode);

      // Добавляем флаг завершения для каждого игрока
      finalResults.forEach(player => {
        player.gameFinished = true;
      });

      io.to(roomCode).emit('gameFinished', finalResults);

      // Очищаем комнату через 10 секунд
      setTimeout(() => {
        rooms.delete(roomCode);
        playerAnswers.delete(roomCode);
        playerScores.delete(roomCode);
      }, 10000);
    }
    else {
      // Генерируем новое задание
      const nextLevel = getRandomLevelFromBlock(room);
      const task = generateTask(nextLevel);
      room.currentTask = task;

      // Сбрасываем флаги готовности
      room.players.forEach(p => {
        p.ready = false;
        p.readyForNext = false;
      });

      // Очищаем ответы текущего раунда
      playerAnswers.delete(roomCode);

      // Отправляем игрокам на следующий уровень
      io.to(roomCode).emit('nextLevel', {
        level: nextLevel,
        task: task
      });
    }
  }

  // Проверка ответа
  function checkAnswer(playerAnswer, correctAnswer) {
    if (typeof correctAnswer === 'string') {
      return playerAnswer.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
    }
    else if (typeof playerAnswer === 'number') {
      return playerAnswer === correctAnswer;
    }
    else if (playerAnswer.dummy !== undefined) {
      return playerAnswer.dummy === correctAnswer.dummy &&
        playerAnswer.essential === correctAnswer.essential;
    }
    else if (playerAnswer.T0 !== undefined) {
      // Для уровня 5
      return playerAnswer.T0 === correctAnswer.T0 &&
        playerAnswer.T1 === correctAnswer.T1 &&
        playerAnswer.S === correctAnswer.S &&
        playerAnswer.M === correctAnswer.M &&
        playerAnswer.L === correctAnswer.L;
    }
    else if (typeof correctAnswer === 'number') {
      return playerAnswer === correctAnswer;
    }
    else {
      // Для уровня 6
      return playerAnswer.isComplete === correctAnswer.isComplete &&
        playerAnswer.closedClasses === correctAnswer.closedClasses;
    }
  }

  // Получение результатов игроков
  function getPlayerResults(roomCode) {
    const room = rooms.get(roomCode);
    const answers = playerAnswers.get(roomCode);
    const scores = playerScores.get(roomCode);

    return room.players.map(player => {
      const answerData = answers ? answers.get(player.id) : null;
      return {
        id: player.id,
        username: player.username,
        isCorrect: answerData ? answerData.isCorrect : false,
        score: scores.get(player.id) || 0
      };
    });
  }

  socket.on('playerReadyForNext', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms.has(roomCode)) return;

    const room = rooms.get(roomCode);
    const player = room.players.find(p => p.id === socket.id);

    if (player) {
      player.readyForNext = true;
      io.to(roomCode).emit('updatePlayers', room.players);

      // Проверяем, все ли готовы к следующему уровню
      const allReady = room.players.every(p => p.readyForNext);
      if (allReady && !room.gameFinished) {
        proceedToNextLevel(roomCode);
      }
    }
  });

  // Отключение игрока
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms.has(roomCode)) return;

    const room = rooms.get(roomCode);
    const playerIndex = room.players.findIndex(p => p.id === socket.id);

    if (playerIndex !== -1) {
      const [player] = room.players.splice(playerIndex, 1);

      // Если хост отключился, назначаем нового хоста
      if (socket.id === room.host && room.players.length > 0) {
        room.host = room.players[0].id;
        io.to(room.players[0].id).emit('youAreNowHost');
      }

      // Уведомляем других игроков
      socket.to(roomCode).emit('playerLeft', playerIndex);

      if (room.players.length === 0) {
        rooms.delete(roomCode);
        playerAnswers.delete(roomCode);
        playerScores.delete(roomCode);
        console.log(`Комната ${roomCode} удалена (нет игроков)`);
      }

      console.log(`Игрок ${player.username} покинул комнату ${roomCode}`);
    }
  });

  socket.on('leaveRoom', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms.has(roomCode)) return;

    const room = rooms.get(roomCode);
    const playerIndex = room.players.findIndex(p => p.id === socket.id);

    if (playerIndex !== -1) {
      const [player] = room.players.splice(playerIndex, 1);

      socket.leave(roomCode);
      delete socket.roomCode;

      // Если хост вышел, назначаем нового хоста
      if (socket.id === room.host && room.players.length > 0) {
        room.host = room.players[0].id;
        io.to(room.players[0].id).emit('youAreNowHost');
      }

      // Уведомляем других игроков
      socket.to(roomCode).emit('playerLeft', playerIndex);

      // Если в комнате не осталось игроков, удаляем ее
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        playerAnswers.delete(roomCode);
        playerScores.delete(roomCode);
        console.log(`Комната ${roomCode} удалена (нет игроков)`);
      }

      console.log(`Игрок ${player.username} вышел из комнаты ${roomCode}`);
    }
  });
});

// Случайный выбор уровня
function getRandomLevel() {
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return levels[Math.floor(Math.random() * levels.length)];
}

// Генерация кода комнаты
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(10000 + Math.random() * 90000).toString();
  } while (rooms.has(code));
  return code;
}

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
