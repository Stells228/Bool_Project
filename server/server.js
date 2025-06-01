const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Для разработки разрешаем все домены
    methods: ["GET", "POST"]
  }
});

// Хранилище данных о комнатах
const rooms = new Map();

// Статическая папка для клиентских файлов
app.use(express.static(path.join(__dirname, 'public')));

// Обработка подключения нового клиента
io.on('connection', (socket) => {
  console.log(`Новое подключение: ${socket.id}`);

  // Обработчик создания комнаты
  socket.on('createRoom', (settings, callback) => {
    try {
      // Генерируем уникальный 5-значный код комнаты
      const roomCode = generateRoomCode();
      
      // Создаём новую комнату
      const newRoom = {
        code: roomCode,
        host: socket.id,
        maxPlayers: settings.maxPlayers,
        mode: settings.mode,
        levels: settings.levels,
        players: [{
          id: socket.id,
          username: 'Host', // Временное значение
          ready: false
        }],
        allReady: false
      };
      
      rooms.set(roomCode, newRoom);
      
      // Присоединяем сокет к комнате
      socket.join(roomCode);
      
      // Сохраняем информацию о комнате в сокете
      socket.roomCode = roomCode;
      socket.isHost = true;
      
      // Отправляем успешный ответ клиенту
      callback({
        success: true,
        roomCode: roomCode,
        maxPlayers: settings.maxPlayers
      });
      
      console.log(`Создана комната: ${roomCode}`);
    } catch (error) {
      console.error('Ошибка создания комнаты:', error);
      callback({ success: false, message: 'Ошибка создания комнаты' });
    }
  });

  // Обработчик подключения к комнате
  socket.on('joinRoom', (roomCode, username, callback) => {
    try {
      // Проверяем существование комнаты
      if (!rooms.has(roomCode)) {
        return callback({ success: false, message: 'Комната не найдена' });
      }
      
      const room = rooms.get(roomCode);
      
      // Проверяем количество игроков
      if (room.players.length >= room.maxPlayers) {
        return callback({ success: false, message: 'Комната заполнена' });
      }
      
      // Добавляем игрока в комнату
      const player = {
        id: socket.id,
        username: username || `Player ${room.players.length + 1}`,
        ready: false
      };
      
      room.players.push(player);
      
      // Присоединяем сокет к комнате
      socket.join(roomCode);
      
      // Сохраняем информацию о комнате в сокете
      socket.roomCode = roomCode;
      socket.isHost = false;
      
      // Отправляем успешный ответ клиенту
      callback({
        success: true,
        maxPlayers: room.maxPlayers,
        players: room.players.map(p => ({
          username: p.username,
          ready: p.ready
        }))
      });
      
      // Оповещаем других игроков о новом участнике
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

  // Обработчик изменения статуса готовности
  socket.on('setReady', (isReady) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex !== -1) {
      room.players[playerIndex].ready = isReady;
      
      // Оповещаем всех игроков об изменении статуса
      io.to(roomCode).emit('playerReadyChanged', playerIndex, isReady);
      
      // Проверяем, все ли готовы
      checkAllReady(room);
    }
  });

  // Обработчик начала игры
  socket.on('startGame', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    
    // Проверяем, что отправитель - хост
    if (socket.id !== room.host) return;
    
    // Проверяем, что все готовы
    if (room.allReady) {
      // Оповещаем всех игроков о начале игры
      io.to(roomCode).emit('gameStarting', {
        mode: room.mode,
        levels: room.levels
      });
      
      console.log(`Игра начинается в комнате ${roomCode}`);
    }
  });

  // Обработчик отключения игрока
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex !== -1) {
      // Удаляем игрока из комнаты
      const [player] = room.players.splice(playerIndex, 1);
      
      // Если это был хост, назначаем нового
      if (socket.id === room.host && room.players.length > 0) {
        room.host = room.players[0].id;
        io.to(room.players[0].id).emit('youAreNowHost');
      }
      
      // Оповещаем остальных игроков
      socket.to(roomCode).emit('playerLeft', playerIndex);
      
      // Если комната пуста, удаляем её
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`Комната ${roomCode} удалена (нет игроков)`);
      }
      
      console.log(`Игрок ${player.username} покинул комнату ${roomCode}`);
    }
  });

  // Обработчик выхода из комнаты
  socket.on('leaveRoom', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex !== -1) {
      // Удаляем игрока из комнаты
      const [player] = room.players.splice(playerIndex, 1);
      
      // Покидаем комнату
      socket.leave(roomCode);
      delete socket.roomCode;
      
      // Если это был хост, назначаем нового
      if (socket.id === room.host && room.players.length > 0) {
        room.host = room.players[0].id;
        io.to(room.players[0].id).emit('youAreNowHost');
      }
      
      // Оповещаем остальных игроков
      socket.to(roomCode).emit('playerLeft', playerIndex);
      
      // Если комната пуста, удаляем её
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`Комната ${roomCode} удалена (нет игроков)`);
      }
      
      console.log(`Игрок ${player.username} вышел из комнаты ${roomCode}`);
    }
  });
});

// Функция проверки готовности всех игроков
function checkAllReady(room) {
  const allReady = room.players.length > 0 && 
                  room.players.every(player => player.ready);
  
  if (allReady !== room.allReady) {
    room.allReady = allReady;
    io.to(room.code).emit('allPlayersReady', allReady);
  }
}

// Генерация 5-значного кода комнаты
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