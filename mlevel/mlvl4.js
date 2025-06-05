document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        functionVector: document.getElementById('function-vector'),
        truthTableContainer: document.getElementById('truth-table-container'),
        cnfInput: document.getElementById('cnf-input'),
        submitBtn: document.getElementById('submit-btn'),
        feedback: document.getElementById('feedback'),
        deleteBtn: document.getElementById('delete-btn')
    };

    let n = 2 + Math.floor(Math.random() * 3); // 2-4 переменные
    let currentFunctionVector = '';
    let correctCNF = '';
    let socket = null;
    let isMultiplayer = false;
    let roomCode = '';
    let hasAnswered = false;

    const params = new URLSearchParams(window.location.search);
    isMultiplayer = params.get('mode') === 'multiplayer';
    roomCode = params.get('room');

    if (isMultiplayer) {
        socket = io('https://lichinkis.ru/');
        const task = JSON.parse(localStorage.getItem('currentTask'));
        if (task) {
            currentFunctionVector = task.vector;
            correctCNF = task.correctAnswer;
            n = task.variablesCount || 2;
            updateUI();
        }
        document.getElementById('submit-btn').textContent = 'Готов';
    }

    if (isMultiplayer) {
        socket.on('showResults', (results) => {
            window.location.href = `../results.html?room=${roomCode}`;
        });

        socket.on('timeUpdate', (timeLeft) => {
            if (timeLeft <= 10) {
                showFeedback(`Осталось ${timeLeft} секунд!`, 'error');
            }
        });
    }

    function updateUI() {
        elements.functionVector.textContent = `Вектор функции (${n} переменных): ${currentFunctionVector}`;
        generateTruthTable(n, currentFunctionVector);
    }


    function insertSymbol(symbol) {
        const input = elements.cnfInput;
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        const currentValue = input.value;

        input.value = currentValue.substring(0, startPos) + symbol + currentValue.substring(endPos);
        const newPos = startPos + symbol.length;
        input.setSelectionRange(newPos, newPos);
        input.focus();
    }

    function generateNewVector() {
        if (!isMultiplayer) {
            currentFunctionVector = '';
            for (let i = 0; i < 2 ** n; i++) {
                currentFunctionVector += Math.floor(Math.random() * 2);
            }
            correctCNF = getCNF(currentFunctionVector);
        }
        updateUI();
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

    function generateTruthTable(n, vector) {
        const fragment = document.createDocumentFragment();
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
            td.textContent = vector[i];
            row.appendChild(td);
            table.appendChild(row);
        }

        elements.truthTableContainer.innerHTML = '';
        elements.truthTableContainer.appendChild(table);
    }

    function validateCNFInput(input, n) {
        const trimmedInput = input.trim();
        if (!trimmedInput) return { valid: false, message: 'Пожалуйста, введите КНФ' };
        if (trimmedInput === '0') return { valid: true, isZero: true, isOne: false };
        if (trimmedInput === '1') return { valid: true, isZero: false, isOne: true };
        const termPattern = /\([^()]+?\)/g;
        const terms = trimmedInput.match(termPattern);
        if (!terms) return { valid: false, message: 'КНФ должна включать термы как (¬x1 ∨ x2), объединённые ∧' };
        const withoutTerms = trimmedInput.replace(termPattern, '').replace(/\s+/g, '');
        const expectedJoins = '∧'.repeat(terms.length - 1);
        if (withoutTerms !== expectedJoins) return { valid: false, message: 'Термы должны быть объединены ∧, например, (¬x1 ∨ x2) ∧ (x1 ∨ ¬x2)' };
        for (let term of terms) {
            const content = term.slice(1, -1).replace(/\s+/g, '');
            const literals = content.split('∨');
            if (literals.length !== n) return { valid: false, message: `Каждый терм должен содержать ровно ${n} переменных` };
            for (let literal of literals) {
                if (!literal.match(/^(¬?x[1-4])$/)) return { valid: false, message: 'Значения должны иметь вид x1, ¬x1, и тд, с переменными от x1 до x' + n };
                const varNum = parseInt(literal.replace(/¬?x/, ''));
                if (varNum < 1 || varNum > n) return { valid: false, message: 'Переменные должны быть между x1 и x' + n };
            }
            const varNames = literals.map(lit => lit.replace('¬', ''));
            const uniqueVars = new Set(varNames);
            if (uniqueVars.size !== literals.length) return { valid: false, message: 'Каждый терм должен содержать каждую переменную ровно один раз' };
        }
        return { valid: true, isZero: false, isOne: false };
    }

    function computeVectorFromCNF(cnf, n) {
        if (cnf === '0') return '0'.repeat(2 ** n);
        if (cnf === '1') return '1'.repeat(2 ** n);
        const terms = cnf.match(/\([^()]+?\)/g).map(term => term.slice(1, -1).replace(/\s+/g, ''));
        let vector = Array(2 ** n).fill('1');
        for (let i = 0; i < 2 ** n; i++) {
            const binary = i.toString(2).padStart(n, '0');
            for (let term of terms) {
                const literals = term.split('∨');
                let termValue = false;
                for (let j = 0; j < literals.length; j++) {
                    const literal = literals[j];
                    const isNegated = literal.startsWith('¬');
                    const varNum = parseInt(literal.replace(/¬?x/, '')) - 1;
                    const varValue = binary[varNum] === '1';
                    if (isNegated && !varValue) { termValue = true; break; }
                    if (!isNegated && varValue) { termValue = true; break; }
                }
                if (!termValue) {
                    vector[i] = '0';
                    break;
                }
            }
        }
        return vector.join('');
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type}`;
        elements.feedback.style.display = 'block';
    }

    // Обработчики событий
    document.querySelectorAll('.symbol-btn').forEach(button => {
        button.addEventListener('click', () => {
            const symbol = button.dataset.symbol;
            if (symbol) insertSymbol(symbol);
        });
    });

    elements.deleteBtn.addEventListener('click', () => {
        const currentValue = elements.cnfInput.value;
        elements.cnfInput.value = currentValue.slice(0, -1);
        elements.cnfInput.focus();
    });

    elements.submitBtn.addEventListener('click', () => {
        if (hasAnswered) return;

        const userCNF = elements.cnfInput.value.trim();

        if (!userCNF) {
            showFeedback('Пожалуйста, введите КНФ!', 'error');
            return;
        }

        const validation = validateCNFInput(userCNF, n);
        if (!validation.valid) {
            showFeedback(validation.message, 'error');
            return;
        }

        if (validation.isZero) {
            if (isMultiplayer) {
                sendAnswer('0'); 
            } 
            else {
                if (currentFunctionVector === '0'.repeat(2 ** n)) {
                    showFeedback('Правильно!', 'correct');
                } 
                else {
                    showFeedback('Неправильно!', 'incorrect');
                }
            }
            return;
        }

        if (validation.isOne) {
            if (isMultiplayer) {
                sendAnswer('1'); 
            } 
            else {
                if (currentFunctionVector === '1'.repeat(2 ** n)) {
                    showFeedback('Правильно!', 'correct');
                } 
                else {
                    showFeedback('Неправильно!', 'incorrect');
                }
            }
            return;
        }

        const userVector = computeVectorFromCNF(userCNF, n);
        if (isMultiplayer) {
            sendAnswer(userCNF); 
        } 
        else {
            if (userVector === currentFunctionVector) {
                showFeedback('Правильно!', 'correct');
            } 
            else {
                showFeedback('Неправильно!', 'incorrect');
            }
        }
    });

    function sendAnswer(answer) {
        hasAnswered = true;
        elements.submitBtn.disabled = true;
        elements.submitBtn.style.opacity = '0.5';
        elements.submitBtn.style.cursor = 'not-allowed';
    
        socket.emit('playerAnswer', {
            room: roomCode,
            answer: answer,
            timestamp: Date.now(),
            correctAnswer: correctCNF
        });
    
        showFeedback('Ответ отправлен! Ожидаем других игроков...', 'info');
    }

    generateNewVector();
});