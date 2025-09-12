// Firebase SDK v9 compat (loaded via <script> in HTML)

const firebaseConfig = {
  apiKey: "AIzaSyBSmQJzlrDMazFbR2pYNvKm_xDUP5g92qo",
  authDomain: "dsa-medeazy.firebaseapp.com",
  projectId: "dsa-medeazy",
  storageBucket: "dsa-medeazy.firebasestorage.app",
  messagingSenderId: "362385530363",
  appId: "1:362385530363:web:8c7d5bc19fc358bbe3ff5e",
  measurementId: "G-K9B15SZHJM"
};

// Initialize Firebase
let app, auth, db;

try {
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  console.log('Firebase initialized successfully');
  console.log('Auth domain:', firebaseConfig.authDomain);
  console.log('Project ID:', firebaseConfig.projectId);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Retry after a short delay
  setTimeout(() => {
    try {
      app = firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      console.log('Firebase initialized on retry');
    } catch (retryError) {
      console.error('Firebase retry failed:', retryError);
    }
  }, 1000);
}

// Global user state
let currentUser = null;
let userProgress = {};
let demoMode = false; // Demo mode flag

// Wait for Firebase to be ready
let firebaseReady = false;

// Check if Firebase is loaded
function checkFirebaseReady() {
  if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    firebaseReady = true;
    initializeFirebase();
  } else {
    setTimeout(checkFirebaseReady, 100);
  }
}

// Initialize Firebase when ready
function initializeFirebase() {
  if (!firebaseReady) return;
  
  console.log('Firebase initialized successfully');
  // Firebase is already initialized in the global scope
}

// ======= DEMO MODE FUNCTIONS =======

// Enable demo mode when Firebase auth is not available
function enableDemoMode() {
  demoMode = true;
  currentUser = {
    uid: 'demo-user',
    displayName: 'Demo User',
    email: 'demo@example.com'
  };
  
  // Initialize demo progress
  userProgress = {
    topics: {
      arrays: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      strings: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      linkedlists: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      trees: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      graphs: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      dp: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 }
    },
    totalQuestionsCompleted: 0,
    totalAttempted: 0,
    totalCorrect: 0,
    averageScore: 0,
    currentStreak: 0,
    lastActiveDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  console.log('Demo mode enabled');
  updateAuthUI();
  showNotification('Demo mode enabled - data will be saved locally only', 'info');
}

// Demo mode sign in
function demoSignIn() {
  enableDemoMode();
  closeModal('loginModal');
}

// Demo mode sign up
function demoSignUp() {
  enableDemoMode();
  closeModal('signupModal');
}

// Save demo progress to localStorage
function saveDemoProgress(topicId, score, totalQuestions) {
  const topicProgress = userProgress.topics[topicId] || { 
    completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 
  };
  
  // Update topic progress
  topicProgress.completed = Math.max(topicProgress.completed, totalQuestions);
  topicProgress.total = totalQuestions;
  topicProgress.bestScore = Math.max(topicProgress.bestScore, score);
  topicProgress.attempts += 1;
  topicProgress.correctAnswers += score; // Add correct answers from this quiz
  topicProgress.totalAttempted += totalQuestions; // Add total questions attempted
  
  // Update overall progress
  userProgress.topics[topicId] = topicProgress;
  userProgress.totalQuestionsCompleted = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.completed, 0);
  userProgress.totalAttempted = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.totalAttempted, 0);
  userProgress.totalCorrect = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.correctAnswers, 0);
  
  // Calculate average score
  const totalAttempts = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.attempts, 0);
  const totalScore = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + (topic.bestScore * topic.attempts), 0);
  userProgress.averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
  
  userProgress.lastActiveDate = new Date().toISOString();
  
  // Save to localStorage
  localStorage.setItem('dsaDemoProgress', JSON.stringify(userProgress));
  console.log('Demo progress saved to localStorage');
  showNotification('Progress saved locally (demo mode)', 'success');
  updateProgressUI();
}

// ======= AUTHENTICATION FUNCTIONS =======

