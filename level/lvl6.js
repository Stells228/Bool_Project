document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        functionVectors: document.getElementById('function-vectors'),
        isCompleteYes: document.getElementById('is-complete-yes'),
        isCompleteNo: document.getElementById('is-complete-no'),
        classesContainer: document.getElementById('classes-container'),
        closedClasses: document.getElementById('closed-classes'),
        submitBtn: document.getElementById('submit-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        feedback: document.getElementById('feedback'),
        backToLevelMenuBtn: document.getElementById('back-to-level-menu'),
        prevLevelBtn: document.getElementById('prev-level'),
        rightPanel: document.querySelector('.right-panel'),
        levelContainer: document.querySelector('.level-container')
    };

    let vectors = [];
    let correctClosedClasses = '';
    let completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    let competitionScores = JSON.parse(localStorage.getItem('competitionScores')) || {};
    let hasWon = false;
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('mode') || 'normal';

    if (gameMode === 'passing') {
        elements.prevLevelBtn.disabled = false;
    } else if (gameMode === 'competition') {
        addScoreDisplay();
    }

    generateVectorSet();

    function addScoreDisplay() {
        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';
        scoreDisplay.textContent = `Счёт: ${competitionScores[6] || 0}`;
        elements.rightPanel.insertBefore(scoreDisplay, elements.classesContainer);
    }

    function updateScore(points) {
        const currentPlayer = localStorage.getItem('currentPlayer') || 'Anonymous';
        let allPlayersData = JSON.parse(localStorage.getItem('allPlayersData')) || {};
        if (!allPlayersData[currentPlayer]) allPlayersData[currentPlayer] = { scores: {} };
        allPlayersData[currentPlayer].scores[6] = {
            points: (allPlayersData[currentPlayer].scores[6]?.points || 0) + points,
        };
        localStorage.setItem('allPlayersData', JSON.stringify(allPlayersData));
        if (gameMode === 'competition') {
            document.getElementById('score-display').textContent = `Счёт: ${allPlayersData[currentPlayer].scores[6].points}`;
        }
        window.parent.postMessage({ type: 'updateScore', level: 6, points }, '*');
    }

    elements.isCompleteYes.addEventListener('change', () => {
        if (elements.isCompleteYes.checked) elements.isCompleteNo.checked = false;
    });

    elements.isCompleteNo.addEventListener('change', () => {
        if (elements.isCompleteNo.checked) elements.isCompleteYes.checked = false;
    });

    function genVector() {
        let vector = '';
        let rand2 = 2 ** Math.floor(Math.random() * 3 + 1);
        for (let j = 0; j < rand2; j++) {
            vector += Math.floor(Math.random() * 2);
        }
        return vector;
    }

    function poln(vector) {
        return "" + T0(vector) + T1(vector) + S(vector) + M(vector) + L(vector);
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

    function generateVectorSet() {
        let dlin = Math.floor(Math.random() * 3 + 2);
        vectors = [];
        const naborK = [];
        for (let i = 0; i < dlin; i++) {
            vectors.push(genVector());
            naborK.push(poln(vectors[i]));
        }
        let zam = "01SML";
        correctClosedClasses = "";
        for (let i = 0; i < 5; i++) {
            let zat = 0;
            for (let j = 0; j < dlin; j++) {
                zat += parseInt(naborK[j][i], 2);
            }
            if (zat === dlin) {
                if (i === 0 || i === 1) correctClosedClasses += "T" + zam[i];
                else correctClosedClasses += zam[i];
            }
        }
        elements.functionVectors.innerHTML = vectors.map((v, i) => `f${i + 1}: ${v}`).join('<br>');
    }

    function validateAnswer() {
        const userIsCompleteYes = elements.isCompleteYes.checked;
        const userIsCompleteNo = elements.isCompleteNo.checked;
        const userClosedClasses = elements.closedClasses.value.trim().toUpperCase();
        const isComplete = correctClosedClasses === '';
        if (!userIsCompleteYes && !userIsCompleteNo) {
            showFeedback('Ошибка! Выберите "Да" или "Нет".', 'error');
            return;
        }
        if (userIsCompleteYes && userIsCompleteNo) {
            showFeedback('Ошибка! Выберите только один вариант: "Да" или "Нет".', 'error');
            return;
        }
        if (userIsCompleteNo && userClosedClasses === '') {
            showFeedback('Ошибка! Укажите замкнутый класс для неполной системы.', 'error');
            return;
        }
        if (userIsCompleteYes) {
            if (isComplete) showFeedback('Правильно! Набор полный.', 'correct');
            else showFeedback(`Неправильно!\nНабор не полный.\nЗамкнутый класс: ${correctClosedClasses}`, 'incorrect');
        } else if (userIsCompleteNo) {
            if (isComplete) showFeedback('Неправильно!\nНабор полный, замкнутых классов нет.', 'incorrect');
            else if (userClosedClasses === correctClosedClasses) showFeedback('Правильно! Замкнутый класс верный.', 'correct');
            else showFeedback(`Неправильно!\nПравильный замкнутый класс: ${correctClosedClasses}`, 'incorrect');
        }
    }

    function resetUI() {
        elements.isCompleteYes.checked = false;
        elements.isCompleteYes.disabled = false;
        elements.isCompleteNo.checked = false;
        elements.isCompleteNo.disabled = false;
        elements.closedClasses.value = '';
        elements.closedClasses.disabled = false;
        elements.closedClasses.style.opacity = '1';
        elements.closedClasses.style.cursor = 'text';
        elements.feedback.classList.remove('show', 'correct', 'incorrect', 'error');
        elements.submitBtn.style.display = 'inline-block';
        elements.submitBtn.disabled = false;
        elements.submitBtn.style.opacity = '1';
        elements.submitBtn.style.cursor = 'pointer';
        elements.tryAgainBtn.style.display = 'none';
        elements.tryAgainBtn.disabled = false;
        elements.tryAgainBtn.style.opacity = '1';
        elements.tryAgainBtn.style.cursor = 'pointer';
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
            if (!completedLevels.includes(6)) {
                completedLevels.push(6);
                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                window.parent.postMessage({ type: 'levelCompleted', level: 6 }, '*');
            }
        }
        if (type === 'correct' && gameMode === 'competition') {
            window.parent.postMessage({ 
                type: 'updateScore',
                level: 6,
                points: 10,
            }, '*');
        } else if (type === 'incorrect' && gameMode === 'competition') {
            window.parent.postMessage({ 
                type: 'updateScore',
                level: 6,
                points: -10,
            }, '*');
        }
    }

    elements.submitBtn.addEventListener('click', () => {
        validateAnswer();
    });

    elements.tryAgainBtn.addEventListener('click', () => {
        generateVectorSet();
        resetUI();
        hasWon = completedLevels.includes(6);
    });

    elements.backToLevelMenuBtn.addEventListener('click', () => {
        window.location.href = `../map.html?mode=${gameMode}`;
    });

    elements.prevLevelBtn.addEventListener('click', () => {
        if (!elements.prevLevelBtn.disabled) {
            window.location.href = `level5.html?mode=${gameMode}`;
        }
    });
});
