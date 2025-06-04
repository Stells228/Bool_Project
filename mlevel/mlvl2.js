document.addEventListener('DOMContentLoaded', () => {
    let n = 2;
    let currentFunctionVector = '';
    let correctDummyVars = '';
    let correctEssentialVars = '';
    let socket = null;
    let isMultiplayer = false;
    let roomCode = '';
    let hasAnswered = false;

    const params = new URLSearchParams(window.location.search);
    isMultiplayer = params.get('mode') === 'multiplayer';
    roomCode = params.get('room');

    if (isMultiplayer) {
        socket = io('http://localhost:3000');
        const task = JSON.parse(localStorage.getItem('currentTask'));
        if (task) {
            currentFunctionVector = task.vector;
            correctDummyVars = task.correctAnswer.dummy;
            correctEssentialVars = task.correctAnswer.essential;
            n = task.variablesCount || 2;
            updateUI();
        }
        document.getElementById('submit-btn').textContent = 'Готов';
    }

    // В мультиплеерном режиме
    if (isMultiplayer) {
        socket.on('showResults', (results) => {
            // Перенаправляем на страницу результатов
            window.location.href = `../results.html?room=${roomCode}`;
        });

        // Таймер для отображения оставшегося времени
        socket.on('timeUpdate', (timeLeft) => {
            if (timeLeft <= 10) {
                showFeedback(`Осталось ${timeLeft} секунд!`, 'error');
            }
        });
    }

    function updateUI() {
        if (!currentFunctionVector || !n) {
            console.error('Недостаточно данных для отображения');
            return;
        }
        document.getElementById('function-vector').textContent =
            `Вектор функции: ${currentFunctionVector}`;
        generateTruthTable();
    }

    function generateTruthTable() {
        const table = document.createElement('table');
        table.className = 'truth-table';

        const headerRow = document.createElement('tr');
        for (let i = 1; i <= n; i++) {
            const th = document.createElement('th');
            th.textContent = `x${i}`;
            headerRow.appendChild(th);
        }
        const th = document.createElement('th');
        th.textContent = 'f(x)';
        headerRow.appendChild(th);
        table.appendChild(headerRow);

        for (let i = 0; i < 2 ** n; i++) {
            const row = document.createElement('tr');
            const binary = i.toString(2).padStart(n, '0');
            for (let j = 0; j < n; j++) {
                const td = document.createElement('td');
                td.textContent = binary[j];
                row.appendChild(td);
            }
            const td = document.createElement('td');
            td.textContent = currentFunctionVector[i];
            row.appendChild(td);
            table.appendChild(row);
        }

        const container = document.getElementById('truth-table-container');
        container.innerHTML = '';
        container.appendChild(table);
    }

    function validateVariableInput(input, n, type) {
        if (!input) return { valid: true, indices: [] };
        if (!/^\d+$/.test(input)) return { valid: false, message: `Пожалуйста, введите только цифры для ${type} переменных` };
        const indices = input.split('').map(Number);
        for (let idx of indices) {
            if (idx < 1 || idx > n) return { valid: false, message: `Индексы для ${type} переменных должны быть в диапазоне от 1 до ${n}.` };
        }
        const uniqueIndices = new Set(indices);
        if (uniqueIndices.size !== indices.length) return { valid: false, message: `Дублирующиеся индексы не допускаются для ${type} переменных.` };
        return { valid: true, indices };
    }

    function showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;
        feedback.style.display = 'block';
    }

    if (!isMultiplayer) {
        n = 2 + Math.floor(Math.random() * 2);
        currentFunctionVector = Array.from({ length: 2 ** n }, () =>
            Math.floor(Math.random() * 2)).join('');

        const result = findDummyAndEssentialVariables(currentFunctionVector, n);
        correctDummyVars = result.dummy;
        correctEssentialVars = result.essential;

        updateUI();
    }

    // Обработка кнопки "Готов"
    document.getElementById('submit-btn').addEventListener('click', () => {
        if (hasAnswered) return;

        const dummyInput = document.getElementById('dummy-input').value.trim();
        const essentialInput = document.getElementById('essential-input').value.trim();

        if (!dummyInput && !essentialInput) {
            showFeedback('Пожалуйста, введите переменные!', 'error');
            return;
        }

        const dummyValidation = validateVariableInput(dummyInput, n, 'фиктивных');
        if (!dummyValidation.valid) {
            showFeedback(dummyValidation.message, 'error');
            return;
        }

        const essentialValidation = validateVariableInput(essentialInput, n, 'существенных');
        if (!essentialValidation.valid) {
            showFeedback(essentialValidation.message, 'error');
            return;
        }

        const dummyIndices = dummyValidation.indices;
        const essentialIndices = essentialValidation.indices;

        if (isMultiplayer) {
            hasAnswered = true;
            document.getElementById('submit-btn').disabled = true;

            socket.emit('playerAnswer', {
                room: roomCode,
                answer: {
                    dummy: dummyIndices.sort().join(''),
                    essential: essentialIndices.sort().join('')
                },
                timestamp: Date.now(),
                correctAnswer: {
                    dummy: correctDummyVars,
                    essential: correctEssentialVars
                }
            });

            showFeedback('Ответ отправлен! Ожидаем других игроков...', 'info');
        } 
        else {
            const userDummy = dummyIndices.sort().join('');
            const userEssential = essentialIndices.sort().join('');
            const isCorrect = userDummy === correctDummyVars && userEssential === correctEssentialVars;

            showFeedback(
                isCorrect ? 'Правильно!' : 'Неправильно!',
                isCorrect ? 'correct' : 'incorrect'
            );
        }
    });

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
});