// Google Login
function signInWithGoogle() {
  if (!auth) {
    console.error('Firebase auth not initialized');
    showNotification('Authentication not available. Using demo mode instead.', 'warning');
    enableDemoMode();
    return;
  }
  
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      currentUser = result.user;
      console.log('User signed in:', currentUser.displayName);
      updateAuthUI();
      loadUserProgress();
    })
    .catch(error => {
      console.error("Login error:", error.message);
      if (error.code === 'auth/configuration-not-found') {
        showNotification('Authentication not configured. Using demo mode instead.', 'warning');
        enableDemoMode();
      } else {
        showNotification('Login failed. Please try again.', 'error');
      }
    });
}

// Email/Password Login
function signInWithEmail(email, password) {
  if (!auth) {
    console.error('Firebase auth not initialized');
    showNotification('Authentication not available. Using demo mode instead.', 'warning');
    enableDemoMode();
    return;
  }
  
  console.log('Attempting to sign in with email:', email);
  console.log('Auth object available:', !!auth);
  console.log('Auth domain:', firebaseConfig.authDomain);
  
  auth.signInWithEmailAndPassword(email, password)
    .then(result => {
      currentUser = result.user;
      console.log('User signed in successfully:', currentUser.email);
      updateAuthUI();
      loadUserProgress();
      showNotification('Successfully signed in!', 'success');
    })
    .catch(error => {
      console.error("Login error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.code === 'auth/configuration-not-found') {
        console.error('Firebase Auth configuration not found. Please check:');
        console.error('1. Email/Password auth is enabled in Firebase Console');
        console.error('2. Project ID and auth domain are correct');
        console.error('3. API key is valid');
        showNotification('Authentication not configured. Please enable Email/Password auth in Firebase Console.', 'error');
        return;
      }
      
      let errorMessage = 'Login failed. ';
      if (error.code === 'auth/user-not-found') {
        errorMessage += 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage += 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address.';
      } else {
        errorMessage += error.message;
      }
      
      showNotification(errorMessage, 'error');
    });
}

// Email/Password Sign Up
function signUpWithEmail(email, password, displayName) {
  if (!auth) {
    console.error('Firebase auth not initialized');
    showNotification('Authentication not available. Using demo mode instead.', 'warning');
    enableDemoMode();
    return;
  }
  
  console.log('Attempting to sign up with email:', email);
  console.log('Auth object available:', !!auth);
  console.log('Auth domain:', firebaseConfig.authDomain);
  
  auth.createUserWithEmailAndPassword(email, password)
    .then(result => {
      currentUser = result.user;
      console.log('User created successfully:', currentUser.uid);
      // Update display name
      return currentUser.updateProfile({ displayName: displayName });
    })
    .then(() => {
      console.log('User profile updated:', currentUser.displayName);
      updateAuthUI();
      initializeUserProgress();
      showNotification('Account created successfully!', 'success');
    })
    .catch(error => {
      console.error("Sign up error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.code === 'auth/configuration-not-found') {
        console.error('Firebase Auth configuration not found. Please check:');
        console.error('1. Email/Password auth is enabled in Firebase Console');
        console.error('2. Project ID and auth domain are correct');
        console.error('3. API key is valid');
        showNotification('Authentication not configured. Please enable Email/Password auth in Firebase Console.', 'error');
        return;
      }
      
      let errorMessage = 'Sign up failed. ';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage += 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage += 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address.';
      } else {
        errorMessage += error.message;
      }
      
      showNotification(errorMessage, 'error');
    });
}

// Logout
function logout() {
  if (!auth) {
    console.error('Firebase auth not initialized');
    return;
  }
  
  auth.signOut()
    .then(() => {
      currentUser = null;
      userProgress = {};
      console.log('User signed out');
      updateAuthUI();
      showNotification('Successfully logged out', 'success');
    })
    .catch(error => {
      console.error("Logout error:", error.message);
    });
}

// ======= USER PROGRESS FUNCTIONS =======

