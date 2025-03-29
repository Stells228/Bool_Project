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
        nextLevelBtn: document.getElementById('next-level')
    };

    let vectors = [];
    let correctClosedClasses = '';
    let completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    let hasWon = false;
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('mode') || 'Свободный    ';

    if (gameMode === 'passing') {
        elements.nextLevelBtn.disabled = !completedLevels.includes(6);
        elements.nextLevelBtn.style.opacity = completedLevels.includes(6) ? '1' : '0.5';
        elements.nextLevelBtn.style.cursor = completedLevels.includes(6) ? 'pointer' : 'not-allowed';
        elements.prevLevelBtn.disabled = false;
    }

    generateVectorSet();

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
        } 
        else if (userIsCompleteNo) {
            if (isComplete) showFeedback('Неправильно!\nНабор полный, замкнутых классов нет.', 'incorrect');
            else if (userClosedClasses === correctClosedClasses) showFeedback('Правильно! Замкнутый класс верный.', 'correct');
            else showFeedback(`Неправильно!\nПравильный замкнутый класс: ${correctClosedClasses}`, 'incorrect');
        }
    }

    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type} show`;
        elements.submitBtn.style.display = 'none';
        elements.tryAgainBtn.style.display = 'inline-block';
        if (type === 'correct' && gameMode === 'passing' && !hasWon) {
            hasWon = true;
            if (!completedLevels.includes(6)) {
                completedLevels.push(6);
                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                window.parent.postMessage({ type: 'levelCompleted', level: 6 }, '*');
            }
            elements.nextLevelBtn.disabled = false;
            elements.nextLevelBtn.style.opacity = '1';
            elements.nextLevelBtn.style.cursor = 'pointer';
        }
    }

    function resetUI() {
        elements.isCompleteYes.checked = false;
        elements.isCompleteNo.checked = false;
        elements.closedClasses.value = '';
        elements.feedback.classList.remove('show', 'correct', 'incorrect', 'error');
        elements.submitBtn.style.display = 'inline-block';
        elements.tryAgainBtn.style.display = 'none';
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
        window.location.href = `level5.html?mode=${gameMode}`;
    });

    elements.nextLevelBtn.addEventListener('click', () => {
        if (!elements.nextLevelBtn.disabled) {
            window.location.href = `level6.html?mode=${gameMode}`; 
        }
    });

});