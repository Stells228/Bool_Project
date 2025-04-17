document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        variableSelect: document.getElementById('variable-select'),
        functionVector: document.getElementById('function-vector'),
        truthTableContainer: document.getElementById('truth-table-container'),
        cnfInput: document.getElementById('cnf-input'),
        submitBtn: document.getElementById('submit-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        feedback: document.getElementById('feedback'),
        backToLevelMenuBtn: document.getElementById('back-to-level-menu'),
        prevLevelBtn: document.getElementById('prev-level'),
        nextLevelBtn: document.getElementById('next-level'),
        deleteBtn: document.getElementById('delete-btn'),
        rightPanel: document.querySelector('.right-panel'),
        levelContainer: document.querySelector('.level-container'),
        inputContainer: document.querySelector('.input-container') // Adjust if needed
    };

    let n = 0;
    let currentFunctionVector = '';
    let correctCNF = '';
    let completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    let competitionScores = JSON.parse(localStorage.getItem('competitionScores')) || {};
    let hasWon = false;
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('mode') || 'normal';

    if (gameMode === 'passing') {
        elements.nextLevelBtn.disabled = !completedLevels.includes(4);
        elements.nextLevelBtn.style.opacity = completedLevels.includes(4) ? '1' : '0.5';
        elements.nextLevelBtn.style.cursor = completedLevels.includes(4) ? 'pointer' : 'not-allowed';
        elements.prevLevelBtn.disabled = false;
    } else if (gameMode === 'competition') {
        elements.nextLevelBtn.disabled = false;
        elements.nextLevelBtn.style.opacity = '1';
        elements.nextLevelBtn.style.cursor = 'pointer';
        addScoreDisplay();
    }

    function addScoreDisplay() {
        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';
        scoreDisplay.textContent = `Счёт: ${competitionScores[4] || 0}`;
        elements.rightPanel.insertBefore(scoreDisplay, elements.inputContainer);
    }

    function updateScore(points) {
        const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
        let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
        if (!allPlayersData[currentPlayer]) allPlayersData[currentPlayer] = { scores: {} };
        allPlayersData[currentPlayer].scores[4] = {
            points: (allPlayersData[currentPlayer].scores[4]?.points || 0) + points,
        };
        localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        if (gameMode === 'competition') {
            document.getElementById('score-display').textContent = `Счёт: ${allPlayersData[currentPlayer].scores[4].points}`;
        }
        window.parent.postMessage({ type: 'updateScore', level: 4, points }, '*');
    }

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

    elements.variableSelect.addEventListener('change', () => {
        n = parseInt(elements.variableSelect.value);
        if (!n) return;
        generateNewVector();
        resetUI();
    });

    function generateNewVector() {
        currentFunctionVector = '';
        for (let i = 0; i < 2 ** n; i++) {
            currentFunctionVector += Math.floor(Math.random() * 2);
        }
        elements.functionVector.textContent = `Вектор функции: ${currentFunctionVector}`;
        correctCNF = getCNF(currentFunctionVector);
        generateTruthTable(n, currentFunctionVector);
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
        elements.truthTableContainer.innerHTML = '';
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
        elements.truthTableContainer.appendChild(table);
    }

    function normalizeCNF(cnf) {
        return (cnf === '0' || cnf === '1') ? cnf : cnf.replace(/\s+/g, '').replace(/∨/g, '∨').replace(/∧/g, '∧');
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

    function resetUI() {
        elements.cnfInput.value = '';
        elements.feedback.classList.remove('show', 'correct', 'incorrect', 'error');
        elements.submitBtn.style.display = 'inline-block';
        elements.submitBtn.disabled = false;
        elements.submitBtn.style.opacity = '1';
        elements.submitBtn.style.cursor = 'pointer';
        elements.tryAgainBtn.style.display = 'none';
        elements.tryAgainBtn.disabled = false;
        elements.tryAgainBtn.style.opacity = '1';
        elements.tryAgainBtn.style.cursor = 'pointer';
        elements.deleteBtn.disabled = false;
        elements.deleteBtn.style.opacity = '1';
        elements.deleteBtn.style.cursor = 'pointer';
        elements.variableSelect.disabled = false;
        elements.variableSelect.style.opacity = '1';
        elements.variableSelect.style.cursor = 'pointer';
        document.querySelectorAll('.symbol-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        elements.cnfInput.disabled = false;
        elements.cnfInput.style.opacity = '1';
        elements.cnfInput.style.cursor = 'text';
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type} show`;
        elements.submitBtn.style.display = 'none';
        elements.tryAgainBtn.style.display = 'inline-block';
        if (gameMode === 'competition') {
            if (type === 'correct') {
                updateScore(10);
            } else if (type === 'incorrect') {
                updateScore(-10);
            }
        } else if (type === 'correct' && gameMode === 'passing' && !hasWon) {
            hasWon = true;
            if (!completedLevels.includes(4)) {
                completedLevels.push(4);
                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                window.parent.postMessage({ type: 'levelCompleted', level: 4 }, '*');
            }
        }
        if (type === 'correct' && gameMode === 'competition') {
            window.parent.postMessage({ 
                type: 'updateScore',
                level: 4,
                points: 10,
            }, '*');
        } else if (type === 'incorrect' && gameMode === 'competition') {
            window.parent.postMessage({ 
                type: 'updateScore',
                level: 4,
                points: -10,
            }, '*');
        }
    }

    elements.submitBtn.addEventListener('click', () => {
        if (!n) {
            showFeedback('Пожалуйста, выберите кол-во переменных', 'error');
            return;
        }
        const userCNF = elements.cnfInput.value.trim();
        const validation = validateCNFInput(userCNF, n);
        if (!validation.valid) {
            showFeedback(validation.message, 'error');
            return;
        }
        if (validation.isZero) {
            if (currentFunctionVector === '0'.repeat(2 ** n)) showFeedback('Правильно! Так держать!', 'correct');
            else showFeedback(`Неправильно. КНФ: ${correctCNF}`, 'incorrect');
            return;
        }
        if (validation.isOne) {
            if (currentFunctionVector === '1'.repeat(2 ** n)) showFeedback('Правильно! Так держать!', 'correct');
            else showFeedback(`Неправильно. КНФ: ${correctCNF}`, 'incorrect');
            return;
        }
        const userVector = computeVectorFromCNF(userCNF, n);
        if (userVector === currentFunctionVector) showFeedback('Правильно! Так держать!', 'correct');
        else showFeedback(`Неправильно. КНФ: ${correctCNF}`, 'incorrect');
    });

    elements.tryAgainBtn.addEventListener('click', () => {
        if (n) {
            generateNewVector();
            resetUI();
            hasWon = completedLevels.includes(4);
        }
    });

    elements.backToLevelMenuBtn.addEventListener('click', () => {
        window.location.href = `../map.html?mode=${gameMode}`;
    });

    elements.prevLevelBtn.addEventListener('click', () => {
        if (!elements.prevLevelBtn.disabled) {
            window.location.href = `level3.html?mode=${gameMode}`;
        }
    });

    elements.nextLevelBtn.addEventListener('click', () => {
        if (!elements.nextLevelBtn.disabled) {
            window.location.href = `level5.html?mode=${gameMode}`;
        }
    });
});