// Initialize user progress in Firestore
function initializeUserProgress() {
  if (!currentUser || !db) return;
  
  const userRef = db.collection('users').doc(currentUser.uid);
  const initialProgress = {
    topics: {
      arrays: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      strings: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      linkedlists: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      trees: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      graphs: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      dp: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 }
    },
    totalQuestionsCompleted: 0,
    totalAttempted: 0,
    totalCorrect: 0,
    averageScore: 0,
    currentStreak: 0,
    lastActiveDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  userRef.set(initialProgress)
    .then(() => {
      userProgress = initialProgress;
      console.log('User progress initialized');
    })
    .catch(error => {
      console.error('Error initializing user progress:', error);
    });
}

// Load user progress from Firestore (primary) with localStorage fallback
function loadUserProgress() {
  if (!currentUser) {
    console.log('No user logged in, skipping progress load');
    return;
  }
  
  // If in demo mode, load from localStorage
  if (demoMode) {
    loadDemoProgress();
    return;
  }
  
  // Try to load from Firebase first
  if (db) {
    console.log('Loading user progress from Firebase for:', currentUser.uid);
    const userRef = db.collection('users').doc(currentUser.uid);
    userRef.get()
      .then(doc => {
        if (doc.exists) {
          userProgress = doc.data();
          console.log('User progress loaded from Firebase:', userProgress);
          updateProgressUI();
          // Also cache locally for offline access
          cacheProgressLocally();
        } else {
          console.log('No user progress found in Firebase, initializing...');
          initializeUserProgress();
        }
      })
      .catch(error => {
        console.error('Error loading from Firebase, trying local cache:', error);
        // Fallback to local storage if Firebase fails
        loadFromLocalCache();
      });
  } else {
    console.log('Database not available, trying local cache');
    loadFromLocalCache();
  }
}

// Load demo progress from localStorage
function loadDemoProgress() {
  const savedProgress = localStorage.getItem('dsaDemoProgress');
  if (savedProgress) {
    userProgress = JSON.parse(savedProgress);
    console.log('Demo progress loaded from localStorage:', userProgress);
  } else {
    console.log('No demo progress found, using default');
  }
  updateProgressUI();
}

// Cache progress locally for offline access
function cacheProgressLocally() {
  if (!currentUser || !userProgress) return;
  
  const cacheKey = `dsaProgress_${currentUser.uid}`;
  localStorage.setItem(cacheKey, JSON.stringify(userProgress));
  console.log('Progress cached locally for offline access');
}

// Load progress from local cache
function loadFromLocalCache() {
  if (!currentUser) return;
  
  const cacheKey = `dsaProgress_${currentUser.uid}`;
  const cachedProgress = localStorage.getItem(cacheKey);
  
  if (cachedProgress) {
    userProgress = JSON.parse(cachedProgress);
    console.log('User progress loaded from local cache:', userProgress);
    updateProgressUI();
    showNotification('Loaded from local cache. Some data may be outdated.', 'info');
  } else {
    console.log('No cached progress found, initializing...');
    initializeUserProgress();
  }
}

// Save quiz result to Firestore (primary) and localStorage (cache)
function saveQuizResult(topicId, score, totalQuestions) {
  if (!currentUser) {
    console.log('No user authenticated, cannot save to Firebase');
    return;
  }
  
  // Calculate progress updates
  const topicProgress = userProgress.topics[topicId] || { 
    completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 
  };
  
  // Update topic progress
  topicProgress.completed = Math.max(topicProgress.completed, totalQuestions);
  topicProgress.total = totalQuestions;
  topicProgress.bestScore = Math.max(topicProgress.bestScore, score);
  topicProgress.attempts += 1;
  topicProgress.correctAnswers += score; // Add correct answers from this quiz
  topicProgress.totalAttempted += totalQuestions; // Add total questions attempted
  
  // Update overall progress
  userProgress.topics[topicId] = topicProgress;
  
  // Calculate overall totals
  userProgress.totalQuestionsCompleted = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.completed, 0);
  userProgress.totalAttempted = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.totalAttempted, 0);
  userProgress.totalCorrect = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.correctAnswers, 0);
  
  // Calculate average score
  const totalAttempts = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.attempts, 0);
  const totalScore = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + (topic.bestScore * topic.attempts), 0);
  userProgress.averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
  
  userProgress.lastActiveDate = new Date().toISOString();
  
  // Try to save to Firebase first (if available and not in demo mode)
  if (db && !demoMode) {
    const userRef = db.collection('users').doc(currentUser.uid);
    
    userRef.update(userProgress)
      .then(() => {
        console.log('Quiz result saved to Firebase');
        showNotification('Progress saved successfully!', 'success');
        updateProgressUI();
        // Also cache locally for faster access
        cacheProgressLocally();
      })
      .catch(error => {
        console.error('Error saving to Firebase, falling back to local storage:', error);
        showNotification('Failed to save to cloud. Using local storage.', 'warning');
        // Fallback to local storage if Firebase fails
        saveDemoProgress(topicId, score, totalQuestions);
      });
  } else {
    // If no Firebase or in demo mode, use local storage
    console.log('Using local storage for data persistence');
    saveDemoProgress(topicId, score, totalQuestions);
  }
}

