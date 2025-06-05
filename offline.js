document.addEventListener('DOMContentLoaded', () => {
    // Лекции по булевым функциям
    const boolLectures = [
      { id: 1, title: '1. Двоичные наборы', path: 'bool/lec1.html' },
      { id: 2, title: '2. Булевы функции', path: 'bool/lec2.html' },
      { id: 3, title: '3. Остаточные функции', path: 'bool/lec3.html' },
      { id: 4, title: '4. Суперпозиция и термы', path: 'bool/lec4.html' },
      { id: 5, title: '5. Дизъюнктивные формы', path: 'bool/lec5.html' },
      { id: 6, title: '6. Полином Жегалкина', path: 'bool/lec6.html' },
      { id: 7, title: '7. Замкнутость и полнота', path: 'bool/lec7.html' },
      { id: 8, title: '8. Классы функций', path: 'bool/lec8.html' },
      { id: 9, title: '9. Минимизация ДНФ', path: 'bool/lec9.html' }
    ];
  
    // Лекции по теории графов
    const graphLectures = [
      { id: 1, title: '1. Введение в теорию графов', path: 'graph/glec1.html' },
      { id: 2, title: '2. Основные определения', path: 'graph/glec2.html' },
      { id: 3, title: '3. Представление графа', path: 'graph/glec3.html' },
      { id: 4, title: '4. Операции над графами', path: 'graph/glec4.html' },
      { id: 5, title: '5. Пути и связность', path: 'graph/glec5.html' },
      { id: 6, title: '6. Специальные графы', path: 'graph/glec6.html' },
      { id: 7, title: '7. Планарные графы', path: 'graph/glec7.html' },
      { id: 8, title: '8. Раскраска графов', path: 'graph/glec8.html' },
      { id: 9, title: '9. Деревья', path: 'graph/glec9.html' },
      { id: 10, title: '10. Двоичные деревья', path: 'graph/glec10.html' },
      { id: 11, title: '11. Остовные деревья', path: 'graph/glec11.html' },
      { id: 12, title: '12. Ориентированные деревья', path: 'graph/glec12.html' },
      { id: 13, title: '13. Расстояния в графе', path: 'graph/glec13.html' }
    ];
  
    // Загрузка результатов тестов из localStorage
    const loadLectureResults = () => {
      try {
        return JSON.parse(localStorage.getItem('lectureTestResults')) || {};
      } catch (e) {
        return {};
      }
    };
  
    // Отображение лекций
    const renderLectures = (lectures, containerId, prefix) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const results = loadLectureResults();
      
      lectures.forEach(lecture => {
        const lectureBlock = document.createElement('div');
        lectureBlock.className = 'lecture-block';
        
        const title = document.createElement('div');
        title.className = 'lecture-title';
        title.textContent = lecture.title;
        lectureBlock.appendChild(title);
        
        const starsContainer = document.createElement('div');
        starsContainer.className = 'lecture-stars';
        
        // Показываем звёзды рейтинга, если есть результаты
        const resultKey = `${prefix}${lecture.id}`;
        const result = results[resultKey];
        
        if (result) {
          const percentage = (result.correct / result.total) * 100;
          
          for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'lecture-star';
            
            if (percentage === 100 && i < 3 ||
                percentage >= 50 && i < 2 ||
                percentage >= 30 && i < 1) {
              star.classList.add('filled');
            }
            
            starsContainer.appendChild(star);
          }
        } else {
          // Показываем серые звёзды, если результатов нет
          for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'lecture-star';
            starsContainer.appendChild(star);
          }
        }
        
        lectureBlock.appendChild(starsContainer);
        
        // Обработчик клика для перехода к лекции
        lectureBlock.addEventListener('click', () => {
          window.location.href = lecture.path;
        });
        
        container.appendChild(lectureBlock);
      });
    };
  
    // Инициализация страницы
    renderLectures(boolLectures, 'bool-lectures', 'lecture');
    renderLectures(graphLectures, 'graph-lectures', 'glec');
    
    // Проверяем доступность лекций
    const checkLecturesAvailability = () => {
      const allLectures = [...boolLectures, ...graphLectures];
      let availableCount = 0;
      
      allLectures.forEach(lecture => {
        const img = new Image();
        img.src = lecture.path;
        img.onload = () => availableCount++;
      });
      
      setTimeout(() => {
        if (availableCount === 0) {
          const message = document.createElement('p');
          message.textContent = 'Лекции не загружены. Для работы в оффлайне откройте приложение при наличии интернета.';
          message.style.color = '#ff9999';
          message.style.marginTop = '20px';
          
          const container = document.querySelector('.offline-container');
          if (container) container.appendChild(message);
        }
      }, 1000);
    };
    
    checkLecturesAvailability();
  });
  