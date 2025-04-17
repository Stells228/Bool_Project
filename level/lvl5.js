document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        variableSelect: document.getElementById('variable-select'),
        functionVector: document.getElementById('function-vector'),
        truthTableContainer: document.getElementById('truth-table-container'),
        submitBtn: document.getElementById('submit-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        feedback: document.getElementById('feedback'),
        backToLevelMenuBtn: document.getElementById('back-to-level-menu'),
        prevLevelBtn: document.getElementById('prev-level'),
        nextLevelBtn: document.getElementById('next-level'),
        rightPanel: document.querySelector('.right-panel'),
        levelContainer: document.querySelector('.level-container')
    };

    let n = 0;
    let vector = '';
    let correctClasses = {};
    let completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    let competitionScores = JSON.parse(localStorage.getItem('competitionScores')) || {};
    let hasWon = false;
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('mode') || 'normal';

    const classCheckboxes = {
        T0: document.createElement('input'),
        T1: document.createElement('input'),
        S: document.createElement('input'),
        M: document.createElement('input'),
        L: document.createElement('input')
    };

    setupCheckboxes(classCheckboxes);

    if (gameMode === 'passing') {
        elements.nextLevelBtn.disabled = !completedLevels.includes(5);
        elements.nextLevelBtn.style.opacity = completedLevels.includes(5) ? '1' : '0.5';
        elements.nextLevelBtn.style.cursor = completedLevels.includes(5) ? 'pointer' : 'not-allowed';
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
        scoreDisplay.textContent = `Счёт: ${competitionScores[5] || 0}`;
        elements.rightPanel.insertBefore(scoreDisplay, document.querySelector('.class-select-container'));
    }

    function updateScore(points) {
        const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
        let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
        if (!allPlayersData[currentPlayer]) allPlayersData[currentPlayer] = { scores: {} };
        allPlayersData[currentPlayer].scores[5] = {
            points: (allPlayersData[currentPlayer].scores[5]?.points || 0) + points,
        };
        localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        if (gameMode === 'competition') {
            document.getElementById('score-display').textContent = `Счёт: ${allPlayersData[currentPlayer].scores[5].points}`;
        }
        window.parent.postMessage({ type: 'updateScore', level: 5, points }, '*');
    }

    elements.variableSelect.addEventListener('change', () => {
        n = parseInt(elements.variableSelect.value);
        if (!n) return;
        generateNewVector();
        resetUI();
    });

    function generateNewVector() {
        vector = '';
        for (let j = 0; j < 2 ** n; j++) {
            vector += Math.floor(Math.random() * 2);
        }
        elements.functionVector.textContent = `Вектор функции: ${vector}`;
        correctClasses = computeClasses(vector);
        generateTruthTable(n, vector);
    }

    function computeClasses(vector) {
        return {
            T0: T0(vector),
            T1: T1(vector),
            S: S(vector),
            M: M(vector),
            L: L(vector)
        };
    }

    function T0(vector) {
        return vector[0] === "0" ? 1 : 0;
    }

    function T1(vector) {
        return vector[vector.length - 1] === "1" ? 1 : 0;
    }

    function S(vector) {
        for (let i = 0; i <= vector.length / 2 - 1; i++) {
            if (vector[i] === vector[vector.length - 1 - i]) return 0;
        }
        return 1;
    }

    function M(vector) {
        for (let i = 0; i < vector.length - 1; i++) {
            let binary1 = i.toString(2).padStart(Math.log2(vector.length), "0");
            for (let j = i + 1; j < vector.length; j++) {
                let binary2 = j.toString(2).padStart(Math.log2(vector.length), "0");
                if (vector[parseInt(binary1, 2)] > vector[parseInt(binary2, 2)]) return 0;
            }
        }
        return 1;
    }

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
                const fx = product % 2;
                if (fx !== parseInt(vector[x])) {
                    match = false;
                    break;
                }
            }
            if (match) return 1;
        }
        return 0;
    }

    function setupCheckboxes(checkboxes) {
        const container = document.createElement('div');
        container.className = 'class-select-container';
        for (const [key, input] of Object.entries(checkboxes)) {
            input.type = 'checkbox';
            input.id = key;
            input.className = 'class-checkbox';
            const label = document.createElement('label');
            label.htmlFor = key;
            label.textContent = key;
            label.className = 'class-label';
            container.appendChild(input);
            container.appendChild(label);
        }
        elements.rightPanel.insertBefore(container, elements.submitBtn.parentElement);
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

    function validateSelection(checkboxes, correct) {
        let shouldBeSelected = [];
        let shouldNotBeSelected = [];
        for (const [key, input] of Object.entries(checkboxes)) {
            const userSelected = input.checked;
            const correctSelection = correct[key] === 1;
            if (userSelected !== correctSelection) {
                if (correctSelection) shouldBeSelected.push(key);
                else shouldNotBeSelected.push(key);
            }
        }
        if (shouldBeSelected.length === 0 && shouldNotBeSelected.length === 0) {
            showFeedback('Правильно! Отличная работа!', 'correct');
        } else {
            let message = 'Неправильно!\n';
            if (shouldBeSelected.length > 0) message += `Должны быть выбраны: ${shouldBeSelected.join(', ')}\n`;
            if (shouldNotBeSelected.length > 0) message += `Не должны быть выбраны: ${shouldNotBeSelected.join(', ')}`;
            showFeedback(message.trim(), 'incorrect');
        }
    }

    function resetUI() {
        for (const input of Object.values(classCheckboxes)) {
            input.checked = false;
            input.disabled = false;
        }
        elements.feedback.classList.remove('show', 'correct', 'incorrect', 'error');
        elements.submitBtn.style.display = 'inline-block';
        elements.submitBtn.disabled = false;
        elements.submitBtn.style.opacity = '1';
        elements.submitBtn.style.cursor = 'pointer';
        elements.tryAgainBtn.style.display = 'none';
        elements.tryAgainBtn.disabled = false;
        elements.tryAgainBtn.style.opacity = '1';
        elements.tryAgainBtn.style.cursor = 'pointer';
        elements.variableSelect.disabled = false;
        elements.variableSelect.style.opacity = '1';
        elements.variableSelect.style.cursor = 'pointer';
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type} show`;
        elements.submitBtn.style.display = 'none';
        elements.tryAgainBtn.style.display = 'inline-block';
        if (gameMode === 'competition') {
            if (type === 'correct') {
                updateScore(10);
                elements.nextLevelBtn.disabled = false;
                elements.nextLevelBtn.style.opacity = '1';
                elements.nextLevelBtn.style.cursor = 'pointer';
            } else if (type === 'incorrect') {
                updateScore(-10);
            }
        } else if (type === 'correct' && gameMode === 'passing' && !hasWon) {
            hasWon = true;
            if (!completedLevels.includes(5)) {
                completedLevels.push(5);
                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                window.parent.postMessage({ type: 'levelCompleted', level: 5 }, '*');
            }
            elements.nextLevelBtn.disabled = false;
            elements.nextLevelBtn.style.opacity = '1';
            elements.nextLevelBtn.style.cursor = 'pointer';
        }
        if (type === 'correct' && gameMode === 'competition') {
            window.parent.postMessage({ 
                type: 'updateScore',
                level: 5,
                points: 10,
            }, '*');
        } else if (type === 'incorrect' && gameMode === 'competition') {
            window.parent.postMessage({ 
                type: 'updateScore',
                level: 5,
                points: -10,
            }, '*');
        }
    }

    elements.submitBtn.addEventListener('click', () => {
        if (!n) {
            showFeedback('Пожалуйста, выберите количество переменных', 'error');
            return;
        }
        validateSelection(classCheckboxes, correctClasses);
    });

    elements.tryAgainBtn.addEventListener('click', () => {
        if (n) {
            generateNewVector();
            resetUI();
            hasWon = completedLevels.includes(5);
        }
    });

    elements.backToLevelMenuBtn.addEventListener('click', () => {
        window.location.href = `../map.html?mode=${gameMode}`;
    });

    elements.prevLevelBtn.addEventListener('click', () => {
        if (!elements.prevLevelBtn.disabled) {
            window.location.href = `level4.html?mode=${gameMode}`;
        }
    });

    elements.nextLevelBtn.addEventListener('click', () => {
        if (!elements.nextLevelBtn.disabled) {
            window.location.href = `level6.html?mode=${gameMode}`;
        }
    });
});