// ======= UI UPDATE FUNCTIONS =======

// Update authentication UI
function updateAuthUI() {
  const authButtons = document.getElementById('authButtons');
  const userInfo = document.getElementById('userInfo');
  
  if (currentUser) {
    // User is logged in
    if (authButtons) {
      authButtons.innerHTML = `
        <div class="user-info">
          <span class="user-name">Welcome, ${currentUser.displayName || currentUser.email}</span>
          <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>
        </div>
      `;
    }
  } else {
    // User is not logged in
    if (authButtons) {
      authButtons.innerHTML = `
        <button class="btn btn-outline btn-sm" onclick="showLoginModal()">Login</button>
        <button class="btn btn-primary btn-sm" onclick="showSignupModal()">Sign Up</button>
      `;
    }
  }
}

// Update progress UI
function updateProgressUI() {
  if (!userProgress || !currentUser) return;
  
  // Update dashboard stats
  const totalAttempted = document.getElementById('totalAttempted');
  const totalCorrect = document.getElementById('totalCorrect');
  const averageScore = document.getElementById('averageScore');
  
  if (totalAttempted) {
    totalAttempted.textContent = userProgress.totalAttempted || 0;
  }
  if (totalCorrect) {
    totalCorrect.textContent = userProgress.totalCorrect || 0;
  }
  if (averageScore) {
    averageScore.textContent = `${userProgress.averageScore || 0}%`;
  }
  
  // Update topic progress
  updateTopicProgress();
}

// Update topic progress in UI
function updateTopicProgress() {
  if (!userProgress) return;
  
  // Update topics array with progress data
  topics.forEach(topic => {
    const progress = userProgress.topics[topic.id];
    if (progress) {
      topic.completed = progress.completed;
    }
  });
  
  // Re-render dashboard if it's currently visible
  if (typeof renderDashboard === 'function' && currentView === 'dashboard') {
    renderDashboard();
  }
}

// ======= NOTIFICATION SYSTEM =======

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  // Set background color based on type
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };
  notification.style.backgroundColor = colors[type] || colors.info;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ======= LEADERBOARD FUNCTIONS =======

// Get leaderboard data
function getLeaderboard() {
  // If in demo mode, return demo leaderboard as Promise
  if (demoMode) {
    return Promise.resolve(getDemoLeaderboard());
  }
  
  if (!db) {
    console.error('Firestore not initialized');
    return Promise.resolve([]);
  }
  
  return db.collection('users')
    .orderBy('totalQuestionsCompleted', 'desc')
    .limit(10)
    .get()
    .then(snapshot => {
      const leaderboard = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        leaderboard.push({
          id: doc.id,
          name: data.displayName || 'Anonymous',
          questionsCompleted: data.totalQuestionsCompleted || 0,
          averageScore: data.averageScore || 0
        });
      });
      return leaderboard;
    })
    .catch(error => {
      console.error('Error getting leaderboard:', error);
      // Fallback to demo leaderboard if Firebase fails
      return Promise.resolve(getDemoLeaderboard());
    });
}

