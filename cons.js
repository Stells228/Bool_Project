document.addEventListener('DOMContentLoaded', () => {
    const constructionWindow = document.getElementById('construction-window');
    const dnfInput = document.getElementById('dnf-input');
    const simplifyBtn = document.getElementById('simplify-dnf');
    const clearBtn = document.getElementById('clear-dnf');
    const deleteBtn = document.getElementById('delete-btn');
    const display = document.getElementById('construction-display');
    const feedback = document.getElementById('construction-feedback');
    const symbolButtons = document.querySelectorAll('.symbol-btn:not(#delete-btn)');
    
    if (!constructionWindow || !dnfInput || !simplifyBtn || !clearBtn || 
        !deleteBtn || !display || !feedback) {
        console.error('Constructor elements not found');
        return;
    }

    let isProcessing = false;

    function simplifyDNF(dnf) {
        if (!dnf) throw new Error('Пустой ввод');
        let terms = dnf.split('∨').map(term => term.trim());
        let changed = true;
        
        while (changed) {
            changed = false;
            let newTerms = [];
            for (let i = 0; i < terms.length; i++) {
                let merged = false;
                for (let j = i + 1; j < terms.length; j++) {
                    const combined = combineTwoTerms(terms[i], terms[j]);
                    if (combined) {
                        newTerms.push(combined);
                        terms.splice(j, 1);
                        merged = true;
                        changed = true;
                        break;
                    }
                }
                if (!merged) newTerms.push(terms[i]);
            }
            terms = [...new Set(newTerms)];
        }
        return terms.length > 0 ? terms.join(' ∨ ') : 'Пустая ДНФ';
    }

    function combineTwoTerms(term1, term2) {
        const vars1 = term1.split('∧');
        const vars2 = term2.split('∧');
        if (vars1.length !== vars2.length) return null;
        let diffCount = 0;
        let result = [];
        for (let i = 0; i < vars1.length; i++) {
            if (vars1[i] === vars2[i]) {
                result.push(vars1[i]);
            } 
            else if (vars1[i].replace('¬', '') === vars2[i].replace('¬', '')) {
                diffCount++;
                result.push(vars1[i].replace('¬', ''));
            } 
            else {
                return null;
            }
        }
        return diffCount === 1 ? result.join('∧') : null;
    }

    function validateDNF(input) {
        if (!input) return { valid: false, message: 'Пожалуйста, введите ДНФ' };
        if (input.length > 100) return { valid: false, message: 'Ввод слишком длинный (максимум 100 символов)' };
        const terms = input.split('∨').map(term => term.trim());
        if (terms.length === 0 || terms.some(term => !term)) {
            return { valid: false, message: 'ДНФ должна содержать хотя бы один терм' };
        }
        const termLengths = terms.map(term => term.split('∧').length);
        if (new Set(termLengths).size > 1) {
            return { valid: false, message: 'Все термы должны иметь одинаковое количество переменных' };
        }
        const termPattern = /^(¬?[a-d])(∧¬?[a-d])*$/;
        for (let term of terms) {
            if (!termPattern.test(term)) {
                return { valid: false, message: 'Термы должны быть в формате ¬a∧¬b∧c, с переменными a, b, c, d' };
            }
            const vars = term.split('∧').map(v => v.replace('¬', ''));
            if (new Set(vars).size !== vars.length) {
                return { valid: false, message: 'Каждая переменная в терме должна быть уникальной' };
            }
        }
        return { valid: true };
    }

    function showErrorPopup(input, message) {
        let popup = input.parentElement.querySelector('.error-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'error-popup';
            input.parentElement.appendChild(popup);
        }
        popup.textContent = message;
        popup.classList.add('show');
    }

    function removeErrorPopup(input) {
        const popup = input.parentElement.querySelector('.error-popup');
        if (popup) popup.classList.remove('show');
    }

    function clearErrorPopups() {
        const popup = dnfInput.parentElement.querySelector('.error-popup');
        if (popup) popup.remove();
    }

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `feedback ${type} show`;
        simplifyBtn.disabled = true;
        clearBtn.disabled = false;
    }

    function hideFeedback() {
        feedback.classList.remove('show', 'correct', 'incorrect', 'error');
        simplifyBtn.disabled = false;
    }

    function insertSymbol(symbol) {
        if (isProcessing) return;
        const startPos = dnfInput.selectionStart;
        const endPos = dnfInput.selectionEnd;
        dnfInput.value = dnfInput.value.substring(0, startPos) + symbol + dnfInput.value.substring(endPos);
        dnfInput.setSelectionRange(startPos + symbol.length, startPos + symbol.length);
        dnfInput.focus();
        validateInputOnChange();
    }

    function validateInputOnChange() {
        const value = dnfInput.value.trim();
        if (!value) {
            removeErrorPopup(dnfInput);
            return;
        }
        const validation = validateDNF(value);
        if (!validation.valid) {
            showErrorPopup(dnfInput, validation.message);
        } 
        else {
            removeErrorPopup(dnfInput);
        }
    }

    function resetUI() {
        isProcessing = false;
        simplifyBtn.disabled = false;
        symbolButtons.forEach(btn => btn.disabled = false);
        deleteBtn.disabled = false;
    }

    symbolButtons.forEach(button => {
        button.addEventListener('click', () => {
            const symbol = button.dataset.symbol;
            if (symbol) insertSymbol(symbol);
        });
    });

    deleteBtn.addEventListener('click', () => {
        if (isProcessing) return;
        dnfInput.value = dnfInput.value.slice(0, -1);
        dnfInput.focus();
        validateInputOnChange();
    });

    simplifyBtn.addEventListener('click', () => {
        if (isProcessing) return;
        isProcessing = true;
        simplifyBtn.disabled = true;
        symbolButtons.forEach(btn => btn.disabled = true);
        deleteBtn.disabled = true;

        const dnf = dnfInput.value.trim();
        const validation = validateDNF(dnf);

        if (!validation.valid) {
            showFeedback(validation.message, 'error');
            clearErrorPopups();
            resetUI();
            return;
        }

        try {
            const simplified = simplifyDNF(dnf);
            display.textContent = simplified;
            showFeedback('Упрощение выполнено успешно!', 'correct');
            clearErrorPopups();
        } 
        catch (error) {
            showFeedback('Ошибка: ' + error.message, 'error');
            clearErrorPopups();
        }

        resetUI();
    });

    clearBtn.addEventListener('click', () => {
        if (isProcessing) return;
        dnfInput.value = '';
        display.textContent = '';
        clearErrorPopups();
        hideFeedback();
        dnfInput.focus();
        resetUI();
    });

    // Закрытие окна с защитой от немедленного закрытия
    let lastToggleClick = 0;
    document.addEventListener('click', (event) => {
        if (!constructionWindow.contains(event.target) && 
            !document.getElementById('fab-constructor').contains(event.target)) {
            constructionWindow.classList.remove('open');
            clearErrorPopups();
            hideFeedback();
        }
    });

    dnfInput.addEventListener('input', () => {
        if (isProcessing) {
            dnfInput.value = dnfInput.value.slice(0, -1);
            return;
        }
        if (!/^[a-d¬∧∨()\s]*$/.test(dnfInput.value)) {
            dnfInput.value = dnfInput.value.replace(/[^a-d¬∧∨()\s]/g, '');
            showErrorPopup(dnfInput, 'Разрешены только a, b, c, d, ¬, ∧, ∨, (, ) и пробелы');
        } 
        else {
            validateInputOnChange();
        }
    });

    dnfInput.addEventListener('paste', (event) => {
        const pastedText = (event.clipboardData || window.clipboardData).getData('text');
        if (!/^[a-d¬∧∨()\s]*$/.test(pastedText)) {
            event.preventDefault();
            showErrorPopup(dnfInput, 'Вставка содержит недопустимые символы');
        }
    });
});