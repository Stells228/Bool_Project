document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        variableSelect: document.getElementById('variable-select'),
        functionVector: document.getElementById('function-vector'),
        truthTableContainer: document.getElementById('truth-table-container'),
        dummyInput: document.getElementById('dummy-input'),
        essentialInput: document.getElementById('essential-input'),
        submitBtn: document.getElementById('submit-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        feedback: document.getElementById('feedback'),
        backToLevelMenuBtn: document.getElementById('back-to-level-menu'),
        prevLevelBtn: document.getElementById('prev-level'),
        nextLevelBtn: document.getElementById('next-level')
    };

    let n = 0;
    let currentFunctionVector = '';
    let correctDummyVars = '';
    let correctEssentialVars = '';

    //Генерируем вектор ф-ии и табличку, когда выбрано число аргументов
    elements.variableSelect.addEventListener('change', () => {
        n = parseInt(elements.variableSelect.value);
        if (!n) return;

        // вектор ф-ии
        currentFunctionVector = '';
        for (let i = 0; i < 2 ** n; i++) {
            currentFunctionVector += Math.floor(Math.random() * 2);
        }
        elements.functionVector.textContent = `Вектор функции: ${currentFunctionVector}`;

        // ищем существенные и фиктивные переменные
        const result = findDummyAndEssentialVariables(currentFunctionVector, n);
        correctDummyVars = result.dummy;
        correctEssentialVars = result.essential;

        generateTruthTable(n, currentFunctionVector);

        resetUI();
    });

    function findDummyAndEssentialVariables(vector, n) {
        let dummyVars = '';
        let essentialVars = '';

        // проверяем каждую на фиктивность
        for (let j = 1; j <= n; j++) {
            let partLength = vector.length / (2 ** j);
            let zeroPart = '';
            let onePart = '';
            for (let i = 0; i < 2 ** j; i++) {
                let start = i * partLength;
                let end = start + partLength;
                if (i % 2 === 0) {
                    zeroPart += vector.slice(start, end);
                } 
                else {
                    onePart += vector.slice(start, end);
                }
            }
            if (zeroPart === onePart) {
                dummyVars += j;
            } 
            else {
                essentialVars += j;
            }
        }

        return { dummy: dummyVars, essential: essentialVars };
    }

    // табличка на основе n
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

        // все возможные комбинации ввода
        for (let i = 0; i < 2 ** n; i++) {
            const row = document.createElement('tr');
            const binary = i.toString(2).padStart(n, '0'); // в бин
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

    // проверка данных от юзера
    function validateVariableInput(input, n, type) {
        // позволяем им писать пустой ввод (ну, ежель нет)
        if (!input) {
            return { valid: true, indices: [] };
        }

        // проверка на допустимость ввода только чисел
        if (!/^\d+$/.test(input)) {
            return { valid: false, message: `Пожалуйста, введите только цифры для ${type} переменных` };
        }

        // Проверьте допустимые значения (от 1 до n)
        const indices = input.split('').map(Number);
        for (let idx of indices) {
            if (idx < 1 || idx > n) {
                return { valid: false, message: `Индексы для ${type} переменных должны быть в диапазоне от 1 до ${n}.` };
            }
        }

        // дубликаты
        const uniqueIndices = new Set(indices);
        if (uniqueIndices.size !== indices.length) {
            return { valid: false, message: `Дублирующиеся индексы не допускаются для ${type} переменных.` };
        }

        return { valid: true, indices };
    }

    // наличие совпадений между фиктивными и существенными переменными
    function checkOverlap(dummyIndices, essentialIndices) {
        const dummySet = new Set(dummyIndices);
        for (let idx of essentialIndices) {
            if (dummySet.has(idx)) {
                return { valid: false, message: 'Переменная не может быть одновременно фиктивной и существенной.' };
            }
        }
        return { valid: true };
    }

    // все ли переменные учтены
    function checkCompleteness(dummyIndices, essentialIndices, n) {
        const allIndices = new Set([...dummyIndices, ...essentialIndices]);
        for (let i = 1; i <= n; i++) {
            if (!allIndices.has(i)) {
                return { valid: false, message: `Переменная x${i} не является ни фиктивной, ни существенной. Все переменные должны быть классифицированы.` };
            }
        }
        return { valid: true };
    }

    function resetUI() {
        elements.dummyInput.value = '';
        elements.essentialInput.value = '';
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
            showFeedback('Пожалуйста, выберите количество переменных.', 'error');
            return;
        }

        const dummyValidation = validateVariableInput(elements.dummyInput.value.trim(), n, 'dummy');
        if (!dummyValidation.valid) {
            showFeedback(dummyValidation.message, 'error');
            return;
        }

        const essentialValidation = validateVariableInput(elements.essentialInput.value.trim(), n, 'essential');
        if (!essentialValidation.valid) {
            showFeedback(essentialValidation.message, 'error');
            return;
        }

        const dummyIndices = dummyValidation.indices;
        const essentialIndices = essentialValidation.indices;

        // совпадение
        const overlapCheck = checkOverlap(dummyIndices, essentialIndices);
        if (!overlapCheck.valid) {
            showFeedback(overlapCheck.message, 'error');
            return;
        }

        // все ли переменные учтены
        const completenessCheck = checkCompleteness(dummyIndices, essentialIndices, n);
        if (!completenessCheck.valid) {
            showFeedback(completenessCheck.message, 'error');
            return;
        }

        // правильность
        const userDummy = dummyIndices.sort().join('');
        const userEssential = essentialIndices.sort().join('');
        if (userDummy === correctDummyVars && userEssential === correctEssentialVars) {
            showFeedback('Правильно! Так держать!', 'correct');
        } 
        else {
            showFeedback(
                `Неправильно. \nФиктивные переменные: ${correctDummyVars || 'none'}; \nСущественные переменные: ${correctEssentialVars || 'none'}`,
                'incorrect'
            );
        }
    });

    elements.tryAgainBtn.addEventListener('click', () => {
        elements.variableSelect.value = '';
        elements.functionVector.textContent = '';
        elements.truthTableContainer.innerHTML = '';
        n = 0;
        currentFunctionVector = '';
        correctDummyVars = '';
        correctEssentialVars = '';
        resetUI();
    });

    elements.backToLevelMenuBtn.addEventListener('click', () => {
        window.location.href = '../map.html';
    });

    elements.prevLevelBtn.addEventListener('click', () => {
        window.location.href = 'level1.html';
    });

    elements.nextLevelBtn.addEventListener('click', () => {
        window.location.href = 'level3.html';
    });
});