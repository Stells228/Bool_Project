document.addEventListener('DOMContentLoaded', () => {
    const mainMenuBtn = document.getElementById('main-menu-btn');
    if (mainMenuBtn) {
        mainMenuBtn.style.display = 'flex';
        mainMenuBtn.style.opacity = '1'; 
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const mainMenuBtn = document.getElementById('main-menu-btn');
    const levelScroll = document.querySelector('.level-scroll');
    const levelLinks = document.querySelectorAll('.level-block-link');

    if (!mainMenuBtn || !levelScroll || !levelLinks.length) {
        console.error('Critical elements missing:', { mainMenuBtn, levelScroll, levelLinks });
        return;
    } 

    // Создаём и сбрасываем overlay
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);
    transitionOverlay.classList.remove('active');

    // Обработчик кнопки главного меню
    mainMenuBtn.addEventListener('click', () => {
        // Отключаем анимации облаков для плавного перехода
        document.querySelectorAll('.cloud1, .cloud2, .cloud3, .cloud4, .cloud5').forEach(el => {
            el.style.animation = 'none';
        });

        transitionOverlay.classList.add('active');
        setTimeout(() => {
            window.location.href = 'gmain.html';
        }, 300);
    });

    levelLinks.forEach(link => {
        const levelBlock = link.querySelector('.level-block');
        const level = parseInt(levelBlock.dataset.level);
        const href = `glevel/glevel${level}.html`;
        link.classList.remove('disabled');
        link.setAttribute('href', href);
    });

    // Плавное появление страницы
    document.body.style.opacity = '1';
});
