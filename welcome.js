document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    
    welcomeScreen.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
    });
});