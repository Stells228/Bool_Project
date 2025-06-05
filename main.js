document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyDlHLCPtlITZ4ezjYWbUYA3r70BgensOl8",
        authDomain: "hehe-63f6d.firebaseapp.com",
        projectId: "hehe-63f6d",
        storageBucket: "hehe-63f6d.appspot.com",
        messagingSenderId: "54586209991",
        appId: "1:54586209991:web:ecaa663106b0160a1cb0e2"
    };
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();

    auth.onAuthStateChanged((user) => {
        const userInfo = document.getElementById('user-info');
        if (user) {
            userInfo.style.display = 'flex';
            document.getElementById('user-email').textContent = user.email;
        }
        else {
            userInfo.style.display = 'none';
            window.location.href = 'index.html';
        }
    });

    let selectedBlock = 'all';

    // Обработчик кнопки выхода
    document.querySelector('.sign-out-btn')?.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        }).catch(console.error);
    });
    function positionToggleButtons() {
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        const totalButtons = toggleButtons.length;
        const viewportHeight = window.innerHeight;
        const buttonHeight = toggleButtons[0]?.offsetHeight || 70;
        const fixedSpacing = 20;
        const totalHeight = buttonHeight * totalButtons + fixedSpacing * (totalButtons - 1);
        const startTop = (viewportHeight - totalHeight) / 2;
        const cloudElements = document.querySelectorAll('.cloudmoon, .cloudmoon2, .cloudmoon3, .cloudmoon4, .cloudmoon5');

        window.addEventListener('pagehide', () => {
            cloudElements.forEach(cloud => {
                cloud.style.animation = 'none';
            });
        });

        toggleButtons.forEach((btn, index) => {
            const topPosition = startTop + index * (buttonHeight + fixedSpacing);
            btn.style.top = `${topPosition}px`;
            btn.style.right = '-60px';
        });
    }

    function loadLectureContent() {
        const lectureContent = document.getElementById('lecture-content');
        if (!lectureContent) return;
        lectureContent.innerHTML = '';

        const lectures = [
            { id: 1, title: '1. Двоичные наборы' },
            { id: 2, title: '2. Булевы функции' },
            { id: 3, title: '3. Остаточные функции и существенность переменных' },
            { id: 4, title: '4. Суперпозиция и термы' },
            { id: 5, title: '5. Дизъюнктивные нормальные формы (ДНФ)' },
            { id: 6, title: '6. Полиномиальные формы и полином Жегалкина' },
            { id: 7, title: '7. Замкнутость и полнота' },
            { id: 8, title: '8. Классы булевых функций' },
            { id: 9, title: '9. Минимизация ДНФ' }
        ];

        lectures.forEach(lecture => {
            const block = document.createElement('div');
            block.className = 'lecture-block';
            block.dataset.lectureId = lecture.id;

            const title = document.createElement('h3');
            title.textContent = lecture.title;
            block.appendChild(title);

            const starsContainer = document.createElement('div');
            starsContainer.className = 'lecture-stars';
            block.appendChild(starsContainer);

            block.addEventListener('click', () => {
                transitionOverlay.classList.add('active');
                setTimeout(() => {
                    window.location.href = `bool/lec${lecture.id}.html`;
                }, 300);
            });

            lectureContent.appendChild(block);
        });

        updateLectureBlocks();
    }

    positionToggleButtons();

    const windows = [
        { id: 'calc-window', btnId: 'calc-toggle' },
        { id: 'gear-window', btnId: 'gear-toggle' },
        { id: 'cup-window', btnId: 'cup-toggle' },
        { id: 'construction-window', btnId: 'construction-toggle' },
        { id: 'lecture-window', btnId: 'lecture-toggle' },
        { id: 'multiplayer-window', btnId: 'multiplayer-toggle' }
    ];

    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);

    transitionOverlay.classList.remove('active');
    console.log('Transition overlay reset on main.html');

    const mainScreen = document.getElementById('main-screen');
    const mapBtn = document.getElementById('map-btn');

    if (!mainScreen || !mapBtn) {
        console.error('Critical elements missing:', { mainScreen, mapBtn });
        return;
    }

    const images = document.querySelectorAll('.image-container img');
    images.forEach(img => {
        img.addEventListener('error', () => {
            console.error(`Failed to load image: ${img.src}`);
        });
        img.addEventListener('load', () => {
            console.log(`Image loaded: ${img.src}`);
        });
    });

    const getClosedPosition = () => {
        const width = window.innerWidth;
        if (width <= 507) return '-85vw';
        if (width <= 754) return '-80vw';
        if (width >= 684 && width <= 800) return '-78vw';
        return '-600px';
    };

    const fabMenu = document.getElementById('fab-menu');
    const fabMain = document.getElementById('fab-main');

    fabMain.addEventListener('click', (e) => {
        e.stopPropagation();
        fabMenu.classList.toggle('open');

        // Анимация "покачивания" при открытии/закрытии
        fabMain.style.transform = fabMenu.classList.contains('open')
            ? 'scale(1.1) rotate(90deg)'
            : 'scale(1) rotate(0)';

        // Добавляем/удаляем класс для анимации
        if (fabMenu.classList.contains('open')) {
            fabMain.classList.add('active');
        }
        else {
            fabMain.classList.remove('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!fabMenu.contains(e.target)) {
            fabMenu.classList.remove('open');
            fabMain.querySelector('img').src = 'Photos/up.png';
        }
    });

    function openSlideWindow(id) {
        document.getElementById('fab-close').style.display = 'flex';
        document.getElementById('fab-main').style.display = 'none';
        ['calc-window', 'gear-window', 'cup-window', 'construction-window', 'lecture-window', 'multiplayer-window'].forEach(winId => {
            const win = document.getElementById(winId);
            if (win) {
                win.style.left = getClosedPosition();
                win.classList.remove('open');
                win.classList.add('closed');
            }
        });
        const win = document.getElementById(id);
        if (win) {
            win.style.left = '0px';
            win.classList.add('open');
            win.classList.remove('closed');
        }
        fabMenu.classList.remove('open');
    }

    document.getElementById('fab-close').addEventListener('click', () => {
        // Закрыть all окна
        ['calc-window', 'gear-window', 'cup-window', 'construction-window', 'lecture-window', 'multiplayer-window'].forEach(winId => {
            const win = document.getElementById(winId);
            if (win) {
                win.style.left = getClosedPosition();
                win.classList.remove('open');
                win.classList.add('closed');
            }
        });

        document.getElementById('fab-main').style.display = 'flex';
        document.getElementById('fab-close').style.display = 'none';
        setupMultiplayerTabs();
    });

    document.getElementById('fab-calc').onclick = () => openSlideWindow('calc-window');
    document.getElementById('fab-gear').onclick = () => openSlideWindow('gear-window');
    document.getElementById('fab-cup').onclick = () => openSlideWindow('cup-window');
    document.getElementById('fab-constructor').onclick = () => openSlideWindow('construction-window');
    document.getElementById('fab-lecture').onclick = () => { openSlideWindow('lecture-window'); loadLectureContent(); };
    document.getElementById('fab-multiplayer').onclick = () => { openSlideWindow('multiplayer-window'); setupMultiplayerTabs(); };


    function checkTextOverlap() {
        const title = document.querySelector('.Title');
        const buttons = document.querySelectorAll('.fab-menu, .map-btn');
        if (!title) {
            console.warn('Title element not found');
            return;
        }
        const titleRect = title.getBoundingClientRect();
        buttons.forEach(button => {
            const btnRect = button.getBoundingClientRect();
            const isOverlapping = !(
                titleRect.right < btnRect.left ||
                titleRect.left > btnRect.right ||
                titleRect.bottom < btnRect.top ||
                titleRect.top > btnRect.bottom
            );
            if (isOverlapping && !button.classList.contains('hidden')) {
                console.warn(`Text overlap detected with: ${button.id || button.className}`);
                button.style.opacity = '0.5';
            }
            else if (!button.classList.contains('hidden')) {
                button.style.opacity = '1';
            }
        });
    }

    window.addEventListener('resize', () => {
        checkTextOverlap();
        // Пересчитываем позиции кнопок при изменении размера окна
        positionToggleButtons();

        // Закрываем окна при ресайзе, если они закрыты
        ['calc-window', 'gear-window', 'cup-window', 'construction-window', 'lecture-window', 'multiplayer-window'].forEach(id => {
            const slideWindow = document.getElementById(id);
            if (slideWindow && slideWindow.classList.contains('closed')) {
                slideWindow.style.left = getClosedPosition();
            }
        });
    });

    window.addEventListener('load', () => {
        checkTextOverlap();
        document.body.style.opacity = '1';
    });

    function handleMapButtonClick() {
        const gameMode = mapBtn.dataset.mode;
        transitionOverlay.classList.add('active');

        requestIdleCallback(() => {
            history.pushState({ mode: gameMode }, '', `map.html?mode=${gameMode}`);
            window.dispatchEvent(new Event('popstate'));
        }, { timeout: 300 });
    }

    if (mapBtn && mainScreen) {
        mapBtn.removeEventListener('click', handleMapButtonClick);
        mapBtn.addEventListener('click', handleMapButtonClick);
    }
    else {
        console.warn('Map button or main screen not found');
    }

    document.addEventListener('click', (e) => {
        ['calc-window', 'gear-window', 'cup-window', 'construction-window', 'lecture-window', 'multiplayer-window'].forEach(id => {
            const slideWindow = document.getElementById(id);
            if (slideWindow && slideWindow.classList.contains('open')) {
                const isClickInside = slideWindow.contains(e.target) || fabMenu.contains(e.target);
                if (!isClickInside) {
                    slideWindow.style.left = getClosedPosition();
                    slideWindow.classList.remove('open');
                    slideWindow.classList.add('closed');
                    document.getElementById('fab-main').style.display = 'flex';
                    document.getElementById('fab-close').style.display = 'none';
                }
            }
        });
    });

    document.body.style.opacity = '1';
    transitionOverlay.classList.remove('active');

    const rightArrow = document.getElementById('right-arrow');
    const transitionScreen = document.getElementById('transition-screen');

    rightArrow.addEventListener('click', () => {
        transitionScreen.classList.add('active');
        setTimeout(() => {
            history.pushState({}, '', 'gmain.html');
            window.dispatchEvent(new Event('popstate'));
        }, 500);
    });

    // Обработка popstate для переходов
    window.addEventListener('popstate', (event) => {
        if (event.state?.mode) {
            handlePageTransition(event.state.mode);
        }
        else {
            location.reload();
        }
    });

    function handlePageTransition(mode) {
        transitionOverlay.classList.add('active');
        setTimeout(() => {
            window.location.href = `map.html?mode=${mode}`;
        }, 400);
    }

    window.updateLectureBlocks = function () {
        const results = JSON.parse(localStorage.getItem('lectureTestResults') || '{}');

        document.querySelectorAll('.lecture-block').forEach(block => {
            const lectureId = block.dataset.lectureId;
            const result = results[`lecture${lectureId}`];
            const starsContainer = block.querySelector('.lecture-stars');

            if (!starsContainer) return;

            starsContainer.innerHTML = '';

            if (result) {
                const percentage = (result.correct / result.total) * 100;

                for (let i = 0; i < 3; i++) {
                    const star = document.createElement('span');
                    star.className = 'lecture-star';
                    star.textContent = '★';

                    if (percentage === 100 && i < 3 ||
                        percentage >= 50 && i < 2 ||
                        percentage >= 30 && i < 1) {
                        star.classList.add('filled');
                    }

                    starsContainer.appendChild(star);
                }
            }
        });
    };

    if (typeof updateLectureBlocks === 'function') {
        updateLectureBlocks();
    }

    // Подключение к серверу Socket.IO
    const socket = io('https://lichinkis.ru/');

    let currentRoom = null;
    let isHost = false;
    let playerReady = false;

    function createRoom(settings) {
        // Проверяем корректность количества игроков и уровней
        if (settings.maxPlayers < 2 || settings.maxPlayers > 4) {
            alert('Количество игроков должно быть от 2 до 4');
            return;
        }

        if (settings.levels < 1 || settings.levels > 10) {
            alert('Количество уровней должно быть от 1 до 10');
            return;
        }

        let selectedBlock = document.querySelector('.block-option.selected')?.dataset.block || 'bool';
        settings.block = selectedBlock;

        socket.emit('createRoom', settings, (response) => {
            if (response.success) {
                currentRoom = response.roomCode;
                isHost = true;
                showLobbyWindow(response.roomCode, settings.maxPlayers);
            }
            else {
                alert('Ошибка при создании комнаты: ' + response.message);
            }
        });
    }

    function joinRoom(roomCode) {
        document.getElementById('lobby-window').style.display = 'flex';
        document.querySelector('.loading-animation').style.display = 'flex';
        document.querySelector('.room-info').style.display = 'none';

        socket.emit('joinRoom', roomCode, localStorage.getItem('username') || 'Игрок', (response) => {
            if (response.success) {
                currentRoom = roomCode;
                isHost = false;
                showLobbyWindow(roomCode, response.maxPlayers, response.players);

                // Обновляем UI лобби
                document.querySelector('.loading-animation').style.display = 'none';
                document.querySelector('.room-info').style.display = 'block';
            }
            else {
                alert('Ошибка подключения: ' + response.message);
                document.getElementById('lobby-window').style.display = 'none';
            }
        });
    }

    function showLobbyWindow(roomCode, maxPlayers, players = []) {
        const lobbyWindow = document.getElementById('lobby-window');
        const loadingAnimation = document.querySelector('.loading-animation');
        const roomInfo = document.querySelector('.room-info');
        const playerSlots = document.querySelector('.player-slots');
        const readyBtn = document.querySelector('.ready-btn');
        const startBtn = document.querySelector('.start-game-btn');

        const blockNames = {
            bool: 'Булевы функции',
            graphs: 'Графы',
            all: 'Все уровни'
        };

        const blockInfo = document.createElement('p');
        blockInfo.textContent = `Блок: ${blockNames[selectedBlock]}`;
        blockInfo.className = 'block-info';
        blockInfo.style.color = '#ffcc80';
        blockInfo.style.margin = '10px 0';
        blockInfo.style.textAlign = 'center';

        // Вставляем после кода комнаты
        document.querySelector('.room-code').after(blockInfo);

        // Заполняем информацию о комнате
        document.querySelector('.room-code').textContent = roomCode;

        loadingAnimation.style.display = 'none';
        roomInfo.style.display = 'block';

        // Создаем слоты для игроков
        playerSlots.innerHTML = '';
        for (let i = 0; i < maxPlayers; i++) {
            const slot = document.createElement('div');
            slot.className = 'player-slot';
            slot.innerHTML = `
                    <div class="player-avatar">${i + 1}</div>
                    <div class="player-name">Свободно</div>
                    <div class="player-status">Ожидание...</div>
                `;
            playerSlots.appendChild(slot);
        }

        // Заполняем слоты подключенными игроками
        players.forEach((player, index) => {
            updatePlayerSlot(index, player.username, player.ready);
        });

        // Настройка кнопок в зависимости от роли (хост/участник)
        if (isHost) {
            readyBtn.style.display = 'block';
            readyBtn.textContent = playerReady ? 'Отменить готовность' : 'Я готов!';
            readyBtn.disabled = false; // Всегда активна для хоста (ВОТ ВООБЩЕ НЕ УДАЛЯТЬ)
            startBtn.style.display = 'block';
            startBtn.disabled = !playerReady;
        }
        else {
            readyBtn.style.display = 'block';
            readyBtn.textContent = playerReady ? 'Отменить готовность' : 'Я готов!';
            readyBtn.disabled = false; // Активируем сразу для всех
            startBtn.style.display = 'none';
        }

        startBtn.addEventListener('click', function () {
            socket.emit('startGame', roomCode, (response) => {
                if (response.success) {
                    console.log('Игра начата');
                }
                else {
                    alert('Ошибка: ' + response.message);
                }
            });
        })

        lobbyWindow.style.display = 'flex';
    }

    function updatePlayerSlot(index, username, isReady) {
        const slots = document.querySelectorAll('.player-slot');
        if (index >= slots.length) return;

        const slot = slots[index];
        slot.classList.add('filled');
        slot.querySelector('.player-name').textContent = username;

        if (isReady) {
            slot.classList.add('ready');
            slot.querySelector('.player-status').textContent = 'Готов';
        }
        else {
            slot.classList.remove('ready');
            slot.querySelector('.player-status').textContent = 'Подключен';
        }
    }

    document.getElementById('create-room-btn').addEventListener('click', () => {
        const settings = {
            maxPlayers: parseInt(document.getElementById('max-players').value),
            selectedBlock: document.getElementById('game-mode').value,
            levels: parseInt(document.getElementById('levels-count').value),
            block: selectedBlock,          
        };

        document.getElementById('lobby-window').style.display = 'flex';
        document.querySelector('.loading-animation').style.display = 'flex';
        document.querySelector('.room-info').style.display = 'none';

        createRoom(settings);
    });

    document.getElementById('join-room-btn').addEventListener('click', () => {
        const roomCode = document.getElementById('room-code').value;
        if (!/^\d{5}$/.test(roomCode)) {
            alert('Код комнаты должен состоять из 5 цифр!');
            return;
        }

        document.getElementById('lobby-window').style.display = 'flex';
        document.querySelector('.loading-animation').style.display = 'flex';
        document.querySelector('.room-info').style.display = 'none';

        joinRoom(roomCode);
    });

    // Обработчик кнопки готовности
    document.querySelector('.ready-btn').addEventListener('click', function () {
        if (!currentRoom) return;

        playerReady = !playerReady;
        socket.emit('setReady', playerReady);

        this.textContent = playerReady ? 'Отменить готовность' : 'Я готов!';
        this.classList.toggle('active', playerReady);

        if (isHost) {
            document.querySelector('.start-game-btn').disabled = !playerReady;
        }
    });

    // Обработчик закрытия лобби
    document.querySelector('.close-lobby-btn').addEventListener('click', function () {
        socket.emit('leaveRoom');
        document.getElementById('lobby-window').style.display = 'none';
        currentRoom = null;
        isHost = false;
        playerReady = false;
    });

    // Socket.IO обработчики событий
    socket.on('playerJoined', (playerData) => {
        updatePlayerSlot(playerData.index, playerData.username, false);
    });

    socket.on('playerLeft', (index) => {
        const slots = document.querySelectorAll('.player-slot');
        if (index >= slots.length) return;

        const slot = slots[index];
        slot.classList.remove('filled', 'ready');
        slot.querySelector('.player-name').textContent = 'Свободно';
        slot.querySelector('.player-status').textContent = 'Ожидание...';
    });

    socket.on('playerReadyChanged', (index, isReady) => {
        updatePlayerSlot(index, null, isReady);
    });

    socket.on('allPlayersReady', () => {
        if (isHost) {
            document.querySelector('.start-game-btn').disabled = !allReady;
        }
    });

    socket.on('gameStarting', (data) => {
        localStorage.setItem('currentTask', JSON.stringify(data.task));
        window.location.href = `mlevel/mlevel${data.level}.html?room=${currentRoom}&mode=multiplayer`;
    });

    socket.on('roomError', (message) => {
        alert(message);
        document.getElementById('lobby-window').style.display = 'none';
    });

    function setupMultiplayerTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                document.getElementById(`${tab.dataset.tab}-tab`).style.display = 'block';
            });
        });

        document.querySelectorAll('.block-option').forEach(option => {
            option.addEventListener('click', function () {
                document.querySelectorAll('.block-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                selectedBlock = this.dataset.block; // Обновляем значение
            });
        });
        document.querySelector('.block-option[data-block="all"]').classList.add('selected');
    }

    document.getElementById('fab-multiplayer').onclick = () => {
        openSlideWindow('multiplayer-window');
        setupMultiplayerTabs();
    };
});
