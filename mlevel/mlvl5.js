document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        functionVector: document.getElementById('function-vector'),
        truthTableContainer: document.getElementById('truth-table-container'),
        submitBtn: document.getElementById('submit-btn'),
        feedback: document.getElementById('feedback')
    };

    let n = 2 + Math.floor(Math.random() * 3); // 2-4 переменные
    let vector = '';
    let correctClasses = {};
    let isMultiplayer = false;
    let socket = null;
    let roomCode = '';
    let hasAnswered = false;


    const classCheckboxes = {
        T0: document.createElement('input'),
        T1: document.createElement('input'),
        S: document.createElement('input'),
        M: document.createElement('input'),
        L: document.createElement('input')
    };

    function generateNewVector() {
        vector = Array.from({ length: 2 ** n }, () => Math.floor(Math.random() * 2)).join('');
        elements.functionVector.textContent = `Вектор функции (${n} переменных): ${vector}`;
        correctClasses = computeClasses(vector);
        generateTruthTable(n, vector);
    }

    // Вычисление принадлежности функции к классам
    function computeClasses(vector) {
        return {
            T0: T0(vector),
            T1: T1(vector),
            S: S(vector),
            M: M(vector),
            L: L(vector)
        };
    }

    // Класс T0: функция обращается в 0 при всех 0 на входе
    function T0(vector) {
        return vector[0] === '0' ? 1 : 0;
    }

    // Класс T1: функция обращается в 1 при всех 1 на входе
    function T1(vector) {
        return vector[vector.length - 1] === '1' ? 1 : 0;
    }

    // Класс S: самодвойственная функция (f(x) = ¬f(¬x))
    function S(vector) {
        const len = vector.length;
        for (let i = 0; i < len / 2; i++) {
            if (vector[i] === vector[len - 1 - i]) return 0;
        }
        return 1;
    }

    // Класс M: монотонная функция
    function M(vector) {
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

    // Проверка частичного порядка по битам (i <= j)
    function isLessOrEqual(i, j, vars) {
        for (let k = 0; k < vars; k++) {
            const bitI = (i >> k) & 1;
            const bitJ = (j >> k) & 1;
            if (bitI > bitJ) return false;
        }
        return true;
    }

    // Класс L: линейная функция
    const memoL = new Map();
    function L(vector) {
        if (memoL.has(vector)) return memoL.get(vector);

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
            if (match) {
                memoL.set(vector, 1);
                return 1;
            }
        }
        memoL.set(vector, 0);
        return 0;
    }

    // Создание и отображение чекбоксов
    function setupCheckboxes(checkboxes) {
        const container = document.createElement('div');
        container.className = 'class-select-container';

        for (const [key, input] of Object.entries(checkboxes)) {
            input.type = 'checkbox';
            input.id = key;
            input.className = 'class-checkbox';

            const label = document.createElement('label');
            label.htmlFor = key;
            label.textContent = key;
            label.className = 'class-label';

            container.appendChild(input);
            container.appendChild(label);
        }

        document.querySelector('.right-panel').insertBefore(container, elements.submitBtn.parentElement);
    }

    const params = new URLSearchParams(window.location.search);
isMultiplayer = params.get('mode') === 'multiplayer';
roomCode = params.get('room');

if (isMultiplayer) {
    socket = io('http://localhost:3000');
    const task = JSON.parse(localStorage.getItem('currentTask'));
    if (task) {
        vector = task.vector;
        correctClasses = task.correctAnswer;
        n = task.variablesCount;
        elements.functionVector.textContent = `Вектор функции (${n} переменных): ${vector}`;
        generateTruthTable(n, vector);
    }

    document.getElementById('submit-btn').textContent = 'Готов';

    socket.on('showResults', (results) => {
        window.location.href = `../results.html?room=${roomCode}`;
    });

    socket.on('timeUpdate', (timeLeft) => {
        if (timeLeft <= 10) {
            showFeedback(`Осталось ${timeLeft} секунд!`, 'error');
        }
    });
}

    // Генерация таблицы истинности
    function generateTruthTable(n, vector) {
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

        // Строки таблицы
        for (let i = 0; i < 2 ** n; i++) {
            const row = document.createElement('tr');
            const binary = i.toString(2).padStart(n, '0');

            for (let j = 0; j < n; j++) {
                const td = document.createElement('td');
                td.textContent = binary[j];
                row.appendChild(td);
            }

            const td = document.createElement('td');
            td.textContent = vector[i];
            row.appendChild(td);

            table.appendChild(row);
        }

        elements.truthTableContainer.innerHTML = '';
        elements.truthTableContainer.appendChild(table);
    }

    // Проверка выбора пользователя
    function validateSelection(checkboxes, correct) {
        let isCorrect = true;

        for (const [key, input] of Object.entries(checkboxes)) {
            const userSelected = input.checked;
            const correctSelection = correct[key] === 1;

            if (userSelected !== correctSelection) {
                isCorrect = false;
                break;
            }
        }

        if (isCorrect) {
            showFeedback('Правильно!', 'correct');
        }
        else {
            showFeedback('Неправильно!', 'incorrect');
        }
    }

    // Отображение сообщения пользователю
    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type}`;
        elements.feedback.style.display = 'block';

        if (type === 'correct') {
            elements.submitBtn.disabled = true;
            elements.submitBtn.style.opacity = '0.5';
            elements.submitBtn.style.cursor = 'not-allowed';
        }
    }
    setupCheckboxes(classCheckboxes);
    generateNewVector();

    elements.submitBtn.addEventListener('click', () => {
        if (hasAnswered) return;
    
        let userAnswer = {};
        for (const [key, input] of Object.entries(classCheckboxes)) {
            userAnswer[key] = input.checked ? 1 : 0;
        }
    
        if (isMultiplayer) {
            hasAnswered = true;
            elements.submitBtn.disabled = true;
            elements.submitBtn.style.opacity = '0.5';
            elements.submitBtn.style.cursor = 'not-allowed';
    
            socket.emit('playerAnswer', {
                room: roomCode,
                answer: userAnswer,
                timestamp: Date.now(),
                correctAnswer: correctClasses
            });
    
            showFeedback('Ответ отправлен! Ожидаем других игроков...', 'info');
        } 
        else {
            validateSelection(classCheckboxes, correctClasses);
        }
    });
});