// Get demo leaderboard data
function getDemoLeaderboard() {
  const currentUserProgress = userProgress?.totalQuestionsCompleted || 0;
  const currentUserScore = userProgress?.averageScore || 0;
  
  const demoLeaderboard = [
    { id: 'demo-1', name: 'Demo User', questionsCompleted: currentUserProgress, averageScore: currentUserScore },
    { id: 'demo-2', name: 'Alice Johnson', questionsCompleted: Math.max(45, currentUserProgress + 10), averageScore: 85 },
    { id: 'demo-3', name: 'Bob Smith', questionsCompleted: Math.max(38, currentUserProgress + 5), averageScore: 78 },
    { id: 'demo-4', name: 'Carol Davis', questionsCompleted: Math.max(32, currentUserProgress + 2), averageScore: 82 },
    { id: 'demo-5', name: 'David Wilson', questionsCompleted: Math.max(28, currentUserProgress + 1), averageScore: 75 },
    { id: 'demo-6', name: 'Eva Brown', questionsCompleted: Math.max(25, currentUserProgress), averageScore: 88 },
    { id: 'demo-7', name: 'Frank Miller', questionsCompleted: Math.max(22, Math.max(0, currentUserProgress - 2)), averageScore: 70 },
    { id: 'demo-8', name: 'Grace Lee', questionsCompleted: Math.max(18, Math.max(0, currentUserProgress - 5)), averageScore: 80 },
    { id: 'demo-9', name: 'Henry Taylor', questionsCompleted: Math.max(15, Math.max(0, currentUserProgress - 8)), averageScore: 72 },
    { id: 'demo-10', name: 'Ivy Chen', questionsCompleted: Math.max(12, Math.max(0, currentUserProgress - 10)), averageScore: 85 }
  ];
  
  // Sort by questions completed
  return demoLeaderboard.sort((a, b) => b.questionsCompleted - a.questionsCompleted);
}

// Render leaderboard
function renderLeaderboard() {
  const leaderboardContainer = document.getElementById('leaderboardContainer');
  if (!leaderboardContainer) return;
  
  // Show loading state
  leaderboardContainer.innerHTML = '<p class="text-center">Loading leaderboard...</p>';
  
  getLeaderboard()
    .then(leaderboard => {
      leaderboardContainer.innerHTML = '';
      
      if (!leaderboard || leaderboard.length === 0) {
        leaderboardContainer.innerHTML = '<p class="text-center">No data available yet.</p>';
        return;
      }
      
      // Add demo mode indicator
      if (demoMode) {
        const demoIndicator = document.createElement('div');
        demoIndicator.className = 'demo-indicator';
        demoIndicator.innerHTML = '<p class="text-center text-sm text-gray-500 mb-3">📊 Demo Leaderboard - Your progress is highlighted</p>';
        leaderboardContainer.appendChild(demoIndicator);
      }
      
      leaderboard.forEach((user, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        
        // Highlight current user in demo mode
        const isCurrentUser = demoMode && user.id === 'demo-1';
        const userCardClass = isCurrentUser ? 'leaderboard-item current-user' : 'leaderboard-item';
        
        const userCard = document.createElement('div');
        userCard.className = userCardClass;
        userCard.innerHTML = `
          <div class="leaderboard-rank">${medal}</div>
          <div class="leaderboard-info">
            <div class="leaderboard-name">${user.name} ${isCurrentUser ? '(You)' : ''}</div>
            <div class="leaderboard-stats">
              <span>${user.questionsCompleted} questions</span>
              <span>${user.averageScore}% avg</span>
            </div>
          </div>
        `;
        leaderboardContainer.appendChild(userCard);
      });
    })
    .catch(error => {
      console.error('Error rendering leaderboard:', error);
      leaderboardContainer.innerHTML = '<p class="text-center">Error loading leaderboard. Please try again.</p>';
    });
}

// ======= AUTH STATE LISTENER =======

// Listen for auth state changes
auth.onAuthStateChanged(user => {
  currentUser = user;
  updateAuthUI();
  
  if (user) {
    loadUserProgress();
  } else {
    userProgress = {};
    // Clear local cache when user logs out
    if (typeof Storage !== "undefined") {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('dsaProgress_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
});

// Sync local cache with Firebase when coming back online
window.addEventListener('online', () => {
  if (currentUser && !demoMode) {
    console.log('Connection restored, syncing with Firebase...');
    loadUserProgress();
  }
});
