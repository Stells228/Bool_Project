document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        variableSelect: document.getElementById('variable-select'),
        functionVector: document.getElementById('function-vector'),
        truthTableContainer: document.getElementById('truth-table-container'),
        dnfInput: document.getElementById('dnf-input'),
        submitBtn: document.getElementById('submit-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        feedback: document.getElementById('feedback'),
        backToLevelMenuBtn: document.getElementById('back-to-level-menu'),
        prevLevelBtn: document.getElementById('prev-level'),
        nextLevelBtn: document.getElementById('next-level'),
        deleteBtn: document.getElementById('delete-btn')
    };

    let n = 0;
    let currentFunctionVector = '';
    let correctDNF = '';
    let completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    let hasWon = false;
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('mode') || 'normal';

    if (gameMode === 'passing') {
        elements.nextLevelBtn.disabled = !completedLevels.includes(3);
        elements.nextLevelBtn.style.opacity = completedLevels.includes(3) ? '1' : '0.5';
        elements.nextLevelBtn.style.cursor = completedLevels.includes(3) ? 'pointer' : 'not-allowed';
        elements.prevLevelBtn.disabled = false;
    }

    document.querySelectorAll('.symbol-btn').forEach(button => {
        button.addEventListener('click', () => {
            const symbol = button.dataset.symbol;
            if (symbol) insertSymbol(symbol);
        });
    });

    elements.deleteBtn.addEventListener('click', () => {
        const currentValue = elements.dnfInput.value;
        elements.dnfInput.value = currentValue.slice(0, -1);
        elements.dnfInput.focus();
    });

    function insertSymbol(symbol) {
        const input = elements.dnfInput;
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
        correctDNF = getDNF(currentFunctionVector);
        generateTruthTable(n, currentFunctionVector);
    }

    function getDNF(vector) {
        const n = Math.log2(vector.length);
        if (!Number.isInteger(n)) throw new Error("Длина вектора должна быть степенью двойки.");
        const variables = Array.from({ length: n }, (_, i) => `x${i + 1}`);
        let dnf = '';
        for (let i = 0; i < vector.length; i++) {
            if (vector[i] === '1') {
                const binary = i.toString(2).padStart(n, '0');
                let term = '';
                for (let j = 0; j < n; j++) {
                    term += binary[j] === '0' ? `¬${variables[j]} ∧ ` : `${variables[j]} ∧ `;
                }
                term = term.slice(0, -3);
                dnf += `(${term}) ∨ `;
            }
        }
        return dnf === '' ? '0' : dnf.slice(0, -3);
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

    function normalizeDNF(dnf) {
        return dnf === '0' ? '0' : dnf.replace(/\s+/g, '').replace(/∧/g, '∧').replace(/∨/g, '∨');
    }

    function validateDNFInput(input, n) {
        const trimmedInput = input.trim();
        if (!trimmedInput) return { valid: false, message: 'Пожалуйста, введите ДНФ' };
        if (trimmedInput === '0') return { valid: true, isZero: true };
        const termPattern = /\([^()]+?\)/g;
        const terms = trimmedInput.match(termPattern);
        if (!terms) return { valid: false, message: 'ДНФ должна включать термы, как (¬x1 ∧ x2), объединённые ∨' };
        const withoutTerms = trimmedInput.replace(termPattern, '').replace(/\s+/g, '');
        const expectedJoins = '∨'.repeat(terms.length - 1);
        if (withoutTerms !== expectedJoins) return { valid: false, message: 'Термы должны быть объединены ∨, например, (¬x1 ∧ x2) ∨ (x1 ∧ ¬x2)' };
        for (let term of terms) {
            const content = term.slice(1, -1).replace(/\s+/g, '');
            const literals = content.split('∧');
            if (literals.length !== n) return { valid: false, message: `Каждый терм должен содержать ровно ${n} переменных` };
            for (let literal of literals) {
                if (!literal.match(/^(¬?x[1-4])$/)) return { valid: false, message: 'Значения должны иметь вид x1, ¬x1 и тд, с переменными от x1 до x' + n };
                const varNum = parseInt(literal.replace(/¬?x/, ''));
                if (varNum < 1 || varNum > n) return { valid: false, message: 'Переменные должны быть между x1 и x' + n };
            }
            const varNames = literals.map(lit => lit.replace('¬', ''));
            const uniqueVars = new Set(varNames);
            if (uniqueVars.size !== literals.length) return { valid: false, message: 'Каждый терм должен содержать каждую переменную ровно один раз' };
        }
        return { valid: true, isZero: false };
    }

    function computeVectorFromDNF(dnf, n) {
        if (dnf === '0') return '0'.repeat(2 ** n);
        const terms = dnf.match(/\([^()]+?\)/g).map(term => term.slice(1, -1).replace(/\s+/g, ''));
        let vector = Array(2 ** n).fill('0');
        for (let i = 0; i < 2 ** n; i++) {
            const binary = i.toString(2).padStart(n, '0');
            for (let term of terms) {
                const literals = term.split('∧');
                let termValue = true;
                for (let j = 0; j < literals.length; j++) {
                    const literal = literals[j];
                    const isNegated = literal.startsWith('¬');
                    const varNum = parseInt(literal.replace(/¬?x/, '')) - 1;
                    const varValue = binary[varNum] === '1';
                    if (isNegated && varValue) { termValue = false; break; }
                    if (!isNegated && !varValue) { termValue = false; break; }
                }
                if (termValue) {
                    vector[i] = '1';
                    break;
                }
            }
        }
        return vector.join('');
    }

    function resetUI() {
        elements.dnfInput.value = '';
        elements.feedback.classList.remove('show', 'correct', 'incorrect', 'error');
        elements.submitBtn.style.display = 'inline-block';
        elements.tryAgainBtn.style.display = 'none';
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type} show`;
        elements.submitBtn.style.display = 'none';
        elements.tryAgainBtn.style.display = 'inline-block';
        if (type === 'correct' && gameMode === 'passing' && !hasWon) {
            hasWon = true;
            if (!completedLevels.includes(3)) {
                completedLevels.push(3);
                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                window.parent.postMessage({ type: 'levelCompleted', level: 3 }, '*');
            }
            elements.nextLevelBtn.disabled = false;
            elements.nextLevelBtn.style.opacity = '1';
            elements.nextLevelBtn.style.cursor = 'pointer';
        }
    }

    elements.submitBtn.addEventListener('click', () => {
        if (!n) {
            showFeedback('Пожалуйста, выберите кол-во переменных', 'error');
            return;
        }
        const userDNF = elements.dnfInput.value.trim();
        const validation = validateDNFInput(userDNF, n);
        if (!validation.valid) {
            showFeedback(validation.message, 'error');
            return;
        }
        if (validation.isZero) {
            if (currentFunctionVector === '0'.repeat(2 ** n)) showFeedback('Правильно! Так держать!', 'correct');
            else showFeedback(`Неправильно. ДНФ: ${correctDNF}`, 'incorrect');
            return;
        }
        const userVector = computeVectorFromDNF(userDNF, n);
        if (userVector === currentFunctionVector) showFeedback('Правильно! Так держать!', 'correct');
        else showFeedback(`Неправильно. ДНФ: ${correctDNF}.`, 'incorrect');
    });

    elements.tryAgainBtn.addEventListener('click', () => {
        if (n) {
            generateNewVector();
            resetUI();
            hasWon = completedLevels.includes(3);
        }
    });

    elements.backToLevelMenuBtn.addEventListener('click', () => {
        window.location.href = `../map.html?mode=${gameMode}`;
    });

    elements.prevLevelBtn.addEventListener('click', () => {
        window.location.href = `level2.html?mode=${gameMode}`;
    });

    elements.nextLevelBtn.addEventListener('click', () => {
        if (!elements.nextLevelBtn.disabled) {
            window.location.href = `level4.html?mode=${gameMode}`;
        }
    });
});
