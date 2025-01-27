document.addEventListener('DOMContentLoaded', () => {
    const testList = document.querySelector('[test-id="list-items"]');
    const addTestButton = document.querySelector('[test-id="list-add-button"]');
    const modal = document.querySelector('[test-id="form-modal"]');
    const errorLabel = document.querySelector('.Error-form');

    let predefinedTests = []; // Встроенные тесты
    let userTests = JSON.parse(localStorage.getItem('tests')) || []; // Пользовательские тесты

    // Загрузка встроенных тестов из data.json
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            return response.json();
        })
        .then(data => {
            predefinedTests = data;
            renderTestList([...predefinedTests, ...userTests]); // Объединяем встроенные и пользовательские тесты
        })
        .catch(error => {
            testList.innerHTML = '<p>Не удалось загрузить тесты. Пожалуйста, попробуйте позже.</p>';
        });

    // Функция для отрисовки списка тестов
    function renderTestList(tests) {
        testList.innerHTML = ''; // Очищаем список перед обновлением
        if (tests.length === 0) {
            testList.innerHTML = '<p>Тесты не найдены.</p>';
            return;
        }

        tests.forEach((test) => {
            const testItem = document.createElement('div');
            testItem.className = 'test-item';
            testItem.innerHTML = `
                <span test-id="list-item-title">${test.title}</span>
                <button test-id="list-item-delete" class="delete-button">🗑</button>
            `;
            testList.appendChild(testItem);

            // Переход на страницу теста
            testItem.querySelector('span').addEventListener('click', () => {
                window.location.href = `index.html?testId=${test.id}`; // Переход на index.html с testId
            });

            // Удаление теста
            const deleteButton = testItem.querySelector('button');
            const isPredefined = predefinedTests.some(predefinedTest => predefinedTest.id === test.id);
            if (isPredefined) {
                deleteButton.disabled = true; // Запрещаем удаление встроенных тестов
            } else {
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Предотвращаем всплытие события
                    userTests = userTests.filter(userTest => userTest.id !== test.id); // Удаляем тест из массива
                    localStorage.setItem('tests', JSON.stringify(userTests)); // Обновляем localStorage
                    renderTestList([...predefinedTests, ...userTests]); // Перерисовываем список
                });
            }
        });
    }

    // Открытие модального окна для добавления теста
    addTestButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Закрытие модального окна при клике вне его
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});