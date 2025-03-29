document.addEventListener('DOMContentLoaded', () => {
    const customSelect = document.querySelector('.custom-select');
    const selectHeader = document.getElementById('select-header');
    const selectOptions = document.getElementById('select-options');
    const options = document.querySelectorAll('.option');
    const nativeSelect = document.getElementById('function-select');

    selectHeader.addEventListener('click', () => {
        customSelect.classList.toggle('active');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            selectHeader.querySelector('span:first-child').textContent = option.textContent;
            nativeSelect.value = option.dataset.value;
            customSelect.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('active');
        }
    });

    selectOptions.addEventListener('wheel', (e) => {
        e.preventDefault();
        selectOptions.scrollTop += e.deltaY;
    });

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

    const elements = {
        functionVector: document.getElementById('function-vector'),
        truthTableContainer: document.getElementById('truth-table-container'),
        functionSelect: document.getElementById('function-select'),
        submitBtn: document.getElementById('submit-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        feedback: document.getElementById('feedback'),
        backToLevelMenuBtn: document.getElementById('back-to-level-menu'),
        nextLevelBtn: document.getElementById('next-level')
    };

    let currentFunctionVector = '';
    let completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    let hasWon = false;
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('mode') || 'normal';


    if (gameMode === 'passing') {
        elements.nextLevelBtn.disabled = !completedLevels.includes(1);
        elements.nextLevelBtn.style.opacity = completedLevels.includes(1) ? '1' : '0.5';
        elements.nextLevelBtn.style.cursor = completedLevels.includes(1) ? 'pointer' : 'not-allowed';
    }

    function generateFunctionVector() {
        const functionVectors = Object.values(boolF);
        currentFunctionVector = functionVectors[Math.floor(Math.random() * functionVectors.length)];
        elements.functionVector.textContent = `Вектор функции: ${currentFunctionVector}`;
        generateTruthTable();
    }

    function generateTruthTable() {
        elements.truthTableContainer.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'truth-table';

        const headerRow = document.createElement('tr');
        ['x', 'y', 'f(x,y)'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        const inputs = [[0, 0], [0, 1], [1, 0], [1, 1]];
        inputs.forEach(([x, y], index) => {
            const row = document.createElement('tr');
            [x, y, currentFunctionVector[index]].forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            table.appendChild(row);
        });

        elements.truthTableContainer.appendChild(table);
    }

    function resetUI() {
        nativeSelect.value = '';
        selectHeader.querySelector('span:first-child').textContent = 'Выбор функции'; 
        elements.feedback.style.display = 'none';
        elements.feedback.className = 'feedback';
        elements.submitBtn.style.display = 'inline-block';
        elements.tryAgainBtn.style.display = 'none';
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type} show`;
        elements.feedback.style.display = 'block';
        elements.submitBtn.style.display = 'none';
        elements.tryAgainBtn.style.display = 'inline-block';

        if (type === 'correct' && gameMode === 'passing' && !hasWon) {
            hasWon = true;
            if (!completedLevels.includes(1)) {
                completedLevels.push(1);
                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                window.parent.postMessage({ type: 'levelCompleted', level: 1 }, '*');
            }
            elements.nextLevelBtn.disabled = false;
            elements.nextLevelBtn.style.opacity = '1';
            elements.nextLevelBtn.style.cursor = 'pointer';
        }
    }

    elements.submitBtn.addEventListener('click', () => {
        const selectedFunction = nativeSelect.value;

        if (!selectedFunction) {
            showFeedback('Пожалуйста, выберите имя функции!', 'error');
            return;
        }

        if (boolF[selectedFunction] === currentFunctionVector) {
            showFeedback('Правильно! Так держать!', 'correct');
        } 
        else {
            const correctFunction = Object.keys(boolF).find(key => boolF[key] === currentFunctionVector);
            showFeedback(`Неправильно. Имя функции: ${correctFunction}`, 'incorrect');
        }
    });

    elements.tryAgainBtn.addEventListener('click', () => {
        generateFunctionVector();
        resetUI();
        hasWon = completedLevels.includes(1); //обновляем hasWon для сохр прогр
    });

    elements.backToLevelMenuBtn.addEventListener('click', () => {
        window.location.href = `../map.html?mode=${gameMode}`;
    });

    elements.nextLevelBtn.addEventListener('click', () => {
        if (!elements.nextLevelBtn.disabled) {
            window.location.href = `level2.html?mode=${gameMode}`;
        }
    });

    generateFunctionVector();
});
