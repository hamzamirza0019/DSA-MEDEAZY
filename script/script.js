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
    
    // Show loading state
    const topicProgress = document.getElementById('topicProgress');
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    
    if (topicProgress) {
        topicProgress.innerHTML = '<div class="text-center">Loading progress...</div>';
    }
    if (leaderboardContainer) {
        leaderboardContainer.innerHTML = '<div class="text-center">Loading leaderboard...</div>';
    }
    
    // Refresh data from Firebase if user is logged in
    if (typeof loadUserProgress === 'function') {
        loadUserProgress();
    }
    
    renderDashboard(); // Show progress across topics
    
    // Load leaderboard if function exists
    if (typeof renderLeaderboard === 'function') {
        renderLeaderboard();
    }
}

function scrollToContact() {
    // First show home page if not already visible
    showHome();
    // Then scroll to contact section
    setTimeout(() => {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100);
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
    document.getElementById('explanationText').classList.remove('show');
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

    // Show explanation
    const explanationEl = document.getElementById('explanationText');
    explanationEl.textContent = question.explanation;
    explanationEl.classList.add('show');

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
        
        // Save quiz result to Firebase
        if (typeof saveQuizResult === 'function') {
            saveQuizResult(selectedTopic, score, currentQuestions.length);
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
        
        const totalQuestions = questionsData[topic.id]?.length || 0;
        const completed = topic.completed || 0;
        const progressPercentage = totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;

        progressItem.innerHTML = `
            <div class="topic-progress-info">
                <span class="topic-icon">${topic.icon}</span>
                <div>
                    <div class="topic-title">${topic.name}</div>
                    <div class="topic-subtitle">${completed}/${totalQuestions} completed</div>
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


// ======= MODAL FUNCTIONS =======
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('signupModal').style.display = 'none';
}

function showSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
    document.getElementById('loginModal').style.display = 'none';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (event.target === signupModal) {
        signupModal.style.display = 'none';
    }
}

// ======= FORM HANDLERS =======
function handleLogin(event) {
    event.preventDefault();
    
    // Check current session before proceeding
    if (typeof checkCurrentSessionBeforeLogin === 'function') {
        if (checkCurrentSessionBeforeLogin()) {
            closeModal('loginModal');
            return;
        }
    }
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (typeof signInWithEmail === 'function') {
        signInWithEmail(email, password);
        // closeModal will be called by the auth function
    } else {
        console.error('signInWithEmail function not available');
        showNotification('Authentication service not available', 'error');
    }
}

function handleSignup(event) {
    event.preventDefault();
    
    // Check current session before proceeding
    if (typeof checkCurrentSessionBeforeLogin === 'function') {
        if (checkCurrentSessionBeforeLogin()) {
            closeModal('signupModal');
            return;
        }
    }
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (typeof signUpWithEmail === 'function') {
        signUpWithEmail(email, password, name);
        // closeModal will be called by the auth function
    } else {
        console.error('signUpWithEmail function not available');
        showNotification('Authentication service not available', 'error');
    }
}

// ======= INITIALIZE ON PAGE LOAD =======
document.addEventListener('DOMContentLoaded', function () {
    showHome(); // Start from home page
    
    // Initialize auth UI after Firebase loads
    setTimeout(() => {
        if (typeof updateAuthUI === 'function') {
            updateAuthUI();
        } else {
            console.log('Firebase not loaded, showing fallback UI');
            // Show fallback auth UI
            const authButtons = document.getElementById('authButtons');
            if (authButtons) {
                authButtons.innerHTML = `
                    <button class="btn btn-outline btn-sm" onclick="alert('Firebase not loaded. Please refresh the page.')">Login</button>
                    <button class="btn btn-primary btn-sm" onclick="alert('Firebase not loaded. Please refresh the page.')">Sign Up</button>
                `;
            }
        }
    }, 2000);
});



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



    // Show explanation

    const explanationEl = document.getElementById('explanationText');

    explanationEl.textContent = question.explanation;

    explanationEl.classList.add('show');



    // Show next button

    const nextBtn = document.getElementById('nextBtn');

    if (nextBtn) nextBtn.style.display = 'inline-block';







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

        

        // Save quiz result to Firebase

        if (typeof saveQuizResult === 'function') {

            saveQuizResult(selectedTopic, score, currentQuestions.length);

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

        

        const totalQuestions = questionsData[topic.id]?.length || 0;

        const completed = topic.completed || 0;

        const progressPercentage = totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;



        progressItem.innerHTML = `

            <div class="topic-progress-info">

                <span class="topic-icon">${topic.icon}</span>

                <div>

                    <div class="topic-title">${topic.name}</div>

                    <div class="topic-subtitle">${completed}/${totalQuestions} completed</div>

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





// ======= MODAL FUNCTIONS =======

function showLoginModal() {

    document.getElementById('loginModal').style.display = 'block';

    document.getElementById('signupModal').style.display = 'none';

}



function showSignupModal() {

    document.getElementById('signupModal').style.display = 'block';

    document.getElementById('loginModal').style.display = 'none';

}



function closeModal(modalId) {

    document.getElementById(modalId).style.display = 'none';

}



// Close modal when clicking outside

window.onclick = function(event) {

    const loginModal = document.getElementById('loginModal');

    const signupModal = document.getElementById('signupModal');

    

    if (event.target === loginModal) {

        loginModal.style.display = 'none';

    }

    if (event.target === signupModal) {

        signupModal.style.display = 'none';

    }

}



// ======= FORM HANDLERS =======

function handleLogin(event) {

    event.preventDefault();

    const email = document.getElementById('loginEmail').value;

    const password = document.getElementById('loginPassword').value;

    

    if (typeof signInWithEmail === 'function') {

        signInWithEmail(email, password);

        closeModal('loginModal');

    }

}



function handleSignup(event) {

    event.preventDefault();

    const name = document.getElementById('signupName').value;

    const email = document.getElementById('signupEmail').value;

    const password = document.getElementById('signupPassword').value;

    

    if (typeof signUpWithEmail === 'function') {

        signUpWithEmail(email, password, name);

        closeModal('signupModal');

    }

}



// ======= INITIALIZE ON PAGE LOAD =======

document.addEventListener('DOMContentLoaded', function () {

    showHome(); // Start from home page

    

    // Initialize auth UI after Firebase loads

    setTimeout(() => {

        if (typeof updateAuthUI === 'function') {

            updateAuthUI();

        } else {

            console.log('Firebase not loaded, showing fallback UI');

            // Show fallback auth UI

            const authButtons = document.getElementById('authButtons');

            if (authButtons) {

                authButtons.innerHTML = `

                    <button class="btn btn-outline btn-sm" onclick="alert('Firebase not loaded. Please refresh the page.')">Login</button>

                    <button class="btn btn-primary btn-sm" onclick="alert('Firebase not loaded. Please refresh the page.')">Sign Up</button>

                `;

            }

        }

    }, 2000);

});


