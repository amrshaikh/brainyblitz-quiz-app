// --- DOM ELEMENTS ---
const homeScreen = document.getElementById('home-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const reviewScreen = document.getElementById('review-screen');

const categoryGrid = document.getElementById('category-grid');
const difficultySelect = document.getElementById('difficulty-select');
const startQuizBtn = document.getElementById('start-quiz-btn');
const startQuizText = document.getElementById('start-quiz-text');
const spinner = document.getElementById('spinner');

const quizCategoryTitle = document.getElementById('quiz-category-title');
const questionCounter = document.getElementById('question-counter');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers-container');
const nextBtn = document.getElementById('next-btn');
const scoreEl = document.getElementById('score');
const resultMessageEl = document.getElementById('result-message');
const tryAgainBtn = document.getElementById('try-again-btn');
const goHomeBtn = document.getElementById('go-home-btn');
const timerBar = document.getElementById('timer-bar');
const reviewAnswersBtn = document.getElementById('review-answers-btn');
const reviewContainer = document.getElementById('review-container');
const backToResultsBtn = document.getElementById('back-to-results-btn');

// --- STATE VARIABLES ---
let selectedCategoryCard = null;
let currentCategory = '';
let currentDifficulty = '';
let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let userAnswers = [];
let selectedAnswer = null;
let timerInterval = null;
const TIME_LIMIT = 15;

// --- DATA ---
const categoryMap = {
    "General Knowledge": 9, "Science": 17, "History": 23, "Movies": 11,
    "Music": 12, "Sports": 21, "Technology": 18, "Art": 25
};

// --- FUNCTIONS ---

function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

async function fetchQuestions(categoryName, difficulty) {
    const categoryId = categoryMap[categoryName];
    const url = `https://opentdb.com/api.php?amount=10&category=${categoryId}&difficulty=${difficulty}&type=multiple`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.results.length === 0) {
            alert("Sorry, no questions found for this category and difficulty. Please try another combination.");
            return null;
        }

        return data.results.map(q => ({
            question: decodeHtml(q.question),
            answers: [...q.incorrect_answers.map(decodeHtml), decodeHtml(q.correct_answer)].sort(() => Math.random() - 0.5),
            correct: decodeHtml(q.correct_answer)
        }));
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        alert("Failed to load questions. Please check your internet connection and try again.");
        return null;
    }
}

function createCategoryCards() {
    const categories = Object.keys(categoryMap);
    categoryGrid.innerHTML = '';
    const categoryColors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    categories.forEach((category, index) => {
        const card = document.createElement('button');
        card.className = `category-card p-4 rounded-lg text-white font-bold text-center text-lg shadow-md flex items-center justify-center ${categoryColors[index % categoryColors.length]}`;
        card.textContent = category;
        card.addEventListener('click', () => selectCategory(card, category));
        categoryGrid.appendChild(card);
    });
}

function selectCategory(card, category) {
    if (selectedCategoryCard) {
        selectedCategoryCard.classList.remove('selected');
    }
    selectedCategoryCard = card;
    selectedCategoryCard.classList.add('selected');
    currentCategory = category;
    startQuizBtn.disabled = false;
}

async function startQuiz() {
    currentDifficulty = difficultySelect.value;
    
    // Show spinner and hide text
    startQuizText.classList.add('hidden');
    spinner.classList.remove('hidden');
    startQuizBtn.disabled = true;

    questions = await fetchQuestions(currentCategory, currentDifficulty);

    // Hide spinner and show text
    spinner.classList.add('hidden');
    startQuizText.classList.remove('hidden');

    if (!questions) {
        // If fetching fails, re-enable the button if a category is still selected
        if (currentCategory) {
            startQuizBtn.disabled = false;
        }
        return;
    }

    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    
    homeScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    showQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = TIME_LIMIT;
    timerBar.style.width = '100%';
    timerBar.style.transition = 'width 1s linear';

    timerInterval = setInterval(() => {
        timeLeft--;
        timerBar.style.width = `${(timeLeft / TIME_LIMIT) * 100}%`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            nextQuestion();
        }
    }, 1000);
}

function showQuestion() {
    selectedAnswer = null;
    const question = questions[currentQuestionIndex];
    quizCategoryTitle.textContent = currentCategory;
    questionCounter.textContent = currentQuestionIndex + 1;
    questionText.textContent = question.question;
    
    answersContainer.innerHTML = '';
    question.answers.forEach(answer => {
        const button = document.createElement('button');
        button.className = 'answer-btn border-2 border-gray-300 p-3 rounded-lg text-left hover:bg-gray-100';
        button.textContent = answer;
        button.addEventListener('click', () => selectAnswer(button));
        answersContainer.appendChild(button);
    });
    nextBtn.disabled = true;
    startTimer();
}

function selectAnswer(button) {
    if (selectedAnswer) {
        selectedAnswer.classList.remove('selected');
    }
    selectedAnswer = button;
    selectedAnswer.classList.add('selected');
    nextBtn.disabled = false;
}

function nextQuestion() {
    clearInterval(timerInterval);
    userAnswers.push(selectedAnswer ? selectedAnswer.textContent : null);
    if (selectedAnswer && selectedAnswer.textContent === questions[currentQuestionIndex].correct) {
        score++;
    }
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    const percentage = Math.round((score / questions.length) * 100);
    scoreEl.textContent = `${percentage}%`;

    if (percentage === 100) {
        resultMessageEl.textContent = "Excellent! You got a perfect score!";
        confetti({ particleCount: 150, spread: 180, origin: { y: 0.6 } });
    } else if (percentage >= 75) {
        resultMessageEl.textContent = "Great job! You know your stuff.";
    } else if (percentage >= 50) {
        resultMessageEl.textContent = "Not bad! A little more practice and you'll be an expert.";
    } else {
        resultMessageEl.textContent = "Keep trying! You'll get there.";
    }
}

function showReview() {
    resultScreen.classList.add('hidden');
    reviewScreen.classList.remove('hidden');
    reviewContainer.innerHTML = '';

    questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const questionDiv = document.createElement('div');
        questionDiv.className = 'bg-gray-50 p-4 rounded-lg';
        questionDiv.innerHTML = `<p class="font-bold mb-4">${index + 1}. ${question.question}</p>`;
        
        const reviewAnswersContainer = document.createElement('div');
        reviewAnswersContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';

        question.answers.forEach(answer => {
            const button = document.createElement('button');
            button.className = 'answer-btn border-2 border-gray-300 p-3 rounded-lg text-left';
            button.textContent = answer;
            button.disabled = true;
            if (answer === question.correct) button.classList.add('correct');
            if (answer === userAnswer && userAnswer !== question.correct) button.classList.add('incorrect');
            reviewAnswersContainer.appendChild(button);
        });
        questionDiv.appendChild(reviewAnswersContainer);
        reviewContainer.appendChild(questionDiv);
    });
}

function restartQuiz() {
    startQuiz();
}

function goHome() {
    resultScreen.classList.add('hidden');
    reviewScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    
    // Reset selection state
    if (selectedCategoryCard) {
        selectedCategoryCard.classList.remove('selected');
    }
    selectedCategoryCard = null;
    currentCategory = '';
    startQuizBtn.disabled = true;
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    createCategoryCards();
    startQuizBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    tryAgainBtn.addEventListener('click', restartQuiz);
    goHomeBtn.addEventListener('click', goHome);
    reviewAnswersBtn.addEventListener('click', showReview);
    backToResultsBtn.addEventListener('click', () => {
        reviewScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
    });
});
