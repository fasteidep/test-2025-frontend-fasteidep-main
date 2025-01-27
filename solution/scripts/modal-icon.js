document.addEventListener('DOMContentLoaded', () => {
    const questionsContainer = document.querySelector('.questions-container');
    const addButton = document.querySelector('[test-id="add-question-button"]');
    const removeButton = document.querySelector('[test-id="remove-question-button"]');
    const saveButton = document.querySelector('[test-id="save-button"]');
    const errorLabel = document.querySelector('.Error-form'); // Убедитесь, что этот элемент существует

    let questionCount = 1;

    // Добавление нового вопроса
    addButton.addEventListener('click', () => {
        questionCount++;
        const newQuestionContainer = document.createElement('div');
        newQuestionContainer.className = 'questions-container';
        newQuestionContainer.innerHTML = `
            <label>Вопрос ${questionCount}</label>
            <input type="text" test-id="new-test-question" class="question-input">
            <div class="question-group">
                <div class="input-grid" test-id="new-test-options">
                    <div class="option">
                        <input type="radio" name="question-${questionCount}" value="1">
                        <input type="text">
                    </div>
                    <div class="option">
                        <input type="radio" name="question-${questionCount}" value="2">
                        <input type="text">
                    </div>
                    <div class="option">
                        <input type="radio" name="question-${questionCount}" value="3">
                        <input type="text">
                    </div>
                    <div class="option">
                        <input type="radio" name="question-${questionCount}" value="4">
                        <input type="text">
                    </div>
                </div>
            </div>
        `;
        questionsContainer.appendChild(newQuestionContainer);
    });

    // Удаление последнего вопроса
    removeButton.addEventListener('click', () => {
        if (questionCount > 1) {
            questionsContainer.removeChild(questionsContainer.lastChild);
            questionCount--;
        }
    });

    // Сохранение теста
    saveButton.addEventListener('click', handleSaveTest);

    function handleSaveTest(e) {
        e.preventDefault();
    
        const title = document.querySelector('[test-id="new-test-title"]').value;
    
        const questions = [];
        let isValid = true;
        let isAllFieldsFilled = true;
        let isAllAnswersSelected = true;
    
        // Проверка текстовых полей
        const textInputs = document.querySelectorAll('input[type="text"]');
        textInputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.backgroundColor = 'var(--color-negative-status)';
                isAllFieldsFilled = false;
            } else {
                input.style.backgroundColor = '';
            }
        });
    
        // Проверка выбора правильного ответа
        const questionContainers = document.querySelectorAll('.questions-container');
        questionContainers.forEach((container, questionIndex) => {
            const correctAnswer = container.querySelector('input[type="radio"]:checked');
    
            if (!correctAnswer) {
                isAllAnswersSelected = false;
            }
    
            const options = Array.from(container.querySelectorAll('.option')).map((option, optionIndex) => {
                return {
                    id: `id${questionIndex + 1}${optionIndex + 1}`,
                    text: option.querySelector('input[type="text"]').value
                };
            });
    
            questions.push({
                id: `id${questionIndex + 1}`,
                question: container.querySelector('[test-id="new-test-question"]').value,
                options: options,
                correct: correctAnswer ? options[parseInt(correctAnswer.value) - 1].id : null
            });
        });
    
        // Отображение ошибок
        if (!isAllFieldsFilled) {
            errorLabel.textContent = 'Все поля должны быть заполнены.';
            errorLabel.style.display = 'block';
            isValid = false;
        } else if (!isAllAnswersSelected) {
            errorLabel.textContent = 'Выберите правильный ответ в созданных вопросах.';
            errorLabel.style.display = 'block';
            isValid = false;
        } else {
            errorLabel.style.display = 'none';
        }
    
        // Если всё в порядке, сохраняем тест
        if (isValid) {
            const test = {
                id: `id${Math.random().toString(36).substr(2, 9)}`, // Генерация уникального ID
                title: title,
                questions: questions
            };
    
            const tests = JSON.parse(localStorage.getItem('tests')) || [];
            tests.push(test);
            localStorage.setItem('tests', JSON.stringify(tests));
    
            const modal = document.querySelector('[test-id="form-modal"]');
            modal.style.display = 'none';
    
            window.location.reload(); // Перезагрузка страницы
        }
    }
});