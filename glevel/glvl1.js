document.addEventListener('DOMContentLoaded', () => {
    let correctOrder = [];
    const generateMatrixBtn = document.getElementById('generateMatrixBtn');
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    const mapBtn = document.getElementById('mapBtn');
    const verticesInput = document.getElementById('vertices');
    const matrixContainer = document.getElementById('matrixContainer');
    const userInputContainer = document.getElementById('userInputContainer');
    const startVertexSelect = document.getElementById('startVertex');
    const feedback = document.getElementById('feedback');

    // Инициализация состояния кнопок
    nextLevelBtn.style.display = 'block'; // Всегда видима
    tryAgainBtn.style.display = 'none';   // Скрыта по умолчанию
    checkAnswerBtn.style.display = 'block'; // Видима по умолчанию

    function generateMatrix() {
        const n = parseInt(verticesInput.value);
        if (isNaN(n) || n < 1 || n > 20) {
            showFeedback("Введите корректное количество вершин (от 1 до 20)", "error");
            return;
        }

        matrixContainer.innerHTML = '';
        userInputContainer.innerHTML = '';
        hideFeedback();
        
        // Сброс состояния кнопок
        checkAnswerBtn.style.display = 'block';
        tryAgainBtn.style.display = 'none';

        // Создание матрицы
        const matrixTable = document.createElement('table');
        matrixTable.className = 'truth-table';
        
        // Заголовки столбцов
        const headerRow = document.createElement('tr');
        const emptyHeader = document.createElement('th');
        headerRow.appendChild(emptyHeader);
        for (let j = 0; j < n; j++) {
            const th = document.createElement('th');
            th.textContent = j;
            headerRow.appendChild(th);
        }
        matrixTable.appendChild(headerRow);

        // Строки матрицы
        for (let i = 0; i < n; i++) {
            const row = document.createElement('tr');
            const rowHeader = document.createElement('th');
            rowHeader.textContent = i;
            row.appendChild(rowHeader);
            
            for (let j = 0; j < n; j++) {
                const cell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.max = '1';
                input.value = '0';
                input.dataset.row = i;
                input.dataset.col = j;
                cell.appendChild(input);
                row.appendChild(cell);
            }
            matrixTable.appendChild(row);
        }
        matrixContainer.appendChild(matrixTable);

        // Обновление выпадающего списка начальной вершины
        updateStartVertexSelect(n);

        // Создание полей для ввода ответа
        const inputDiv = document.createElement('div');
        inputDiv.className = 'inputs-row';
        for (let i = 0; i < n; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = (n - 1).toString();
            input.placeholder = `Шаг ${i + 1}`;
            input.dataset.index = i;
            inputDiv.appendChild(input);
        }
        userInputContainer.appendChild(inputDiv);
    }

    function updateStartVertexSelect(n) {
        startVertexSelect.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            startVertexSelect.appendChild(option);
        }
    }

    function dfs(matrix, start) {
        const visited = Array(matrix.length).fill(false);
        const result = [];

        function traverse(node) {
            visited[node] = true;
            result.push(node);

            for (let neighbor = 0; neighbor < matrix.length; neighbor++) {
                if (matrix[node][neighbor] !== 0 && !visited[neighbor]) {
                    traverse(neighbor);
                }
            }
        }

        traverse(start);
        return result;
    }

    function checkAnswer() {
        const n = parseInt(verticesInput.value);
        if (isNaN(n) || n < 1 || n > 20) {
            showFeedback("Некорректное количество вершин", "error");
            return;
        }

        const matrix = [];
        let hasError = false;

        // Считываем матрицу
        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                const input = document.querySelector(`input[data-row='${i}'][data-col='${j}']`);
                if (!input) {
                    showFeedback("Сначала создайте матрицу", "error");
                    return;
                }
                let val = parseInt(input.value);
                if (isNaN(val) || val < 0 || val > 1) {
                    showFeedback(`Введите 0 или 1 в ячейке [${i},${j}]`, "error");
                    hasError = true;
                }
                row.push(isNaN(val) ? 0 : val);
            }
            matrix.push(row);
        }

        if (hasError) return;

        // Проверяем симметричность матрицы
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (matrix[i][j] !== matrix[j][i]) {
                    showFeedback("Матрица должна быть симметричной (неориентированный граф)", "error");
                    return;
                }
            }
        }

        // Получаем начальную вершину
        const start = parseInt(startVertexSelect.value);
        if (isNaN(start) || start < 0 || start >= n) {
            showFeedback("Выберите корректную начальную вершину", "error");
            return;
        }

        // Проверяем ввод пользователя
        const userOrder = [];
        const userInputs = document.querySelectorAll('#userInputContainer input');
        if (userInputs.length !== n) {
            showFeedback("Заполните все поля порядка обхода", "error");
            return;
        }

        const usedVertices = new Set();
        for (let i = 0; i < n; i++) {
            const input = userInputs[i];
            let val = parseInt(input.value);
            if (isNaN(val) || val < 0 || val >= n) {
                showFeedback(`Введите корректную вершину (от 0 до ${n-1}) в поле ${i+1}`, "error");
                return;
            }
            if (usedVertices.has(val)) {
                showFeedback(`Вершина ${val} встречается более одного раза`, "error");
                return;
            }
            usedVertices.add(val);
            userOrder.push(val);
        }

        // Вычисляем правильный путь
        correctOrder = dfs(matrix, start);

        // Проверяем совпадение
        const isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);

        if (isCorrect) {
            showFeedback("✅ Правильно! Порядок обхода вершин верный", "correct");
        } else {
            showFeedback(`❌ Неправильно. Правильный порядок: ${correctOrder.join(' → ')}`, "incorrect");
        }
        
        // Переключение кнопок
        checkAnswerBtn.style.display = 'none';
        tryAgainBtn.style.display = 'block';
    }

    function resetInputs() {
        const inputs = document.querySelectorAll('#userInputContainer input');
        inputs.forEach(input => {
            input.value = '';
        });
        hideFeedback();
        
        // Возвращаем исходное состояние кнопок
        tryAgainBtn.style.display = 'none';
        checkAnswerBtn.style.display = 'block';
    }

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = 'feedback show ' + type;
    }

    function hideFeedback() {
        feedback.className = 'feedback';
    }

    // Инициализация
    generateMatrix();

    // Назначение обработчиков событий
    generateMatrixBtn.addEventListener('click', generateMatrix);
    checkAnswerBtn.addEventListener('click', checkAnswer);
    tryAgainBtn.addEventListener('click', resetInputs);
    nextLevelBtn.addEventListener('click', () => window.location.href = 'glevel2.html');
    mapBtn.addEventListener('click', () => window.location.href = '../gmap.html');
    
});