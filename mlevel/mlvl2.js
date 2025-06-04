document.addEventListener('DOMContentLoaded', () => {
    // Количество переменных (n = 2 или 3)
    let n = 2;
    let currentFunctionVector = '';
    let correctDummyVars = '';
    let correctEssentialVars = '';

    // Обновляет UI: вектор функции и таблицу истинности
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

        // Вставка таблицы в контейнер
        const container = document.getElementById('truth-table-container');
        container.innerHTML = '';
        container.appendChild(table);
    }

    // Находит фиктивные и существенные переменные
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

    // Валидация ввода переменных
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

    // Проверка на пересечение переменных
    function checkOverlap(dummyIndices, essentialIndices) {
        const dummySet = new Set(dummyIndices);
        for (let idx of essentialIndices) {
            if (dummySet.has(idx)) return { valid: false, message: 'Переменная не может быть одновременно фиктивной и существенной.' };
        }
        return { valid: true };
    }

    // Проверка полноты классификации
    function checkCompleteness(dummyIndices, essentialIndices, n) {
        const allIndices = new Set([...dummyIndices, ...essentialIndices]);
        for (let i = 1; i <= n; i++) {
            if (!allIndices.has(i)) return { valid: false, message: `Переменная x${i} не является ни фиктивной, ни существенной. Все переменные должны быть классифицированы.` };
        }
        return { valid: true };
    }

    function showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;
        feedback.style.display = 'block';
    }

    // Случайное количество переменных: 2 или 3
    n = 2 + Math.floor(Math.random() * 2); // Только 2 или 3

    // Случайный вектор функции
    currentFunctionVector = Array.from({ length: 2 ** n }, () =>
        Math.floor(Math.random() * 2)
    ).join('');

    // Находим правильные ответы
    const result = findDummyAndEssentialVariables(currentFunctionVector, n);
    correctDummyVars = result.dummy;
    correctEssentialVars = result.essential;

    updateUI();

    // Обработка кнопки "Проверить"
    document.getElementById('submit-btn').addEventListener('click', () => {
        const dummyInput = document.getElementById('dummy-input').value.trim();
        const essentialInput = document.getElementById('essential-input').value.trim();

        if (!dummyInput && !essentialInput) {
            showFeedback('Пожалуйста, введите переменные!', 'error');
            return;
        }

        // Валидация ввода
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

        // Проверка на пересечение
        const overlapCheck = checkOverlap(dummyIndices, essentialIndices);
        if (!overlapCheck.valid) {
            showFeedback(overlapCheck.message, 'error');
            return;
        }

        // Проверка полноты
        const completenessCheck = checkCompleteness(dummyIndices, essentialIndices, n);
        if (!completenessCheck.valid) {
            showFeedback(completenessCheck.message, 'error');
            return;
        }

        // Сравнение с правильным ответом
        const userDummy = dummyIndices.sort().join('');
        const userEssential = essentialIndices.sort().join('');
        const isCorrect = userDummy === correctDummyVars && userEssential === correctEssentialVars;

        showFeedback(
            isCorrect ? 'Правильно!' : 'Неправильно!',
            isCorrect ? 'correct' : 'incorrect'
        );
    });
});