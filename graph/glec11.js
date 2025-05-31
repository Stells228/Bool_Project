document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '1';

    const lectureContainer = document.querySelector('.lecture-container');
    const upButton = document.querySelector('.up-button');
    const homeButton = document.getElementById('homeButton');

    homeButton?.addEventListener('click', () => window.location.href = '../gmain.html');

    if (upButton) {
        upButton.style.opacity = '1';
        upButton.style.visibility = 'visible';
        upButton.style.transform = 'translateY(0)';
        upButton.style.position = 'fixed';
        upButton.style.bottom = '20px';
        upButton.style.right = '20px';
        upButton.style.cursor = 'pointer';
        upButton.style.zIndex = '1000';

        upButton.addEventListener('click', () => {
            lectureContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Анимация карточек
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', function () {
            this.classList.toggle('flipped');
        });
    });

    // Плавный скроллинг по якорям
    document.querySelectorAll('.toc-list a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                lectureContainer.scrollTo({
                    top: targetElement.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Тест
    const testQuestions = [
        {
            question: "Что такое остовное дерево?",
            answers: [
                "Любой подграф графа",
                "Связный подграф без циклов, содержащий все вершины",
                "Граф с максимальным числом ребер",
                "Дерево с минимальной высотой"
            ],
            correct: 1
        },
        {
            question: "Сколько ребер в остовном дереве графа с 8 вершинами?",
            answers: [
                "7",
                "8",
                "28",
                "6"
            ],
            correct: 0
        },
        {
            question: "Какой алгоритм эффективнее для плотных графов?",
            answers: [
                "Прима",
                "Краскала",
                "Дейкстры",
                "Флойда"
            ],
            correct: 0
        },
        {
            question: "Какую структуру данных использует алгоритм Краскала?",
            answers: [
                "Очередь с приоритетами",
                "Union-Find",
                "Хеш-таблицу",
                "Стек"
            ],
            correct: 1
        },
        {
            question: "Когда граф не имеет остовного дерева?",
            answers: [
                "Когда он полный",
                "Когда он несвязен",
                "Когда он ациклический",
                "Когда он имеет петли"
            ],
            correct: 1
        }
    ];
    
    const startTestBtn = document.getElementById('start-test');
    const testContainer = document.getElementById('test-container');
    const questionsContainer = document.getElementById('questions-container');
    const submitTestBtn = document.getElementById('submit-test');
    const resultContainer = document.getElementById('result-container');
    const closeTestBtn = document.getElementById('close-test');
    const stars = document.querySelectorAll('.star');
    const resultText = document.querySelector('.result-text');
    const goToMainBtn = document.getElementById('go-to-main');
    
    startTestBtn?.addEventListener('click', () => {
        testContainer.classList.remove('hidden');
        startTestBtn.classList.add('hidden');
        renderQuestions();
    });
    
    closeTestBtn?.addEventListener('click', () => {
        testContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');
        startTestBtn.classList.remove('hidden');
    });

    goToMainBtn?.addEventListener('click', () => {
        window.location.href = '../gmain.html';
    });
    
    function renderQuestions() {
        questionsContainer.innerHTML = '';
        testQuestions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.innerHTML = `
                <p class="question-text">${index + 1}. ${q.question}</p>
                ${q.answers.map((a, i) => `
                    <label class="answer-option">
                        <input type="radio" name="q${index}" value="${i}">
                        ${a}
                    </label>
                `).join('')}
            `;
            questionsContainer.appendChild(questionDiv);
        });
    }
    
    submitTestBtn?.addEventListener('click', () => {
        const results = checkTest();
        showResults(results);
    });
    
    function checkTest() {
        const results = [];
        let correctCount = 0;
        
        testQuestions.forEach((q, index) => {
            const selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
            const isCorrect = selectedOption && parseInt(selectedOption.value) === q.correct;
            
            if (isCorrect) correctCount++;
            
            results.push({
                question: q.question,
                selected: selectedOption ? parseInt(selectedOption.value) : null,
                correct: q.correct,
                isCorrect
            });
        });
        
        return { results, correctCount, total: testQuestions.length };
    }

    function saveTestResult(lectureId, correct, total) {
        const results = JSON.parse(localStorage.getItem('lectureTestResults') || '{}');
        
        results[`glec${lectureId}`] = { correct, total };
        localStorage.setItem('lectureTestResults', JSON.stringify(results));
    
        // Обновляем звёзды на главной странице
        if (window.opener && typeof window.opener.updateLectureBlocks === 'function') {
            window.opener.updateLectureBlocks();
        } 
        else if (window.parent && typeof window.parent.updateLectureBlocks === 'function') {
            window.parent.updateLectureBlocks();
        }
    }
    
    function showResults({ results, correctCount, total }) {
        // Показываем правильные ответы
        results.forEach((res, index) => {
            const questionDiv = questionsContainer.children[index];
            const correctAnswer = questionDiv.querySelector(`label:nth-child(${res.correct + 2})`);
            correctAnswer.classList.add('correct-answer');
            
            if (res.selected !== null && !res.isCorrect) {
                const selectedAnswer = questionDiv.querySelector(`label:nth-child(${res.selected + 2})`);
                selectedAnswer.classList.add('wrong-answer');
            }
        });
    
        // Устанавливаем звёздочки
        const percentage = (correctCount / total) * 100;
        stars.forEach((star, index) => {
            star.classList.remove('filled');
            
            if (percentage === 100 && index < 3 || 
                percentage >= 50 && index < 2 || 
                percentage >= 30 && index < 1) {
                star.classList.add('filled');
            }
        });
    
        resultText.textContent = `Вы ответили правильно на ${correctCount} из ${total} вопросов.`;
    
        testContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        
        // в localStorage
        saveTestResult(11, correctCount, total);
    }
    
    // Функция для обновления блоков лекций
    window.updateLectureBlocks = function() {
        const results = JSON.parse(localStorage.getItem('lectureTestResults') || '{}');
        
        document.querySelectorAll('.lecture-block').forEach(block => {
            const lectureId = block.dataset.lectureId;
            const result = results[`lecture${lectureId}`];
            
            if (result) {
                const starsContainer = block.querySelector('.lecture-stars') || 
                    (() => {
                        const stars = document.createElement('div');
                        stars.className = 'lecture-stars';
                        block.appendChild(stars);
                        return stars;
                    })();
                
                starsContainer.innerHTML = '';
                const percentage = (result.correct / result.total) * 100;
                
                for (let i = 0; i < 3; i++) {
                    const star = document.createElement('span');
                    star.className = 'lecture-star';
                    star.textContent = '★';
                    
                    if (percentage === 100 && i < 3 || 
                        percentage >= 50 && i < 2 || 
                        percentage >= 30 && i < 1) {
                        star.classList.add('filled');
                    }
                    
                    starsContainer.appendChild(star);
                }
            }
        });
    };
    updateLectureBlocks();
});