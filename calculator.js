document.addEventListener('DOMContentLoaded', () => {
    // Рандом ф-я
    const argCountInput = document.getElementById('arg-count');
    const calcDisplayRandom = document.getElementById('calc-display-random');
    const generateButton = document.getElementById('generate');
    const clearRandomButton = document.getElementById('clear-random');

    // Остаточная
    const funcVectorInput = document.getElementById('func-vector');
    const argCountResidualInput = document.getElementById('arg-count-residual');
    const fixArgInput = document.getElementById('fix-arg');
    const fixValueInput = document.getElementById('fix-value');
    const calcDisplayResidual = document.getElementById('calc-display-residual');
    const computeResidualButton = document.getElementById('compute-residual');
    const clearResidualButton = document.getElementById('clear-residual');

    // Реконструкиця
    const vector0Input = document.getElementById('vector0');
    const vector1Input = document.getElementById('vector1');
    const argCountReconstructInput = document.getElementById('arg-count-reconstruct');
    const fixedArgInput = document.getElementById('fixed-arg');
    const calcDisplayReconstruct = document.getElementById('calc-display-reconstruct');
    const reconstructButton = document.getElementById('reconstruct');
    const clearReconstructButton = document.getElementById('clear-reconstruct');

    // СДНФ
    const funcVectorSdnfInput = document.getElementById('func-vector-sdnf');
    const argCountSdnfInput = document.getElementById('arg-count-sdnf');
    const calcDisplaySdnf = document.getElementById('calc-display-sdnf');
    const buildSdnfButton = document.getElementById('build-sdnf');
    const clearSdnfButton = document.getElementById('clear-sdnf');

    // СКНФ
    const funcVectorSknfInput = document.getElementById('func-vector-sknf');
    const argCountSknfInput = document.getElementById('arg-count-sknf');
    const calcDisplaySknf = document.getElementById('calc-display-sknf');
    const buildSknfButton = document.getElementById('build-sknf');
    const clearSknfButton = document.getElementById('clear-sknf');

    // Выбор мода
    const modeSelect = document.getElementById('mode-select');
    const randomMode = document.getElementById('random-mode');
    const residualMode = document.getElementById('residual-mode');
    const reconstructMode = document.getElementById('reconstruct-mode');
    const sdnfMode = document.getElementById('sdnf-mode');
    const sknfMode = document.getElementById('sknf-mode');

    // Проверка имения all эл-ов
    if (
        !argCountInput || !calcDisplayRandom || !generateButton || !clearRandomButton ||
        !funcVectorInput || !argCountResidualInput || !fixArgInput || !fixValueInput || !calcDisplayResidual ||
        !computeResidualButton || !clearResidualButton ||
        !vector0Input || !vector1Input || !argCountReconstructInput || !fixedArgInput ||
        !calcDisplayReconstruct || !reconstructButton || !clearReconstructButton ||
        !funcVectorSdnfInput || !argCountSdnfInput || !calcDisplaySdnf || !buildSdnfButton || !clearSdnfButton ||
        !funcVectorSknfInput || !argCountSknfInput || !calcDisplaySknf || !buildSknfButton || !clearSknfButton ||
        !modeSelect || !randomMode || !residualMode || !reconstructMode || !sdnfMode || !sknfMode
    ) {
        console.error('Calculator elements not found :<');
        return;
    }

    // всплывание окна-ошибки (рядом с окном ввода допущения ошибки)
    function showErrorPopup(inputElement, message) {
        // Удаление (от дублирования сообщений)
        const existingPopup = inputElement.parentElement.querySelector('.error-popup'); //счётчик-флаг окна-ошибки
        if (existingPopup) {
            existingPopup.remove();
        }

        // стиль для окна-ошибок
        inputElement.classList.add('calc-input-error');

        const popup = document.createElement('div');
        popup.className = 'error-popup';
        popup.textContent = message;

        // добавление всплывающего окна
        inputElement.parentElement.appendChild(popup);

        popup.style.left = `${inputElement.offsetWidth + 10}px`; // 10px gap справа
        popup.style.top = `${(inputElement.offsetHeight - popup.offsetHeight) / 2}px`;
    }

    // удаление окна + стиль
    function removeErrorPopup(inputElement) {
        const existingPopup = inputElement.parentElement.querySelector('.error-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        inputElement.classList.remove('calc-input-error');
    }

    // удаление окна-ошибки - стили
    function clearErrorPopups(modeElement) {
        const inputs = modeElement.querySelectorAll('.calc-input');
        inputs.forEach(input => {
            input.classList.remove('calc-input-error');
            const popup = input.parentElement.querySelector('.error-popup');
            if (popup) {
                popup.remove();
            }
        });
    }

    // проверка ввода
    function validateInput(inputElement, validationFn, errorMessage) {
        const isValid = validationFn(inputElement);
        if (!isValid) {
            showErrorPopup(inputElement, errorMessage);
            return false;
        }
        removeErrorPopup(inputElement);
        return true;
    }

    // проверка каждого ввода
    const validateArgCount = (input) => {
        const value = parseInt(input.value);
        return !isNaN(value) && Number.isInteger(Number(input.value)) && value >= 1 && value <= 6;
    };

    const validateFuncVector = (input, expectedLength) => {
        const value = input.value.trim().replace(/\s+/g, ''); //не пугаться, тут просто убираются пробелы
        return value.length === expectedLength && /^[01]+$/.test(value); //проверка на ввод только 0 и 1
    };

    const validateFixArg = (input, n) => {
        const value = parseInt(input.value);
        return !isNaN(value) && Number.isInteger(Number(input.value)) && value >= 1 && value <= n;
    };

    const validateFixValue = (input) => {
        return ['0', '1'].includes(input.value);
    };

    // перепроверка всех вводов и ошибок в определённом режиме
    // я запуталась в числе и номере аргумента, но это останется нашей тайной
    function recheckInputs(mode) {
        if (mode === 'random') {
            validateInput(argCountInput, validateArgCount, 'Пожалуйста, ведите целое число от 1 до 6');
        } 
        else if (mode === 'residual') {
            const n = parseInt(argCountResidualInput.value);
            validateInput(argCountResidualInput, validateArgCount, 'Число аргумента должно быть целым от 1 до 6' );
            if (!isNaN(n)) {
                validateInput(funcVectorInput, (input) => validateFuncVector(input, Math.pow(2, n)), 
                    `Вектор функции должен быть двоичной строкой длины ${Math.pow(2, n)} и состоять только из 0 и 1`
                );
                validateInput(fixArgInput, (input) => validateFixArg(input, n),
                    `Номер аргумента должен быть целым числом от 1 до ${n}`
                );
            }
            validateInput(fixValueInput, validateFixValue, 'Значение аргумента должно быть 0 или 1. Выберите допустимый вариант из раскрывающегося списка');
        } 
        else if (mode === 'reconstruct') {
            const n = parseInt(argCountReconstructInput.value);
            validateInput(argCountReconstructInput, validateArgCount,'Номер аргумента должен быть целым числом от 1 до 6');
            if (!isNaN(n)) {
                const expectedLength = Math.pow(2, n - 1);
                validateInput(vector0Input, (input) => validateFuncVector(input, expectedLength),
                    `Вектор нулевой остаточности должен быть двоичной строкой длины ${expectedLength}, состоящей из 0 и 1`
                );
                validateInput(vector1Input, (input) => validateFuncVector(input, expectedLength),
                    `Вектор единичной остаточности должен быть двоичной строкой длины ${expectedLength}, состоящей из 0 и 1`
                );
                validateInput(fixedArgInput, (input) => validateFixArg(input, n),
                    `Номер аргумента должен быть целым числом от 1 до ${n}`
                );
                if (vector0Input.value === vector1Input.value && vector0Input.value !== '') {
                    showErrorPopup(vector0Input,'Внимание: Остаточные векторы идентичны. Обычно они должны отличаться для реконструкции');
                }
            }
        } 
        else if (mode === 'sdnf') {
            const n = parseInt(argCountSdnfInput.value);
            validateInput(argCountSdnfInput, validateArgCount, 'Число аргумента должно быть целым от 1 до 6');
            if (!isNaN(n)) {
                validateInput(funcVectorSdnfInput, (input) => validateFuncVector(input, Math.pow(2, n)),
                    `Вектор функции должен быть двоичной строкой длины ${Math.pow(2, n)} и состоять только из 0 и 1`
                );
            }
        } 
        else if (mode === 'sknf') {
            const n = parseInt(argCountSknfInput.value);
            validateInput(argCountSknfInput, validateArgCount,
                'Число аргумента должно быть целым от 1 до 6'
            );
            if (!isNaN(n)) {
                validateInput(funcVectorSknfInput, (input) => validateFuncVector(input, Math.pow(2, n)),
                    `Вектор функции должен быть двоичной строкой длины ${Math.pow(2, n)} и состоять только из 0 и 1`
                );
            }
        }
    }

    // Логика переключения режимов с раскрывающимся списком
    modeSelect.addEventListener('change', () => {
        const selectedMode = modeSelect.value;

        // прячем режим и штуку с ошибками
        randomMode.style.display = 'none';
        clearErrorPopups(randomMode);
        residualMode.style.display = 'none';
        clearErrorPopups(residualMode);
        reconstructMode.style.display = 'none';
        clearErrorPopups(reconstructMode);
        sdnfMode.style.display = 'none';
        clearErrorPopups(sdnfMode);
        sknfMode.style.display = 'none';
        clearErrorPopups(sknfMode);

        // показ выбранного режима
        if (selectedMode === 'random') {
            randomMode.style.display = 'block';
        } 
        else if (selectedMode === 'residual') {
            residualMode.style.display = 'block';
        } 
        else if (selectedMode === 'reconstruct') {
            reconstructMode.style.display = 'block';
        } 
        else if (selectedMode === 'sdnf') {
            sdnfMode.style.display = 'block';
        } 
        else if (selectedMode === 'sknf') {
            sknfMode.style.display = 'block';
        }
    });

    // по дефолту ставим рандом
    modeSelect.value = 'random';
    randomMode.style.display = 'block';

    // Вспомогательная ф-я для генерации таблицы истинности в виде таблицы
    // th - заголовки
    // td - ячейки 
    function generateTruthTable(vector, n) {
        const numCombinations = Math.pow(2, n);
        let truthTable = `<div class="truth-table-container">`;
        truthTable += `<table class="truth-table">`;
        
        // голова
        truthTable += `<thead><tr>`;
        for (let j = 1; j <= n; j++) {
            truthTable += `<th>x${j}</th>`;
        }
        truthTable += `<th>F</th></tr></thead>`;

        // тело
        truthTable += `<tbody>`;
        for (let i = 0; i < numCombinations; i++) {
            const inputCombo = i.toString(2).padStart(n, '0'); // Преобразование индекса i в двоичное представление с добавлением ведущих нулей до длины n...не спрашивайте, я с ума сошла
            const output = vector[i];
            truthTable += `<tr>`;
            for (let j = 0; j < n; j++) { //Заполнение столбцов таблицы значениями переменных х в j (значениями бит в двоичном представлении) и результатом функции из массива векотра (сошла с ума х2) 
                truthTable += `<td>${inputCombo[j]}</td>`;
            }
            truthTable += `<td>${output}</td></tr>`;
        }
        truthTable += `</tbody></table></div>`;

        return truthTable;
    }

    // --- Логика рандома ---
    function generateBooleanFunction(n) {
        if (n < 1 || n > 6) {
            showErrorPopup(argCountInput, 'Пожалуйста, ведите целое число от 1 до 6');
            return null;
        }
        removeErrorPopup(argCountInput);
    
        const numCombinations = Math.pow(2, n);
        const numFunctions = Math.pow(2, numCombinations);
        const randomFunctionIndex = Math.floor(Math.random() * numFunctions);
        const functionOutputs = randomFunctionIndex.toString(2).padStart(numCombinations, '0'); // Преобразование индекса функции в двоичную строку
    
        return generateTruthTable(functionOutputs, n);
    }
    
    generateButton.addEventListener('click', () => {
        // перепроверка ввода для определения дальнейших ошибок (вы Стефу вообще не щщадите((( )
        recheckInputs('random');

        const n = parseInt(argCountInput.value);
        if (isNaN(n) || !Number.isInteger(Number(argCountInput.value))) {
            showErrorPopup(argCountInput, 'Пожалуйста, введите допустимое целое число');
            return;
        }
    
        const truthTable = generateBooleanFunction(n);
        if (truthTable) {
            calcDisplayRandom.innerHTML = truthTable;
            removeErrorPopup(argCountInput);
        }
    });

    clearRandomButton.addEventListener('click', () => {
        argCountInput.value = '';
        calcDisplayRandom.textContent = '';
        clearErrorPopups(randomMode);
        console.log('Random mode cleared');
    });

    argCountInput.addEventListener('input', (event) => {
        const value = parseInt(event.target.value);
        if (value < 1 || value > 6) {
            showErrorPopup(argCountInput, 'Пожалуйста, ведите целое число от 1 до 6');
        } 
        else {
            removeErrorPopup(argCountInput);
        }
    });

    // --- Остаточная логика --- (только такая и осталась)
    function computeResidual(vector, n, fixArg, fixValue) {
        if (n < 1 || n > 6) {
            showErrorPopup(argCountResidualInput, 'Число аргумета должно быть целым от 1 до 6');
            return null;
        }
        removeErrorPopup(argCountResidualInput);
    
        const expectedLength = Math.pow(2, n);
        if (vector.length !== expectedLength || !/^[01]+$/.test(vector)) {
            showErrorPopup(funcVectorInput, `Вектор функции должен быть двоичной строкой длины ${expectedLength} и состоять только из 0 и 1`);
            return null;
        }
        removeErrorPopup(funcVectorInput);
    
        if (fixArg < 1 || fixArg > n) {
            showErrorPopup(fixArgInput, `Номер аргумента должен быть целым числом от 1 до ${n}`);
            return null;
        }
        removeErrorPopup(fixArgInput);
    
        if (!['0', '1'].includes(fixValue)) {
            showErrorPopup(fixValueInput, 'Значение аргумента должно быть 0 или 1. Выберите допустимый вариант из раскрывающегося списка');
            return null;            
        }
        removeErrorPopup(fixValueInput);
    
        const residualVector = [];
        const fixArgIndex = n - fixArg;
    
        for (let i = 0; i < vector.length; i++) {
            if (((i >> fixArgIndex) & 1) === parseInt(fixValue)) {
                const mask = (1 << fixArgIndex) - 1;
                const newIndex = (i & mask) | ((i >> (fixArgIndex + 1)) << fixArgIndex);
                residualVector.push(vector[i]);
            }
        }
    
        const remainingVars = [];
        for (let j = 1; j <= n; j++) {
            if (j !== fixArg) remainingVars.push(`x${j}`);
        }
    
        let truthTable = `<div>Остаточная функция (x${fixArg} = ${fixValue}):<br>`;
        truthTable += `Переменные: ${remainingVars.join(', ')}</div>`;
        truthTable += `<div class="truth-table-container">`;
        truthTable += `<table class="truth-table">`;
        truthTable += `<thead><tr>`;
        for (let j = 1; j <= n - 1; j++) {
            truthTable += `<th>x${remainingVars[j - 1].replace('x', '')}</th>`;
        }
        truthTable += `<th>F</th></tr></thead>`;
        truthTable += `<tbody>`;
    
        for (let i = 0; i < residualVector.length; i++) {
            const inputCombo = i.toString(2).padStart(n - 1, '0');
            const output = residualVector[i];
            truthTable += `<tr>`;
            for (let j = 0; j < n - 1; j++) {
                truthTable += `<td>${inputCombo[j]}</td>`;
            }
            truthTable += `<td>${output}</td></tr>`;
        }
    
        truthTable += `</tbody></table></div>`;
        return truthTable;
    }
    
    computeResidualButton.addEventListener('click', () => {
        // перепроверка ввода для определения дальнейших ошибок
        recheckInputs('residual');

        const vector = funcVectorInput.value.trim().replace(/\s+/g, '');
        const n = parseInt(argCountResidualInput.value);
        const fixArg = parseInt(fixArgInput.value);
        const fixValue = fixValueInput.value;
    
        if (isNaN(n) || !Number.isInteger(Number(argCountResidualInput.value))) {
            showErrorPopup(argCountResidualInput, 'Введите допустимое целое число для n');
            return;
        }
    
        if (isNaN(fixArg) || !Number.isInteger(Number(fixArgInput.value))) {
            showErrorPopup(fixArgInput, 'Введите допустимое целое число для аргумента');
            return;
        }
    
        const result = computeResidual(vector, n, fixArg, fixValue);
        if (result) {
            calcDisplayResidual.innerHTML = result;
            clearErrorPopups(residualMode);
        }
    });

    clearResidualButton.addEventListener('click', () => {
        funcVectorInput.value = '';
        argCountResidualInput.value = '';
        fixArgInput.value = '';
        fixValueInput.value = '0';
        calcDisplayResidual.textContent = '';
        clearErrorPopups(residualMode);
        console.log('Residual mode cleared');
    });

    funcVectorInput.addEventListener('input', (event) => {
        const value = event.target.value;
        const n = parseInt(argCountResidualInput.value);
        if (!isNaN(n)) {
            const expectedLength = Math.pow(2, n);
            if (value.length !== expectedLength || !/^[01]*$/.test(value)) {
                showErrorPopup(funcVectorInput, `Вектор функции должен быть двоичной строкой длины ${expectedLength} и состоять только из 0 и 1`);
            } 
            else {
                removeErrorPopup(funcVectorInput);
            }
        } 
        else {
            if (!/^[01]*$/.test(value)) {
                showErrorPopup(funcVectorInput, 'Вектор функции должен содержать только 0 и 1. Другие символы не допускаются.');
            } 
            else {
                removeErrorPopup(funcVectorInput);
            }
        }
    });

    argCountResidualInput.addEventListener('input', (event) => {
        const n = parseInt(event.target.value);
        if (n < 1 || n > 6) {
            showErrorPopup(argCountResidualInput, 'Число аргумета должно быть целым от 1 до 6');
        } 
        else {
            removeErrorPopup(argCountResidualInput);
            // перепроверка других входные данные, которые зависят от n
            const vector = funcVectorInput.value.trim().replace(/\s+/g, '');
            if (vector) {
                validateInput(funcVectorInput, (input) => validateFuncVector(input, Math.pow(2, n)),
                    `Вектор функции должен быть двоичной строкой длины ${Math.pow(2, n)} и состоять только из 0 и 1`
                );
            }
            const fixArg = parseInt(fixArgInput.value);
            if (!isNaN(fixArg)) {
                validateInput(fixArgInput, (input) => validateFixArg(input, n),
                    `Номер аргумента должен быть целым числом от 1 до ${n}`
                );
            }
        }
    });

    fixArgInput.addEventListener('input', (event) => {
        const fixArg = parseInt(event.target.value);
        const n = parseInt(argCountResidualInput.value);
        if (isNaN(n)) return;
        if (fixArg < 1 || fixArg > n) {
            showErrorPopup(fixArgInput, `Номер аргумента должен быть целым числом от 1 до ${n}`);
        } 
        else {
            removeErrorPopup(fixArgInput);
        }
    });

    // --- Логика реконструкции ---
    function reconstructFunction(vector0, vector1, n, fixedArg) {
        if (n < 1 || n > 6) {
            showErrorPopup(argCountReconstructInput, 'Номер аргумента должен быть целым числом от 1 до 6');
            return null;
        }
        removeErrorPopup(argCountReconstructInput);
    
        const expectedLength = Math.pow(2, n - 1);
        if (vector0.length !== expectedLength || !/^[01]+$/.test(vector0)) {
            showErrorPopup(vector0Input, `Вектор нулевой остаточности должен быть двоичной строкой длины ${expectedLength}, состоящей из 0 и 1`);
            return null;
        }
        removeErrorPopup(vector0Input);
    
        if (vector1.length !== expectedLength || !/^[01]+$/.test(vector1)) {
            showErrorPopup(vector1Input, `Вектор единичной остаточности должен быть двоичной строкой длины ${expectedLength}, состоящей из 0 и 1`);
            return null;
        }
        removeErrorPopup(vector1Input);
    
        if (fixedArg < 1 || fixedArg > n) {
            showErrorPopup(fixedArgInput, `Номер аргумента должен быть целым числом от 1 до ${n}`);
            return null;
        }
        removeErrorPopup(fixedArgInput);
    
        if (vector0 === vector1) {
            showErrorPopup(vector0Input, 'Внимание: Остаточные векторы идентичны. Обычно они должны отличаться для реконструкции');
        } 
        else {
            removeErrorPopup(vector0Input);
        }
    
        const numCombinations = Math.pow(2, n);
        const fixedArgIndex = n - fixedArg;
        let originalVector = '';
    
        for (let i = 0; i < numCombinations; i++) {
            const fixValue = (i >> fixedArgIndex) & 1;
            const mask = (1 << fixedArgIndex) - 1;
            const residualIndex = (i & mask) | ((i >> (fixedArgIndex + 1)) << fixedArgIndex);
            originalVector += fixValue === 0 ? vector0[residualIndex] : vector1[residualIndex];
        }
    
        let truthTable = `<div>Реконструированная ф-я (остаточная - x${fixedArg}):<br>`;
        truthTable += `Переменные: x1, x2, ..., x${n}</div>`;
        truthTable += generateTruthTable(originalVector, n);
        return truthTable;
    }
    
    reconstructButton.addEventListener('click', () => {
        // Перепроверка входных данных
        recheckInputs('reconstruct');

        const vector0 = vector0Input.value.trim().replace(/\s+/g, '');
        const vector1 = vector1Input.value.trim().replace(/\s+/g, '');
        const n = parseInt(argCountReconstructInput.value);
        const fixedArg = parseInt(fixedArgInput.value);
    
        if (isNaN(n) || !Number.isInteger(Number(argCountReconstructInput.value))) {
            showErrorPopup(argCountReconstructInput, 'Пожалуйста, введите допустимое целое число для n');
            return;
        }
    
        if (isNaN(fixedArg) || !Number.isInteger(Number(fixedArgInput.value))) {
            showErrorPopup(fixedArgInput, 'Пожалуйста, введите допустимое целое число для аргумента');
            return;
        }
    
        const result = reconstructFunction(vector0, vector1, n, fixedArg);
        if (result) {
            calcDisplayReconstruct.innerHTML = result;
            if (!document.querySelector('.error-popup') || !document.querySelector('.error-popup').textContent.includes('Warning')) {
                clearErrorPopups(reconstructMode);
            }
        }
    });

    clearReconstructButton.addEventListener('click', () => {
        vector0Input.value = '';
        vector1Input.value = '';
        argCountReconstructInput.value = '';
        fixedArgInput.value = '';
        calcDisplayReconstruct.textContent = '';
        clearErrorPopups(reconstructMode);
        console.log('Reconstruct mode cleared');
    });

    vector0Input.addEventListener('input', (event) => {
        const value = event.target.value;
        const n = parseInt(argCountReconstructInput.value);
        if (!isNaN(n)) {
            const expectedLength = Math.pow(2, n - 1);
            if (value.length !== expectedLength || !/^[01]*$/.test(value)) {
                showErrorPopup(vector0Input, `Вектор нулевой остаточности должен быть двоичной строкой длины ${expectedLength}, состоящей из 0 и 1`);
            } 
            else {
                removeErrorPopup(vector0Input);
                if (value === vector1Input.value && value !== '') {
                    showErrorPopup(vector0Input, 'Внимание: Остаточные векторы идентичны. Обычно они должны отличаться для реконструкции');
                }
            }
        } 
        else {
            if (!/^[01]*$/.test(value)) {
                showErrorPopup(vector0Input, 'Вектор нулевой остаточности должен содержать только 0 и 1. Другие символы не допускаются.');
            } 
            else {
                removeErrorPopup(vector0Input);
            }
        }
    });

    vector1Input.addEventListener('input', (event) => {
        const value = event.target.value;
        const n = parseInt(argCountReconstructInput.value);
        if (!isNaN(n)) {
            const expectedLength = Math.pow(2, n - 1);
            if (value.length !== expectedLength || !/^[01]*$/.test(value)) {
                showErrorPopup(vector1Input, `Вектор еденичной остаточности должен быть двоичной строкой длины ${expectedLength}, состоящей из 0 и 1`);
            } 
            else {
                removeErrorPopup(vector1Input);
                if (value === vector0Input.value && value !== '') {
                    showErrorPopup(vector0Input, 'Внимание: Остаточные векторы идентичны. Обычно они должны отличаться для реконструкции');
                }
            }
        } 
        else {
            if (!/^[01]*$/.test(value)) {
                showErrorPopup(vector1Input, 'Вектор единичной остаточности должен содержать только 0 и 1. Другие символы не допускаются.');
            } 
            else {
                removeErrorPopup(vector1Input);
            }
        }
    });

    argCountReconstructInput.addEventListener('input', (event) => {
        const n = parseInt(event.target.value);
        if (n < 1 || n > 6) {
            showErrorPopup(argCountReconstructInput, 'Номер аргумента должен быть целым числом от 1 до 6');
        } 
        else {
            removeErrorPopup(argCountReconstructInput);
            // Перепроверка других входных данных, которые зависят от n
            const vector0 = vector0Input.value.trim().replace(/\s+/g, '');
            if (vector0) {
                validateInput(
                    vector0Input,
                    (input) => validateFuncVector(input, Math.pow(2, n - 1)),
                    `Вектор нулевой остаточности должен быть двоичной строкой длины ${Math.pow(2, n - 1)}, состоящей только из 0 и 1`
                );
            }
            const vector1 = vector1Input.value.trim().replace(/\s+/g, '');
            if (vector1) {
                validateInput(vector1Input, (input) => validateFuncVector(input, Math.pow(2, n - 1)),
                    `Вектор еденичной остаточности должен быть двоичной строкой длины ${Math.pow(2, n - 1)}, состоящей только из 0 и 1`
                );
            }
            const fixedArg = parseInt(fixedArgInput.value);
            if (!isNaN(fixedArg)) {
                validateInput(fixedArgInput, (input) => validateFixArg(input, n), `Номер аргумента должен быть целым числом от 1 до ${n}`);
            }
        }
    });

    fixedArgInput.addEventListener('input', (event) => {
        const fixedArg = parseInt(event.target.value);
        const n = parseInt(argCountReconstructInput.value);
        if (isNaN(n)) return;
        if (fixedArg < 1 || fixedArg > n) {
            showErrorPopup(fixedArgInput, `Номер аргумента должен быть целым числом от 1 до ${n}`);
        } 
        else {
            removeErrorPopup(fixedArgInput);
        }
    });

    // --- Логика СДНФ ---
    function buildSDNF(vector, n) {
        if (n < 1 || n > 6) {
            showErrorPopup(argCountSdnfInput, 'Номер аргумента должен быть целым числом от 1 до 6');
            return null;
        }
        removeErrorPopup(argCountSdnfInput);
    
        const expectedLength = Math.pow(2, n);
        if (vector.length !== expectedLength || !/^[01]+$/.test(vector)) {
            showErrorPopup(funcVectorSdnfInput, `Вектор функции должен быть двоичной строкой длины ${expectedLength}, состоящей только из 0 и 1`);
            return null;
        }
        removeErrorPopup(funcVectorSdnfInput);
    
        // таблица истинности
        let result = generateTruthTable(vector, n);
    
        // построение СДНФ
        const numCombinations = Math.pow(2, n);
        let minterms = [];
    
        for (let i = 0; i < numCombinations; i++) {
            if (vector[i] === '1') {
                const inputCombo = i.toString(2).padStart(n, '0');
                let minterm = []; //формирование конъункции
                for (let j = 0; j < n; j++) {
                    const varName = `x${j + 1}`;
                    if (inputCombo[j] === '0') {
                        minterm.push(`¬${varName}`);
                    } 
                    else {
                        minterm.push(varName);
                    }
                }
                minterms.push(`(${minterm.join(' ∧ ')})`);
            }
        }
    
        // СДНФ - вывод как тексст под таблицей
        result += `<div class="normal-form">СДНФ:<br>`;
        if (minterms.length === 0) {
            result += '0 (constant false function)';
        } 
        else {
            result += minterms.join(' ∨ ');
        }
        result += `</div>`;
    
        return result;
    }
    
    buildSdnfButton.addEventListener('click', () => {
        // Перепроверка
        recheckInputs('sdnf');

        const vector = funcVectorSdnfInput.value.trim().replace(/\s+/g, '');
        const n = parseInt(argCountSdnfInput.value);
    
        if (isNaN(n) || !Number.isInteger(Number(argCountSdnfInput.value))) {
            showErrorPopup(argCountSdnfInput, 'Введите допустимое целое число для n');
            return;
        }
    
        const result = buildSDNF(vector, n);
        if (result) {
            calcDisplaySdnf.innerHTML = result;
            clearErrorPopups(sdnfMode);
        }
    });

    clearSdnfButton.addEventListener('click', () => {
        funcVectorSdnfInput.value = '';
        argCountSdnfInput.value = '';
        calcDisplaySdnf.textContent = '';
        clearErrorPopups(sdnfMode);
        console.log('SDNF mode cleared');
    });

    funcVectorSdnfInput.addEventListener('input', (event) => {
        const value = event.target.value;
        const n = parseInt(argCountSdnfInput.value);
        if (!isNaN(n)) {
            const expectedLength = Math.pow(2, n);
            if (value.length !== expectedLength || !/^[01]*$/.test(value)) {
                showErrorPopup(funcVectorSdnfInput, `Вектор функции должен быть двоичной строкой длины ${expectedLength}, состоящей из 0 и 1`);
            } 
            else {
                removeErrorPopup(funcVectorSdnfInput);
            }
        } 
        else {
            if (!/^[01]*$/.test(value)) {
                showErrorPopup(funcVectorSdnfInput, 'Вектор функции должен содержать только 0 и 1');
            } 
            else {
                removeErrorPopup(funcVectorSdnfInput);
            }
        }
    });

    argCountSdnfInput.addEventListener('input', (event) => {
        const n = parseInt(event.target.value);
        if (n < 1 || n > 6) {
            showErrorPopup(argCountSdnfInput, 'Номер аргумента должен быть целым от 1 до 6');
        } 
        else {
            removeErrorPopup(argCountSdnfInput);
            // Перепроверка
            const vector = funcVectorSdnfInput.value.trim().replace(/\s+/g, '');
            if (vector) {
                validateInput(funcVectorSdnfInput, (input) => validateFuncVector(input, Math.pow(2, n)),
                    `Вектор функции должен быть двоичной строкой длины ${Math.pow(2, n)} и состоять только из 0 и 1`
                );
            }
        }
    });

    // --- Логика СКНФ ---
    function buildSKNF(vector, n) {
        if (n < 1 || n > 6) {
            showErrorPopup(argCountSknfInput, 'Номер аргумента должен быть целым числом от 1 до 6');
            return null;
        }
        removeErrorPopup(argCountSknfInput);
    
        const expectedLength = Math.pow(2, n);
        if (vector.length !== expectedLength || !/^[01]+$/.test(vector)) {
            showErrorPopup(funcVectorSknfInput, `Вектор функции должен быть двоичной строкой длины ${expectedLength}, состоящей только из 0 и 1`);
            return null;
        }
        removeErrorPopup(funcVectorSknfInput);
    
        // таблица истинности
        let result = generateTruthTable(vector, n);
    
        // Вычисление/построение СКНФ
        const numCombinations = Math.pow(2, n);
        let maxterms = [];
    
        for (let i = 0; i < numCombinations; i++) {
            if (vector[i] === '0') {
                const inputCombo = i.toString(2).padStart(n, '0');
                let maxterm = []; //дизъюнкция
                for (let j = 0; j < n; j++) {
                    const varName = `x${j + 1}`;
                    if (inputCombo[j] === '1') {
                        maxterm.push(`¬${varName}`);
                    } 
                    else {
                        maxterm.push(varName);
                    }
                }
                maxterms.push(`(${maxterm.join(' ∨ ')})`);
            }
        }
    
        // СКНФ как текст под таблицей
        result += `<div class="normal-form">СКНФ:<br>`;
        if (maxterms.length === 0) {
            result += '1 (constant true function)';
        } else {
            result += maxterms.join(' ∧ ');
        }
        result += `</div>`;
    
        return result;
    }
    
    buildSknfButton.addEventListener('click', () => {
        // Перепроверка
        recheckInputs('sknf');

        const vector = funcVectorSknfInput.value.trim().replace(/\s+/g, '');
        const n = parseInt(argCountSknfInput.value);
    
        if (isNaN(n) || !Number.isInteger(Number(argCountSknfInput.value))) {
            showErrorPopup(argCountSknfInput, 'Введите допустимое целое число для n');
            return;
        }
    
        const result = buildSKNF(vector, n);
        if (result) {
            calcDisplaySknf.innerHTML = result;
            clearErrorPopups(sknfMode);
        }
    });

    clearSknfButton.addEventListener('click', () => {
        funcVectorSknfInput.value = '';
        argCountSknfInput.value = '';
        calcDisplaySknf.textContent = '';
        clearErrorPopups(sknfMode);
        console.log('SKNF mode cleared');
    });

    funcVectorSknfInput.addEventListener('input', (event) => {
        const value = event.target.value;
        const n = parseInt(argCountSknfInput.value);
        if (!isNaN(n)) {
            const expectedLength = Math.pow(2, n);
            if (value.length !== expectedLength || !/^[01]*$/.test(value)) {
                showErrorPopup(funcVectorSknfInput, `Вектор функции должен быть двоичной строкой длины ${expectedLength}, состоящей из 0 и 1`);
            } 
            else {
                removeErrorPopup(funcVectorSknfInput);
            }
        } 
        else {
            if (!/^[01]*$/.test(value)) {
                showErrorPopup(funcVectorSknfInput, 'Вектор функции должен содержать только 0 и 1');
            } 
            else {
                removeErrorPopup(funcVectorSknfInput);
            }
        }
    });

    argCountSknfInput.addEventListener('input', (event) => {
        const n = parseInt(event.target.value);
        if (n < 1 || n > 6) {
            showErrorPopup(argCountSknfInput, 'Номер аргумента должен быть целым числом от 1 до 6');
        } 
        else {
            removeErrorPopup(argCountSknfInput);
            // перепроверка
            const vector = funcVectorSknfInput.value.trim().replace(/\s+/g, '');
            if (vector) {
                validateInput(funcVectorSknfInput, (input) => validateFuncVector(input, Math.pow(2, n)),
                    `Вектор функции должен быть двоичной строкой длины ${Math.pow(2, n)} и состоять только из 0 и 1`
                );
            }
        }
    });

    // ввод с клавы
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        if (randomMode.style.display !== 'none') {
            if (key === 'Enter') {
                event.preventDefault();
                generateButton.click();
            } 
            else if (key === 'Escape') {
                clearRandomButton.click();
            }
        } 
        else if (residualMode.style.display !== 'none') {
            if (key === 'Enter') {
                event.preventDefault();
                computeResidualButton.click();
            } 
            else if (key === 'Escape') {
                clearResidualButton.click();
            }
        } 
        else if (reconstructMode.style.display !== 'none') {
            if (key === 'Enter') {
                event.preventDefault();
                reconstructButton.click();
            } 
            else if (key === 'Escape') {
                clearReconstructButton.click();
            }
        } 
        else if (sdnfMode.style.display !== 'none') {
            if (key === 'Enter') {
                event.preventDefault();
                buildSdnfButton.click();
            } 
            else if (key === 'Escape') {
                clearSdnfButton.click();
            }
        } 
        else if (sknfMode.style.display !== 'none') {
            if (key === 'Enter') {
                event.preventDefault();
                buildSknfButton.click();
            } else if (key === 'Escape') {
                clearSknfButton.click();
            }
        }
    });
});
