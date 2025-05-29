document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '1';

    const lectureContainer = document.querySelector('.lecture-container');
    const upButton = document.querySelector('.up-button');
    const homeButton = document.getElementById('homeButton');

    homeButton?.addEventListener('click', () => window.location.href = '../main.html');



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

    // движуха для карточек
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', function () {
            this.classList.toggle('flipped');
        });
    });

    // Плавное скроллирование 
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
});