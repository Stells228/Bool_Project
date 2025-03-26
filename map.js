document.addEventListener('DOMContentLoaded', () => {
    const levelScroll = document.querySelector('.level-scroll');
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    const mainMenuBtn = document.getElementById('main-menu-btn');

    // фиксированная ширина блока + gap
    const scrollAmount = 344 + 20; 

    scrollLeftBtn.addEventListener('click', () => {
        levelScroll.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    scrollRightBtn.addEventListener('click', () => {
        levelScroll.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    
    mainMenuBtn.addEventListener('click', () => {
        window.location.href = 'main.html';
    });
}); 
