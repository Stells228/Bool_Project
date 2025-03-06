document.addEventListener('DOMContentLoaded', () => {
    const calcInput = document.getElementById('calc-input');
    const calcDisplay = document.getElementById('calc-display');
    const buttons = document.querySelectorAll('.calc-btn');
    const clearButton = document.getElementById('clear');
    const equalsButton = document.getElementById('equals');
    const errorMessage = document.getElementById('error-message'); // сообщение об ошибке

    if (!calcInput || !calcDisplay || !buttons.length || !clearButton || !equalsButton || !errorMessage) {
        console.error('Calculator elements not found:', { calcInput, calcDisplay, buttons, clearButton, equalsButton, errorMessage });
        return;
    }

    let expression = ''; // переменная ля хранения выражения

    function appendToDisplay(value) {
        // Проверяем, является ли символ допустимым
        if (/[\d\+\-\*\/%.]/.test(value)) {
            // Проверяем, чтобы точка не добавлялась больше одного раза в текущем числе
            if (value === '.' && calcInput.value.includes('.')) {
                errorMessage.textContent = 'Точка уже добавлена в текущее число!';
                errorMessage.style.display = 'inline'; // Показать сообщение об ошибке (тк изначально было скрыто)
                return;
            }
            //на будущее Стефе (мне самой), если у ребят в калькуляторе будут 
            //числа с плав точкой, тут вводится каким-то пёселем много точек
            //но ошибка выдаётся как надо

            expression += value;
            calcInput.value = expression.split(/[\+\-\*\/%]/).pop() || ''; // Показываем последнее число
            calcDisplay.textContent = expression;
            errorMessage.style.display = 'none'; // Скрыть сообщение об ошибке
            console.log('Expression:', expression); //использую логирование для записи значений данных (через браузер и консоль) (отслеживаем действия)
        }
        else {
            // Если символ недопустимый
            errorMessage.textContent = 'Пожалуйста, введите правильное значение! Доступны цифры (0-9), точка (.) и спец символы (+, -, *, /, %)';
            errorMessage.style.display = 'inline'; 
        }
    }

    function calculateResult() {
        try {
            const result = eval(expression); 
            // Ограничиваем количество знаков после запятой до 10
            const formattedResult = parseFloat(result.toFixed(10)); // Округляем до 10 знаков
            calcInput.value = formattedResult;
            calcDisplay.textContent = `${expression} = ${formattedResult}`; //штука позволяющая полностью увидеть весь процесс - 5+3=8
            expression = formattedResult.toString(); // обновляю данные, чтоб использовать рез-тат дальше
            console.log('Result:', formattedResult);
        } 
        catch (error_418) {
            calcInput.value = 'Error';
            calcDisplay.textContent = 'Error';
            expression = '';
            console.error('Calculation error:', error_418);
        }
    }

    function clearCalculator() {
        expression = '';
        calcInput.value = '';
        calcDisplay.textContent = '';
        errorMessage.style.display = 'none'; 
        console.log('Calculator clear');
    }

    // События для all кнопок
    buttons.forEach(button => {
        const value = button.getAttribute('data-value');
        if (value && value !== '=' && value !== 'C') { // у них др обработчики
            button.addEventListener('click', () => { //обработчик клика (да, я забуду умные слова, так что это будет туть)
                console.log(`Button clicked: ${value}`);
                appendToDisplay(value);
            });
        }
    });

    // С и = (просто вызываю функции)
    clearButton.addEventListener('click', clearCalculator);
    equalsButton.addEventListener('click', calculateResult);

    // Обработка ввода с клавиатуры
    // до меня поздно дошло, так что я его попозжа поправлю как надо
    // Стефа, бди, чтоб нажимались и с клавы штуки (заметки на будущее)
    document.addEventListener('keydown', (event) => {
        const key = event.key;

        // проверка клавиш
        if (/[\d\+\-\*\/%.]/.test(key)) {
            appendToDisplay(key);
        } 
        else if (key === 'Enter') {
            calculateResult();
        } 
        else if (key === 'Backspace') {
            expression = expression.slice(0, -1); // - последний символ
            calcInput.value = expression.split(/[\+\-\*\/%]/).pop() || '';
            calcDisplay.textContent = expression;
        } 
        else if (key === 'Escape') {
            clearCalculator();
        } 
        else {
            // Если символ недопустимый, показать сообщение об ошибке
            errorMessage.textContent = 'Пожалуйста, введите правильное значение! Доступны цифры (0-9), точка (.) и спец символы (+, -, *, /, %)';
            errorMessage.style.display = 'inline'; // Показать сообщение об ошибке
        }
    });

    // Обработка ввода в поле ввода
    calcInput.addEventListener('input', (event) => {
        const currentValue = event.target.value;
        const delValue = currentValue.replace(/[^\d\+\-\*\/%.]/g, '');  //попрошу, г - глобальный поиск
        calcInput.value = delValue;
        expression = delValue;
        calcDisplay.textContent = expression;
    });
});
