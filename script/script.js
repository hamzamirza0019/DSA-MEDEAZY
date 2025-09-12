// ======= STATE VARIABLES (Track quiz state globally) =======
let currentView = 'home';         // Current visible screen/page
let selectedTopic = null;         // Currently selected topic ID
let currentQuestionIndex = 0;     // Index of the current question
let score = 0;                    // User's score in the current quiz
let userAnswers = [];             // Stores user's selected answers
let currentQuestions = [];        // Questions from the selected topic
let showResults = false;          // Flag to track if result is being shown


// ======= PAGE NAVIGATION FUNCTIONS =======

// Switches to the specified page (by ID) and updates current view
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active'); // Hide all pages
    });
    document.getElementById(pageId).classList.add('active'); // Show selected page
    currentView = pageId.replace('Page', ''); // E.g., 'homePage' -> 'home'
}

function showHome() {
    showPage('homePage');
}

function showTopics() {
    showPage('topicsPage');
    renderTopics(); // Populate topics dynamically
}

function showQuiz() {
    showPage('quizPage');
    startQuiz(); // Begin the quiz for selected topic
}

function showResultsPage() {
    showPage('resultsPage');
    renderResults(); // Show final score
}

function showDashboard() {
    showPage('dashboardPage');
    renderDashboard(); // Show progress across topics
}


// ======= RENDER TOPICS ON SCREEN =======
function renderTopics() {
    const topicsGrid = document.getElementById('topicsGrid');
    topicsGrid.innerHTML = ''; // Clear existing topics

    topics.forEach(topic => {
        const topicCard = document.createElement('div');
        topicCard.className = 'topic-card';
        topicCard.onclick = () => selectTopic(topic.id); // Select this topic on click

        const totalQuestions = questionsData[topic.id]?.length || 0;
        // Calculate progress as a percentage
        const progressPercentage = totalQuestions > 0 ? Math.round((topic.completed / totalQuestions) * 100) : 0;

        // Create the topic card layout
        topicCard.innerHTML = `
            <div class="topic-header">
                <div class="topic-info">
                    <div class="topic-icon">${topic.icon}</div>
                    <div>
                        <div class="topic-title">${topic.name}</div>
                        <div class="topic-subtitle">${totalQuestions} questions</div>
                    </div>
                </div>
                <div class="difficulty-badge difficulty-${topic.difficulty.toLowerCase()}">
                    ${topic.difficulty}
                </div>
            </div>
            <div class="topic-progress">
                <div class="progress-info">
                    <span>Progress</span>
                    <span>${topic.completed}/${totalQuestions}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
        `;
        topicsGrid.appendChild(topicCard);
    });
}


// ======= TOPIC SELECTION & QUIZ SETUP =======
function selectTopic(topicId) {
    selectedTopic = topicId;
    currentQuestions = questionsData[topicId] || []; // Load questions from DB
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    showQuiz(); // Switch to quiz screen
}

function startQuiz() {
    if (!currentQuestions.length) {
        alert('No questions available!');
        showTopics();
        return;
    }
    renderQuestion(); // Show first question
}


// ======= RENDER EACH QUESTION =======
function renderQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;

    // Update progress bar and counter
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = Math.round(progress) + '% Complete';
    document.getElementById('questionCounter').textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
    document.getElementById('questionText').textContent = question.question;

    // Render answer options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.innerHTML = `<strong>${String.fromCharCode(65 + index)}.</strong> ${option}`;
        button.onclick = () => selectAnswer(index); // On click, check answer
        optionsContainer.appendChild(button);
    });

    // Hide explanation initially
    document.getElementById('explanationText').classList.add('hidden');
    document.getElementById('explanationText').textContent = '';

    // Hide next button initially
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.style.display = 'none';
}


// ======= HANDLE ANSWER SELECTION =======
function selectAnswer(answerIndex) {
    const question = currentQuestions[currentQuestionIndex];
    const buttons = document.querySelectorAll('.option-btn');

    // Don't allow re-answering the same question
    if (userAnswers[currentQuestionIndex] !== undefined) return;

    // Disable all option buttons after selection
    buttons.forEach(btn => btn.disabled = true);

    // Check correctness
    if (answerIndex === question.correct) {
        buttons[answerIndex].classList.add('correct');
        score++;
    } else {
        buttons[answerIndex].classList.add('incorrect');
        buttons[question.correct].classList.add('correct');
    }

    // Store the user's answer
    userAnswers[currentQuestionIndex] = answerIndex;

    // Show explanation (FIXED: was not visible due to className)
    const explanationEl = document.getElementById('explanationText');
    explanationEl.textContent = question.explanation;
    explanationEl.classList.remove('hidden');

    // Show next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.style.display = 'inline-block';
}


// ======= GO TO NEXT QUESTION / SHOW RESULT =======
function goToNext() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        // Mark the topic as completed
        const topic = topics.find(t => t.id === selectedTopic);
        if (topic) {
            topic.completed = currentQuestions.length; // Mark all questions as completed for this topic
        }
        showResultsPage(); // Quiz ends, show results
    }
}


// ======= SHOW FINAL RESULT =======
function renderResults() {
    const percentage = Math.round((score / currentQuestions.length) * 100);
    document.getElementById('scorePercentage').textContent = percentage + '%';
    document.getElementById('scoreText').textContent = `Your Score: ${score}/${currentQuestions.length}`;

    // Render stars based on score
    const starsContainer = document.getElementById('starsContainer');
    starsContainer.innerHTML = '';
    const starCount = Math.floor(percentage / 20);

    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = i < starCount ? 'star' : 'star empty';
        star.textContent = '⭐';
        starsContainer.appendChild(star);
    }
}


// ======= SHOW DASHBOARD WITH TOPIC PROGRESS =======
function renderDashboard() {
    const topicProgress = document.getElementById('topicProgress');
    if (!topicProgress) return;

    topicProgress.innerHTML = ''; // Clear existing

    topics.forEach(topic => {
        const progressItem = document.createElement('div');
        progressItem.className = 'topic-progress-item';
        

        const progressPercentage = Math.round((topic.completed / questionsData[topic.id].length) * 100);

        progressItem.innerHTML = `
            <div class="topic-progress-info">
                <span class="topic-icon">${topic.icon}</span>
                <div>
                    <div class="topic-title">${topic.name}</div>
                    <div class="topic-subtitle">${topic.completed}/${questionsData[topic.id].length} completed</div>
                </div>
            </div>
            <div class="topic-progress-stats">
                <div class="topic-progress-bar">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                <div class="difficulty-badge difficulty-${topic.difficulty.toLowerCase()}">
                    ${topic.difficulty}
                </div>
            </div>
        `;
        topicProgress.appendChild(progressItem);
    });
}


// ======= INITIALIZE ON PAGE LOAD =======
document.addEventListener('DOMContentLoaded', function () {
    showHome(); // Start from home page
});
