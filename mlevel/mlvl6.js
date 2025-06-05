document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        functionVectors: document.getElementById('function-vectors'),
        isCompleteYes: document.getElementById('is-complete-yes'),
        isCompleteNo: document.getElementById('is-complete-no'),
        closedClasses: document.getElementById('closed-classes'),
        submitBtn: document.getElementById('submit-btn'),
        feedback: document.getElementById('feedback')
    };

    let vectors = [];
    let correctClosedClasses = '';
    let isMultiplayer = false;
    let socket = null;
    let roomCode = '';
    let hasAnswered = false;
    let correctAnswer = {};


    // Обеспечиваем взаимное исключение для радио-подобных чекбоксов
    elements.isCompleteYes.addEventListener('change', () => {
        if (elements.isCompleteYes.checked) elements.isCompleteNo.checked = false;
    });
    elements.isCompleteNo.addEventListener('change', () => {
        if (elements.isCompleteNo.checked) elements.isCompleteYes.checked = false;
    });

    // Генерация случайного булевого вектора длины 2^(2..3)
    function genVector() {
        const length = 2 ** (2 + Math.floor(Math.random() * 2)); // 4 или 8
        let vector = '';
        for (let j = 0; j < length; j++) {
            vector += Math.floor(Math.random() * 2);
        }
        return vector;
    }

    // Подсчет принадлежности функции к классам (возвращает строку из 5 символов '0' или '1')
    function poln(vector) {
        return (
            T0(vector) +
            T1(vector) +
            S(vector) +
            M(vector) +
            L(vector)
        );
    }

    // Класс T0: функция равна 0 на всех нулях
    function T0(vector) {
        return vector[0] === '0' ? 1 : 0;
    }

    // Класс T1: функция равна 1 на всех единицах
    function T1(vector) {
        return vector[vector.length - 1] === '1' ? 1 : 0;
    }

    // Класс S: самодвойственная функция
    function S(vector) {
        const len = vector.length;
        for (let i = 0; i <= len / 2 - 1; i++) {
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

    // Проверка частичного порядка: i <= j по битам
    function isLessOrEqual(i, j, vars) {
        for (let k = 0; k < vars; k++) {
            const bitI = (i >> k) & 1;
            const bitJ = (j >> k) & 1;
            if (bitI > bitJ) return false;
        }
        return true;
    }

    // Класс L: линейная функция
    function L(vector) {
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

    // Генерация набора векторов функций и вычисление правильного ответа
    function generateVectorSet() {
        correctAnswer = {
            isComplete: correctClosedClasses === '',
            closedClasses: correctClosedClasses
        };

        const count = 2 + Math.floor(Math.random() * 2); // 2 или 3 функций
        vectors = [];
        const classMembership = [];

        for (let i = 0; i < count; i++) {
            const v = genVector();
            vectors.push(v);
            classMembership.push(poln(v));
        }

        // Замена индексов на символы классов: T0, T1, S, M, L
        const classSymbols = ['T0', 'T1', 'S', 'M', 'L'];
        correctClosedClasses = '';

        for (let i = 0; i < 5; i++) {
            let sum = 0;
            for (let j = 0; j < count; j++) {
                sum += parseInt(classMembership[j][i], 10);
            }
            if (sum === count) {
                correctClosedClasses += classSymbols[i];
            }
        }

        // Отобразить функции на странице
        elements.functionVectors.innerHTML = vectors
            .map((v, i) => `f${i + 1}: ${v}`)
            .join('<br>');
    }

    // Проверка ответа пользователя
    function validateAnswer() {
        if (hasAnswered) return;
    
        const userIsCompleteYes = elements.isCompleteYes.checked;
        const userIsCompleteNo = elements.isCompleteNo.checked;
        const userClosedClasses = elements.closedClasses.value.trim().toUpperCase();
        const isComplete = correctAnswer.closedClasses === '';
    
        if (!userIsCompleteYes && !userIsCompleteNo) {
            return showFeedback('Ошибка! Выберите "Да" или "Нет".', 'error');
        }
        if (userIsCompleteYes && userIsCompleteNo) {
            return showFeedback('Ошибка! Выберите только один вариант.', 'error');
        }
        if (userIsCompleteNo && !userClosedClasses) {
            return showFeedback('Ошибка! Укажите замкнутый класс.', 'error');
        }
    
        const userAnswer = {
            isComplete: userIsCompleteYes,
            closedClasses: userClosedClasses
        };
    
        if (isMultiplayer) {
            hasAnswered = true;
            elements.submitBtn.disabled = true;
            elements.submitBtn.style.opacity = '0.5';
            elements.submitBtn.style.cursor = 'not-allowed';
    
            socket.emit('playerAnswer', {
                room: roomCode,
                answer: userAnswer,
                timestamp: Date.now(),
                correctAnswer: correctAnswer
            });
    
            showFeedback('Ответ отправлен! Ожидаем других игроков...', 'info');
        } 
        else {
            if (userIsCompleteYes) {
                if (isComplete) {
                    showFeedback('Правильно!', 'correct');
                } else {
                    showFeedback('Неправильно!', 'incorrect');
                }
            } 
            else {
                if (isComplete) {
                    showFeedback('Неправильно!', 'incorrect');
                } else if (userClosedClasses === correctAnswer.closedClasses) {
                    showFeedback('Правильно!', 'correct');
                } else {
                    showFeedback('Неправильно!', 'incorrect');
                }
            }
        }
    }

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
    generateVectorSet();

    const params = new URLSearchParams(window.location.search);
    isMultiplayer = params.get('mode') === 'multiplayer';
    roomCode = params.get('room');

    if (isMultiplayer) {
        socket = io('http://localhost:3000');
        const task = JSON.parse(localStorage.getItem('currentTask'));
        if (task) {
            vectors = task.vectors;
            correctAnswer = task.correctAnswer;

            elements.functionVectors.innerHTML = vectors
                .map((v, i) => `f${i + 1}: ${v}`)
                .join('<br>');
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

    elements.submitBtn.addEventListener('click', validateAnswer);
});