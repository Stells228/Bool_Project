document.addEventListener('DOMContentLoaded', () => {
    const boolF = {
        "Нулевая функция": "0000",
        "Конъюнкция": "0001",
        "Запрет по x": "0100",
        "функция по x": "0011",
        "Запрет по y": "0010",
        "функция по y": "0101",
        "Сложение": "0110",
        "Дизъюнкция": "0111",
        "Стрелка Пирса": "1000",
        "Эквивалентность": "1001",
        "Отрицание y": "1010",
        "Обратная импликация": "1011",
        "Отрицание x": "1100",
        "Импликация": "1101",
        "Штрих Шеффера": "1110",
        "Единичная функция": "1111"
    };

    let currentFunctionVector = '';
    let correctFunction = '';

    function setupCustomSelect() {
        const selectHeader = document.querySelector('.custom-select .select-header');
        const selectOptions = document.querySelector('.custom-select .select-options');
        const selectInput = document.querySelector('#function-select');
    
        if (!selectHeader || !selectOptions || !selectInput) {
            console.error('Не найдены элементы селекта!');
            return;
        }
    
        selectHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            selectOptions.classList.toggle('active');
        });
    
        document.addEventListener('click', (e) => {
            if (!selectOptions.contains(e.target) && e.target !== selectHeader) {
                selectOptions.classList.remove('active');
            }
        });
    
        selectOptions.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                selectInput.value = value;
                selectHeader.querySelector('span:first-child').textContent = value;
                selectOptions.classList.remove('active');
            });
        });
    }

    // Обновление UI
    function updateUI() {
        if (!currentFunctionVector) {
            console.error('Нет данных для отображения');
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
        ['x', 'y', 'f(x,y)'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        const inputs = [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1]
        ];
        inputs.forEach(([x, y], index) => {
            const row = document.createElement('tr');
            [x, y, currentFunctionVector[index]].forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            table.appendChild(row);
        });

        // Вставка таблицы в контейнер
        const container = document.getElementById('truth-table-container');
        container.innerHTML = '';
        container.appendChild(table);
    }

    function showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;
        feedback.style.display = 'block';
    }
    setupCustomSelect();

    // Выбор случайной функции
    const values = Object.values(boolF);
    currentFunctionVector = values[Math.floor(Math.random() * values.length)];
    correctFunction = Object.keys(boolF).find(key => boolF[key] === currentFunctionVector);

    updateUI();

    // Обработка кнопки "Проверить"
    document.getElementById('submit-btn').addEventListener('click', () => {
        const selectedFunction = document.getElementById('function-select').value;
        if (!selectedFunction) {
            showFeedback('Пожалуйста, выберите функцию!', 'error');
            return;
        }
        const isCorrect = boolF[selectedFunction] === currentFunctionVector;
        showFeedback(isCorrect ? 'Правильно!' : 'Неправильно!', isCorrect ? 'correct' : 'incorrect');
    });
});
