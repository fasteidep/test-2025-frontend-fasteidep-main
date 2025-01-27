document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('testId');
    console.log('testId из URL:', testId);

    const testTitle = document.querySelector('[test-id="test-title"]');
    const questionBlock = document.querySelector('[test-id="question"]');
    const questionText = questionBlock.querySelector('.question-text');
    const questionOptions = document.querySelector('[test-id="question-options"]');
    const prevButton = document.querySelector('[test-id="prev-question"]');
    const nextButton = document.querySelector('[test-id="next-question"]');
    const finishButton = document.querySelector('[test-id="finish-button"]');
    const resetButton = document.querySelector('[test-id="reset-test-button"]');
    const navigation = document.querySelector('[test-id="navigation"]');
    const modal = document.querySelector('[test-id="modal"]');
    const correctAnswersLabel = document.getElementById('correct-answers');
    const wrongAnswersLabel = document.getElementById('wrong-answers');
    const unansweredLabel = document.getElementById('unanswered-label');
    const unansweredQuestionsLabel = document.getElementById('unanswered-questions');
    const understandButton = document.querySelector('.understand');
    const yesActionButton = document.getElementById('yes-action');
    const noActionButton = document.getElementById('no-action');
    const confirmationTitle = document.getElementById('confirmation-title');

    let currentTest = null;
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let results = { correct: 0, wrong: 0, unanswered: 0 };
    let isTestCompleted = false;

    const STORAGE_KEY = 'testProgress';

    // Проверка доступности localStorage
    function isLocalStorageAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Сохранение прогресса
    function saveProgress() {
        if (isLocalStorageAvailable() && currentTest) {
            const progress = {
                testId: currentTest.id,
                userAnswers,
                currentQuestionIndex,
                isCompleted: isTestCompleted,
            };
            console.log('Сохранение прогресса:', progress); // Логирование
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        }
    }

    // Загрузка прогресса
    function loadProgress() {
        if (isLocalStorageAvailable()) {
            const progress = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (progress && progress.testId === currentTest.id) {
                userAnswers = progress.userAnswers || [];
                isTestCompleted = progress.isCompleted || false;
    
                // Находим первый незавершенный вопрос
                const firstUnansweredIndex = currentTest.questions.findIndex(
                    (_, index) => !userAnswers[index]
                );
    
                // Устанавливаем текущий вопрос как первый незавершенный
                currentQuestionIndex = firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
    
                console.log('Восстановлено состояние:', { currentQuestionIndex, userAnswers }); // Логирование
    
                if (isTestCompleted) {
                    lockTestInterface();
                    finishButton.style.display = 'none';
                    resetButton.style.display = 'block';
                }
            }
        }
    }

    // Очистка прогресса
    function clearProgress() {
        if (isLocalStorageAvailable()) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    // Блокировка интерфейса после завершения теста
    function lockTestInterface() {
        const answerButtons = document.querySelectorAll('.question-button');
        answerButtons.forEach(button => {
            button.disabled = true;
        });

        prevButton.disabled = false;
        nextButton.disabled = false;

        const navButtons = navigation.querySelectorAll('.button-list-elem');
        navButtons.forEach(button => {
            button.disabled = false;
        });
    }

    // Загрузка теста
    function loadTest(testId) {
        fetch('/data.json')
            .then(response => response.json())
            .then(data => {
                currentTest = data.find(test => test.id === testId);
                if (!currentTest) {
                    // Если тест не найден в data.json, ищем в localStorage
                    const userTests = JSON.parse(localStorage.getItem('tests')) || [];
                    currentTest = userTests.find(test => test.id === testId);
                }
    
                if (currentTest) {
                    const testTitle = document.querySelector('[test-id="test-title"]');
                    testTitle.textContent = currentTest.title;
                    loadProgress();
                    renderQuestion(currentQuestionIndex);
                    renderNavigation();
                    updateNavigationButtons();
                    updateMobileView();
                    updateFinishButton();
    
                    if (isTestCompleted) {
                        lockTestInterface();
                    }
                } else {
                    console.error('Тест не найден');
                    alert('Тест не найден. Перенаправление на страницу со списком тестов.');
                    window.location.href = 'index.html';
                }
            })
            .catch(error => console.error('Ошибка загрузки теста:', error));
    }

    // Отрисовка вопроса
    function renderQuestion(index) {
        console.log('Отображение вопроса с индексом:', index); // Логирование
        const question = currentTest.questions[index];
        questionText.textContent = question.question;
        questionOptions.innerHTML = ''; // Очищаем предыдущие варианты ответов
    
        question.options.forEach((option) => {
            const button = document.createElement('button');
            button.className = 'question-button';
            button.setAttribute('test-id', 'question-option'); // Добавляем атрибут test-id
            button.textContent = option.text;
    
            if (userAnswers[index]) {
                const selectedOptionId = userAnswers[index].optionId;
    
                if (option.id === selectedOptionId) {
                    button.style.backgroundColor = userAnswers[index].isCorrect
                        ? 'var(--color-positive-status)'
                        : 'var(--color-negative-status)';
                } else {
                    button.style.opacity = '0.5';
                    button.disabled = true;
                }
            }
    
            button.addEventListener('click', () => handleAnswer(option.id, index));
            if (isTestCompleted) {
                button.disabled = true;
            }
    
            questionOptions.appendChild(button);
        });
    
        updateNavigation(index);
        updateNavigationButtons();
    }

    // Обработка ответа
    function handleAnswer(optionId, questionIndex) {
        if (isTestCompleted) return;
        if (userAnswers[questionIndex]) return;
    
        const question = currentTest.questions[questionIndex];
        const isCorrect = optionId === question.correct;
        userAnswers[questionIndex] = { optionId, isCorrect };
        saveProgress();
    
        const answerButtons = document.querySelectorAll('.question-button');
    
        answerButtons.forEach(button => {
            const buttonText = button.textContent;
            const selectedOptionText = question.options.find(opt => opt.id === optionId).text;
    
            if (buttonText === selectedOptionText) {
                button.disabled = false;
                button.style.backgroundColor = isCorrect
                    ? 'var(--color-positive-status)'
                    : 'var(--color-negative-status)';
                button.style.opacity = '1';
            } else {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.backgroundColor = '#e0e0e0';
            }
        });
    
        if (window.innerWidth <= 576) {
            console.log('Обновление мобильного вида для вопроса:', questionIndex); // Логирование
            updateMobileView();
        } else {
            console.log('Отрисовка вопроса:', questionIndex); // Логирование
            renderQuestion(questionIndex);
        }
    
        updateFinishButton();
    }

    // Обновление навигации
    function updateNavigation(index) {
        const navButtons = document.querySelectorAll('[test-id="navigation-item"]');
        navButtons.forEach((button, i) => {
            if (i === index) {
                button.style.border = '1px solid black';
            } else {
                button.style.border = '';
            }
            if (userAnswers[i]) {
                button.style.backgroundColor = userAnswers[i].isCorrect
                    ? 'var(--color-positive-status)'
                    : 'var(--color-negative-status)';
            } else {
                button.style.backgroundColor = '';
            }
        });
    }

    // Отрисовка навигации
    function renderNavigation() {
        navigation.innerHTML = ''; // Очищаем предыдущие элементы навигации

        currentTest.questions.forEach((question, i) => {
            const button = document.createElement('button');
            button.className = 'button-list-elem';
            button.setAttribute('test-id', 'navigation-item'); // Добавляем атрибут test-id
            button.textContent = `Вопрос ${i + 1}`;

            if (userAnswers[i]) {
                button.style.backgroundColor = userAnswers[i].isCorrect
                    ? 'var(--color-positive-status)'
                    : 'var(--color-negative-status)';
            }

            button.addEventListener('click', () => {
                currentQuestionIndex = i;
                renderQuestion(i);
                updateNavigation(i);
            });

            navigation.appendChild(button);
        });

        updateNavigation(currentQuestionIndex);
    }

    // Обновление кнопок навигации
    function updateNavigationButtons() {
        prevButton.disabled = currentQuestionIndex === 0;
        nextButton.disabled = currentQuestionIndex === currentTest.questions.length - 1;
    }

    // Обработчики кнопок "Назад" и "Вперед"
    prevButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion(currentQuestionIndex);
            updateNavigation(currentQuestionIndex);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentQuestionIndex < currentTest.questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion(currentQuestionIndex);
            updateNavigation(currentQuestionIndex);
        }
    });

    // Обновление кнопки "Завершить"
    function updateFinishButton() {
        finishButton.disabled = false; // Кнопка всегда активна
        finishButton.style.display = 'block'; // Убедитесь, что кнопка видима
    }

    // Показ модального окна
    function showModal(type) {
        document.querySelector('.complete-test').style.display = 'none';
        document.querySelector('.confirmation-modal').style.display = 'none';

        if (type === 'complete-test') {
            document.querySelector('.complete-test').style.display = 'block';
        } else if (type === 'confirmation-finish') {
            confirmationTitle.textContent = 'Вы точно хотите завершить тест?';
            document.querySelector('.confirmation-modal').style.display = 'block';
        } else if (type === 'confirmation-replay') {
            confirmationTitle.textContent = 'Вы точно хотите перепройти тест?';
            document.querySelector('.confirmation-modal').style.display = 'block';
        }

        modal.style.display = 'block'; // Убедитесь, что модальное окно отображается сразу
    }

    // Закрытие модального окна
    function closeModal() {
        modal.style.display = 'none';
    }

    // Обработчики для модального окна
    finishButton.addEventListener('click', () => {
        const unanswered = currentTest.questions.length - userAnswers.length;
        if (unanswered > 0) {
            showModal('confirmation-finish');
        } else {
            showResults();
        }
    });

    yesActionButton.addEventListener('click', () => {
        if (confirmationTitle.textContent.includes('завершить')) {
            closeModal();
            showResults();
        } else if (confirmationTitle.textContent.includes('перепройти')) {
            resetTest();
            closeModal();
        }
    });

    noActionButton.addEventListener('click', closeModal);

    resetButton.addEventListener('click', () => {
        showModal('confirmation-replay');
    });

    understandButton.addEventListener('click', () => {
        closeModal();
        finishButton.style.display = 'none';
        resetButton.style.display = 'block';
        lockTestInterface();
        isTestCompleted = true;
        saveProgress();
    });

    // Показ результатов
    function showResults() {
        results = { correct: 0, wrong: 0, unanswered: 0 };
        currentTest.questions.forEach((question, i) => {
            if (userAnswers[i]) {
                if (userAnswers[i].isCorrect) {
                    results.correct++;
                } else {
                    results.wrong++;
                }
            } else {
                results.unanswered++;
            }
        });
    
        correctAnswersLabel.textContent = results.correct;
        wrongAnswersLabel.textContent = results.wrong;
        unansweredQuestionsLabel.textContent = results.unanswered;
    
        // Удаляем блок "Вопросов без ответа", если все вопросы отвечены
        if (results.unanswered === 0) {
            unansweredLabel.remove(); // Удаляем элемент из DOM
        } else {
            unansweredLabel.style.display = 'block'; // Показываем блок, если есть неотвеченные вопросы
        }
    
        showModal('complete-test');
    }

    // Сброс теста
    function resetTest() {
        currentQuestionIndex = 0;
        userAnswers = [];
        results = { correct: 0, wrong: 0, unanswered: 0 };
        isTestCompleted = false;
        clearProgress();
        renderQuestion(currentQuestionIndex);
        renderNavigation();
        updateFinishButton();

        const answerButtons = document.querySelectorAll('.question-button');
        answerButtons.forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.backgroundColor = '';
        });
        prevButton.disabled = false;
        nextButton.disabled = false;
        finishButton.disabled = false;
        finishButton.style.display = 'block';
        resetButton.style.display = 'none';

        // Сбрасываем результаты
        correctAnswersLabel.textContent = '0';
        wrongAnswersLabel.textContent = '0';
        unansweredQuestionsLabel.textContent = '0';
        unansweredLabel.style.display = 'block'; // Блок "Вопросов без ответа" всегда отображается

        if (window.innerWidth <= 600) {
            updateMobileView();
        }
    }

    // Обработчик для кнопки "Назад к списку тестов"
    document.querySelector('[test-id="back-to-test-list-page"]').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Обновление мобильного вида
    function updateMobileView() {
        if (window.innerWidth <= 500) {
            const rightPart = document.querySelector('.right-part');
            rightPart.innerHTML = ''; // Очищаем содержимое правой части
    
            // Добавляем заголовок теста
            const title = document.createElement('h2');
            title.className = 'title-test';
            title.textContent = currentTest.title;
            rightPart.appendChild(title);
    
            // Создаем контейнер для всех вопросов
            const questionsContainer = document.createElement('div');
            questionsContainer.className = 'questions-container';
    
            // Отрисовываем все вопросы
            currentTest.questions.forEach((question, index) => {
                const questionPart = document.createElement('div');
                questionPart.className = 'question-part';
                questionPart.setAttribute('test-id', 'question'); // Добавляем атрибут test-id
    
                // Текст вопроса
                const questionText = document.createElement('h1');
                questionText.className = 'question-text';
                questionText.textContent = question.question;
                questionPart.appendChild(questionText);
    
                // Контейнер для вариантов ответа
                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'questions';
                optionsContainer.setAttribute('test-id', 'question-options'); // Добавляем атрибут test-id
    
                // Отрисовываем варианты ответа
                question.options.forEach((option, i) => {
                    const button = document.createElement('button');
                    button.className = 'question-button';
                    button.setAttribute('test-id', 'question-option'); // Добавляем атрибут test-id
                    button.textContent = option.text;
    
                    // Если ответ уже выбран, применяем стили
                    if (userAnswers[index]) {
                        const selectedOptionId = userAnswers[index].optionId;
    
                        if (option.id === selectedOptionId) {
                            button.style.backgroundColor = userAnswers[index].isCorrect
                                ? 'var(--color-positive-status)'
                                : 'var(--color-negative-status)';
                        } else {
                            button.style.opacity = '0.5';
                            button.disabled = true;
                        }
                    }
    
                    // Обработчик клика на вариант ответа
                    button.addEventListener('click', () => handleAnswer(option.id, index));
    
                    // Если тест завершен, блокируем кнопки
                    if (isTestCompleted) {
                        button.disabled = true;
                    }
    
                    optionsContainer.appendChild(button);
                });
    
                // Добавляем варианты ответа в блок вопроса
                questionPart.appendChild(optionsContainer);
    
                // Добавляем блок вопроса в контейнер всех вопросов
                questionsContainer.appendChild(questionPart);
            });
    
            // Добавляем контейнер всех вопросов в правую часть
            rightPart.appendChild(questionsContainer);
    
            // Кнопка "Завершить" (если тест не завершен)
            if (finishButton.style.display !== 'none') {
                const finishButtonMobile = document.createElement('button');
                finishButtonMobile.className = 'button-stop';
                finishButtonMobile.setAttribute('test-id', 'finish-button');
                finishButtonMobile.textContent = 'Завершить';
                finishButtonMobile.addEventListener('click', () => {
                    const unanswered = currentTest.questions.length - userAnswers.length;
                    if (unanswered > 0) {
                        showModal('confirmation-finish');
                    } else {
                        showResults();
                    }
                });
                rightPart.appendChild(finishButtonMobile);
            }
    
            // Кнопка "Перепройти тест" (если тест завершен)
            if (isTestCompleted) {
                const resetButtonMobile = document.createElement('button');
                resetButtonMobile.className = 'button-reset';
                resetButtonMobile.setAttribute('test-id', 'reset-test-button');
                resetButtonMobile.textContent = 'Перепройти тест';
                resetButtonMobile.addEventListener('click', () => {
                    showModal('confirmation-replay');
                });
                rightPart.appendChild(resetButtonMobile);
            }
    
            // Скрываем кнопки "Назад" и "Вперед" на мобильных устройствах
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
        } else {
            // На десктопе возвращаем стандартное отображение
            prevButton.style.display = 'block';
            nextButton.style.display = 'block';
            renderQuestion(currentQuestionIndex);
        }
    }

    window.addEventListener('resize', updateMobileView);

    if (testId) {
        loadTest(testId);
    }
});