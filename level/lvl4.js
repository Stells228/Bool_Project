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
        deleteBtn: document.getElementById('delete-btn')
    };

    let n = 0;
    let currentFunctionVector = '';
    let correctCNF = '';

    // Обработка нажатий кнопок
    document.querySelectorAll('.symbol-btn').forEach(button => {
        button.addEventListener('click', () => {
            const symbol = button.dataset.symbol;
            if (symbol) {
                insertSymbol(symbol);
            }
        });
    });

    // кнопка С (удалить
    elements.deleteBtn.addEventListener('click', () => {
        const currentValue = elements.cnfInput.value;
        elements.cnfInput.value = currentValue.slice(0, -1);
        elements.cnfInput.focus();
    });

    // символ в поле ввода
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

        currentFunctionVector = '';
        for (let i = 0; i < 2 ** n; i++) {
            currentFunctionVector += Math.floor(Math.random() * 2);
        }
        elements.functionVector.textContent = `Вектор функции: ${currentFunctionVector}`;

        correctCNF = getCNF(currentFunctionVector);

        generateTruthTable(n, currentFunctionVector);

        resetUI();
    });

    function getCNF(vector) {
        const n = Math.log2(vector.length);
        if (!Number.isInteger(n)) {
            throw new Error("Длина вектора должна быть степенью двойки");
        }

        const variables = [];
        for (let i = 1; i <= n; i++) {
            variables.push(`x${i}`);
        }

        let cnf = '';
        for (let i = 0; i < vector.length; i++) {
            if (vector[i] === '0') {
                const binary = i.toString(2).padStart(n, '0');
                let term = '';
                for (let j = 0; j < n; j++) {
                    if (binary[j] === '1') {
                        term += `¬${variables[j]} ∨ `;
                    } else {
                        term += `${variables[j]} ∨ `;
                    }
                }
                term = term.slice(0, -3); 
                cnf += `(${term}) ∧ `;
            }
        }

        if (cnf === '') {
            return '1'; 
        }

        cnf = cnf.slice(0, -3); 
        return cnf;
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
        if (cnf === '0' || cnf === '1') return cnf;
        return cnf.replace(/\s+/g, '').replace(/∨/g, '∨').replace(/∧/g, '∧');
    }

    function validateCNFInput(input, n) {
        const trimmedInput = input.trim();

        if (!trimmedInput) {
            return { valid: false, message: 'Пожалуйста, введите КНФ' };
        }

        if (trimmedInput === '0') {
            return { valid: true, isZero: true, isOne: false };
        }
        if (trimmedInput === '1') {
            return { valid: true, isZero: false, isOne: true };
        }

        const termPattern = /\([^()]+?\)/g; 
        const terms = trimmedInput.match(termPattern);
        if (!terms) {
            return { valid: false, message: 'КНФ должна включать термы как (¬x1 ∨ x2), объединённые ∧' };
        }

        const withoutTerms = trimmedInput.replace(termPattern, '').replace(/\s+/g, '');
        const expectedJoins = '∧'.repeat(terms.length - 1);
        if (withoutTerms !== expectedJoins) {
            return { valid: false, message: 'Термы должны быть объединены ∧, например, (¬x1 ∨ x2) ∧ (x1 ∨ ¬x2)' };
        }

        for (let term of terms) {
            const content = term.slice(1, -1).replace(/\s+/g, '');
            const literals = content.split('∨');
            if (literals.length !== n) {
                return { valid: false, message: `Каждый терм должен содержать ровно ${n} переменных` };
            }

            for (let literal of literals) {
                if (!literal.match(/^(¬?x[1-4])$/)) {
                    return { valid: false, message: 'Значения должны иметь вид x1, ¬x1, и тд, с переменными от x1 до x' + n};
                }
                const varNum = parseInt(literal.replace(/¬?x/, ''));
                if (varNum < 1 || varNum > n) {
                    return { valid: false, message: 'Переменные должны быть между x1 и x' + n};
                }
            }

            const varNames = literals.map(lit => lit.replace('¬', ''));
            const uniqueVars = new Set(varNames);
            if (uniqueVars.size !== literals.length) {
                return { valid: false, message: 'Каждый терм должен содержать каждую переменную ровно один раз' };
            }
        }

        return { valid: true, isZero: false, isOne: false };
    }

    function computeVectorFromCNF(cnf, n) {
        if (cnf === '0') {
            return '0'.repeat(2 ** n);
        }
        if (cnf === '1') {
            return '1'.repeat(2 ** n);
        }

        const terms = cnf.match(/\([^()]+?\)/g).map(term => term.slice(1, -1).replace(/\s+/g, ''));
        let vector = Array(2 ** n).fill('1'); // Начинаем со всех единиц, тк КНФ — это конъюнкция

        for (let i = 0; i < 2 ** n; i++) {
            const binary = i.toString(2).padStart(n, '0');
            for (let term of terms) {
                const literals = term.split('∨');
                let termValue = false; // Дизъюнкция, поэтому со лжи
                for (let j = 0; j < literals.length; j++) {
                    const literal = literals[j];
                    const isNegated = literal.startsWith('¬');
                    const varNum = parseInt(literal.replace(/¬?x/, '')) - 1;
                    const varValue = binary[varNum] === '1';
                    if (isNegated) {
                        if (!varValue) {
                            termValue = true;
                            break;
                        }
                    } 
                    else {
                        if (varValue) {
                            termValue = true;
                            break;
                        }
                    }
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
        elements.tryAgainBtn.style.display = 'none';
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type} show`;
        elements.submitBtn.style.display = 'none';
        elements.tryAgainBtn.style.display = 'inline-block';
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
            if (currentFunctionVector === '0'.repeat(2 ** n)) {
                showFeedback('Правильно! Так держать!', 'correct');
            } 
            else {
                showFeedback(`Неправильно. КНФ: ${correctCNF}`, 'incorrect');
            }
            return;
        }

        if (validation.isOne) {
            if (currentFunctionVector === '1'.repeat(2 ** n)) {
                showFeedback('Правильно! Так держать!', 'correct');
            } 
            else {
                showFeedback(`Неправильно. КНФ: ${correctCNF}`, 'incorrect');
            }
            return;
        }

        const userVector = computeVectorFromCNF(userCNF, n);
        if (userVector === currentFunctionVector) {
            showFeedback('Правильно! Так держать!', 'correct');
        } 
        else {
            showFeedback(`Неправильно. КНФ: ${correctCNF}`, 'incorrect');
        }
    });

    elements.tryAgainBtn.addEventListener('click', () => {
        elements.variableSelect.value = '';
        elements.functionVector.textContent = '';
        elements.truthTableContainer.innerHTML = '';
        n = 0;
        currentFunctionVector = '';
        correctCNF = '';
        resetUI();
    });

    elements.backToLevelMenuBtn.addEventListener('click', () => {
        window.location.href = '../map.html';
    });

    elements.prevLevelBtn.addEventListener('click', () => {
        window.location.href = 'level3.html';
    });

    elements.nextLevelBtn.addEventListener('click', () => {
        window.location.href = 'level5.html';
    });
});