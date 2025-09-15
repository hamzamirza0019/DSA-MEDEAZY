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
let authStatePersisted = false; // Track if auth state is saved to localStorage
let isCrossTabSyncEnabled = true; // Enable cross-tab synchronization
let sessionId = generateSessionId(); // Unique session ID for this tab

// ======= SIMPLIFIED LOCALSTORAGE SESSION MANAGEMENT =======

// Save user session to localStorage under 'user' key
function saveUserSession(userData) {
  if (userData) {
    const sessionData = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      demoMode: demoMode,
      timestamp: Date.now(),
      lastLogin: Date.now()
    };
    localStorage.setItem('user', JSON.stringify(sessionData));
    console.log('User session saved to localStorage under "user" key');
  } else {
    localStorage.removeItem('user');
    console.log('User session cleared from localStorage');
  }
}

// Load user session from localStorage
function loadUserSession() {
  const userSession = localStorage.getItem('user');
  if (userSession) {
    try {
      const sessionData = JSON.parse(userSession);
      const isRecent = (Date.now() - sessionData.timestamp) < (24 * 60 * 60 * 1000); // 24 hours
      
      if (isRecent) {
        console.log('Valid user session found in localStorage');
        return sessionData;
      } else {
        console.log('User session expired, clearing from localStorage');
        localStorage.removeItem('user');
        return null;
      }
    } catch (error) {
      console.error('Error parsing user session:', error);
      localStorage.removeItem('user');
      return null;
    }
  }
  return null;
}

// Update UI based on current session
function updateUIFromSession() {
  const sessionData = loadUserSession();
  
  if (sessionData) {
    // User is logged in
    if (sessionData.demoMode) {
      // Restore demo mode
      enableDemoMode();
    } else {
      // For Firebase auth, the onAuthStateChanged will handle the user object
      console.log('Session found, waiting for Firebase auth state...');
    }
  } else {
    // User is not logged in
    currentUser = null;
    userProgress = {};
    demoMode = false;
    updateAuthUI();
    updateDashboardUI();
  }
}

// Handle storage events for cross-tab synchronization
function handleStorageChange(event) {
  if (event.key === 'user') {
    console.log('User session changed in another tab');
    
    if (event.newValue === null) {
      // User logged out in another tab
      handleLogoutFromOtherTab();
    } else {
      // User logged in in another tab
      handleLoginFromOtherTab();
    }
  }
}

// Handle logout from another tab
function handleLogoutFromOtherTab() {
  console.log('User logged out from another tab');
  
  // Clear current state
  currentUser = null;
  userProgress = {};
  demoMode = false;
  
  // Update UI
  updateAuthUI();
  updateDashboardUI();
  
  // Close any open modals
  closeLoginModal();
  
  // Show notification
  showNotification('You have been logged out from another tab', 'info');
}

// Handle login from another tab
function handleLoginFromOtherTab() {
  console.log('User logged in from another tab');
  
  // Update UI from the new session
  updateUIFromSession();
  
  // Show notification
  showNotification('Login detected from another tab', 'info');
}

// Check current session before login attempt
function checkCurrentSessionBeforeLogin() {
  const sessionData = loadUserSession();
  if (sessionData) {
    console.log('Existing session found, user is already logged in');
    updateUIFromSession();
    return true; // Already logged in
  }
  return false; // Not logged in, proceed with login
}

// Initialize session management
function initializeSessionManagement() {
  // Listen for storage changes
  window.addEventListener('storage', handleStorageChange);
  
  // Check for existing session on page load
  updateUIFromSession();
  
  console.log('Session management initialized');
}

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
  // Check if already logged in
  if (checkCurrentSessionBeforeLogin()) {
    closeLoginModal();
    return;
  }
  
  enableDemoMode();
  saveUserSession(currentUser);
  closeLoginModal();
  updateDashboardUI();
  showNotification('Demo mode enabled - data will be saved locally', 'success');
}

// Demo mode sign up
function demoSignUp() {
  // Check if already logged in
  if (checkCurrentSessionBeforeLogin()) {
    closeLoginModal();
    return;
  }
  
  enableDemoMode();
  saveUserSession(currentUser);
  closeLoginModal();
  updateDashboardUI();
  showNotification('Demo mode enabled - data will be saved locally', 'success');
}

// Save demo progress to localStorage
function saveDemoProgress(topicId, score, totalQuestions) {
  const topicProgress = userProgress.topics[topicId] || { 
    completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 
  };
  
  // Check if this is a new topic (no previous attempts)
  const isNewTopic = topicProgress.attempts === 0;
  
  // Update topic progress
  topicProgress.completed = Math.max(topicProgress.completed, totalQuestions);
  topicProgress.total = totalQuestions;
  topicProgress.bestScore = Math.max(topicProgress.bestScore, score);
  topicProgress.attempts += 1;
  
  // Always increment correctAnswers by the current score
  topicProgress.correctAnswers += score;
  
  // Only increment totalAttempted for new topics
  if (isNewTopic) {
    topicProgress.totalAttempted += totalQuestions;
  }
  
  // Update overall progress
  userProgress.topics[topicId] = topicProgress;
  
  // Recalculate overall totals
  userProgress.totalQuestionsCompleted = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.completed, 0);
  userProgress.totalAttempted = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.totalAttempted, 0);
  userProgress.totalCorrect = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.correctAnswers, 0);
  
  // Calculate average score: (totalCorrect / totalAttempted) × 100
  userProgress.averageScore = userProgress.totalAttempted > 0 
    ? Math.round((userProgress.totalCorrect / userProgress.totalAttempted) * 100) 
    : 0;
  
  userProgress.lastActiveDate = new Date().toISOString();
  
  // Save to localStorage
  localStorage.setItem('dsaDemoProgress', JSON.stringify(userProgress));
  console.log('Demo progress saved to localStorage');
  showNotification('Progress saved locally (demo mode)', 'success');
  updateProgressUI();
  // Update leaderboard in real-time
  debouncedLeaderboardUpdate();
}

// ======= AUTHENTICATION STATE MANAGEMENT =======

// Generate unique session ID for this tab
function generateSessionId() {
  return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Save authentication state to localStorage with cross-tab sync
function saveAuthState(user, triggerEvent = true) {
  if (user) {
    const authState = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      demoMode: demoMode,
      timestamp: Date.now(),
      sessionId: sessionId,
      lastUpdate: Date.now()
    };
    localStorage.setItem('dsaAuthState', JSON.stringify(authState));
    
    // Store current session info
    localStorage.setItem('dsaCurrentSession', JSON.stringify({
      sessionId: sessionId,
      isActive: true,
      timestamp: Date.now()
    }));
    
    console.log('Auth state saved to localStorage for session:', sessionId);
  } else {
    localStorage.removeItem('dsaAuthState');
    localStorage.removeItem('dsaCurrentSession');
    console.log('Auth state cleared from localStorage');
  }
  
  authStatePersisted = true;
  
  // Trigger cross-tab event if enabled
  if (triggerEvent && isCrossTabSyncEnabled) {
    triggerCrossTabAuthEvent('authStateChanged', { user: user ? user.uid : null, sessionId: sessionId });
  }
}

// Trigger cross-tab authentication event
function triggerCrossTabAuthEvent(eventType, data) {
  const event = {
    type: eventType,
    data: data,
    timestamp: Date.now(),
    sessionId: sessionId
  };
  
  // Use sessionStorage for immediate cross-tab communication
  sessionStorage.setItem('dsaAuthEvent', JSON.stringify(event));
  
  // Use localStorage for persistent cross-tab communication
  localStorage.setItem('dsaAuthEvent', JSON.stringify(event));
  
  console.log('Cross-tab auth event triggered:', eventType, data);
}

// Listen for cross-tab authentication events
function setupCrossTabAuthListener() {
  // Listen to storage events (localStorage changes)
  window.addEventListener('storage', handleStorageEvent);
  
  // Listen to sessionStorage events
  window.addEventListener('storage', handleStorageEvent);
  
  // Check for pending events on page load
  checkPendingAuthEvents();
  
  console.log('Cross-tab authentication listener setup for session:', sessionId);
}

// Handle storage events from other tabs
function handleStorageEvent(event) {
  if (!isCrossTabSyncEnabled) return;
  
  // Handle localStorage events
  if (event.storageArea === localStorage) {
    if (event.key === 'dsaAuthEvent') {
      handleCrossTabAuthEvent(event.newValue);
    } else if (event.key === 'dsaAuthState' && event.newValue === null) {
      // Auth state was cleared in another tab
      handleLogoutFromOtherTab();
    }
  }
  
  // Handle sessionStorage events
  if (event.storageArea === sessionStorage && event.key === 'dsaAuthEvent') {
    handleCrossTabAuthEvent(event.newValue);
  }
}

// Handle cross-tab authentication events
function handleCrossTabAuthEvent(eventData) {
  if (!eventData) return;
  
  try {
    const event = JSON.parse(eventData);
    
    // Ignore events from this tab
    if (event.sessionId === sessionId) return;
    
    console.log('Received cross-tab auth event:', event.type, 'from session:', event.sessionId);
    
    switch (event.type) {
      case 'authStateChanged':
        handleAuthStateChangeFromOtherTab(event.data);
        break;
      case 'logout':
        handleLogoutFromOtherTab();
        break;
      case 'login':
        handleLoginFromOtherTab(event.data);
        break;
      case 'sessionExpired':
        handleSessionExpiredFromOtherTab();
        break;
    }
  } catch (error) {
    console.error('Error parsing cross-tab auth event:', error);
  }
}

// Handle auth state change from another tab
function handleAuthStateChangeFromOtherTab(data) {
  if (!data.user) {
    // User logged out in another tab
    handleLogoutFromOtherTab();
  } else {
    // User logged in another tab - refresh our state
    refreshAuthStateFromStorage();
  }
}

// Handle logout from another tab
function handleLogoutFromOtherTab() {
  console.log('User logged out from another tab');
  
  // Clear current auth state
  currentUser = null;
  userProgress = {};
  demoMode = false;
  
  // Update UI
  updateAuthUI();
  updateDashboardUI();
  
  // Show notification
  showNotification('You have been logged out from another tab', 'info');
  
  // Clear any cached data
  clearCachedAuthData();
}

// Handle login from another tab
function handleLoginFromOtherTab(data) {
  console.log('User logged in from another tab');
  
  // Refresh auth state from storage
  refreshAuthStateFromStorage();
  
  // Show notification
  showNotification('Login detected from another tab', 'info');
}

// Handle session expired from another tab
function handleSessionExpiredFromOtherTab() {
  console.log('Session expired from another tab');
  
  // Clear auth state
  currentUser = null;
  userProgress = {};
  demoMode = false;
  
  // Update UI
  updateAuthUI();
  updateDashboardUI();
  
  // Show notification
  showNotification('Your session has expired', 'warning');
  
  // Clear cached data
  clearCachedAuthData();
}

// Refresh auth state from localStorage
function refreshAuthStateFromStorage() {
  const savedAuthState = localStorage.getItem('dsaAuthState');
  if (savedAuthState) {
    try {
      const authState = JSON.parse(savedAuthState);
      const isRecent = (Date.now() - authState.timestamp) < (24 * 60 * 60 * 1000);
      
      if (isRecent) {
        if (authState.demoMode) {
          // Restore demo mode
          enableDemoMode();
        } else {
          // For Firebase auth, let onAuthStateChanged handle it
          console.log('Refreshing Firebase auth state...');
          // Firebase will automatically restore the user if still authenticated
        }
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    }
  }
}

// Check for pending authentication events
function checkPendingAuthEvents() {
  const pendingEvent = localStorage.getItem('dsaAuthEvent');
  if (pendingEvent) {
    // Small delay to ensure all initialization is complete
    setTimeout(() => {
      handleCrossTabAuthEvent(pendingEvent);
    }, 1000);
  }
}

// Clear cached authentication data
function clearCachedAuthData() {
  // Clear localStorage cache
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('dsaProgress_') || key.startsWith('dsaDemoProgress')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear sessionStorage
  sessionStorage.removeItem('dsaAuthEvent');
  
  console.log('Cached auth data cleared');
}

// Verify session consistency
function verifySessionConsistency() {
  const currentSession = localStorage.getItem('dsaCurrentSession');
  const authState = localStorage.getItem('dsaAuthState');
  
  if (!currentSession || !authState) {
    return false;
  }
  
  try {
    const session = JSON.parse(currentSession);
    const auth = JSON.parse(authState);
    
    // Check if session is too old (more than 1 hour)
    const isSessionActive = (Date.now() - session.timestamp) < (60 * 60 * 1000);
    
    if (!isSessionActive) {
      console.log('Session expired, clearing auth state');
      clearCachedAuthData();
      triggerCrossTabAuthEvent('sessionExpired', { sessionId: sessionId });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying session consistency:', error);
    return false;
  }
}

// Verify user credentials and update state correctly
function verifyAndUpdateAuthState() {
  if (!currentUser) {
    // No user logged in, check if we should restore from storage
    const savedAuthState = localStorage.getItem('dsaAuthState');
    if (savedAuthState) {
      try {
        const authState = JSON.parse(savedAuthState);
        const isRecent = (Date.now() - authState.timestamp) < (24 * 60 * 60 * 1000);
        
        if (isRecent && authState.demoMode) {
          // Restore demo mode
          enableDemoMode();
          return true;
        }
      } catch (error) {
        console.error('Error verifying saved auth state:', error);
      }
    }
    return false;
  }
  
  // User is logged in, verify with Firebase if not in demo mode
  if (!demoMode && auth) {
    return currentUser.getIdToken().then(() => {
      // Token is valid
      return true;
    }).catch(() => {
      // Token is invalid, clear auth state
      console.log('Invalid token detected, clearing auth state');
      currentUser = null;
      userProgress = {};
      saveAuthState(null);
      updateAuthUI();
      updateDashboardUI();
      return false;
    });
  }
  
  return Promise.resolve(true);
}

// Handle inconsistent session state
function handleInconsistentSession() {
  console.log('Handling inconsistent session state');
  
  // Clear all auth-related data
  clearCachedAuthData();
  
  // Reset user state
  currentUser = null;
  userProgress = {};
  demoMode = false;
  
  // Update UI
  updateAuthUI();
  updateDashboardUI();
  
  // Show notification
  showNotification('Session was inconsistent and has been reset', 'warning');
  
  // Trigger cross-tab event
  triggerCrossTabAuthEvent('sessionExpired', { sessionId: sessionId });
}

// Check if user can log in again after logout
function canUserLoginAgain() {
  const savedAuthState = localStorage.getItem('dsaAuthState');
  if (!savedAuthState) {
    return true; // No previous auth state, can login
  }
  
  try {
    const authState = JSON.parse(savedAuthState);
    const isRecent = (Date.now() - authState.timestamp) < (24 * 60 * 60 * 1000);
    
    if (!isRecent) {
      // Auth state is old, clear it and allow login
      localStorage.removeItem('dsaAuthState');
      localStorage.removeItem('dsaCurrentSession');
      return true;
    }
    
    // Auth state is recent, check if user is actually logged out
    return !currentUser;
  } catch (error) {
    console.error('Error checking login eligibility:', error);
    return true; // On error, allow login
  }
}

// Force logout from all tabs
function forceLogoutFromAllTabs() {
  console.log('Force logging out from all tabs');
  
  // Clear auth state
  currentUser = null;
  userProgress = {};
  demoMode = false;
  
  // Clear storage
  clearCachedAuthData();
  
  // Update UI
  updateAuthUI();
  updateDashboardUI();
  
  // Trigger cross-tab event
  triggerCrossTabAuthEvent('logout', { user: null, sessionId: sessionId, force: true });
  
  showNotification('Logged out from all tabs', 'info');
}

// Load authentication state from localStorage
function loadAuthState() {
  const savedAuthState = localStorage.getItem('dsaAuthState');
  if (savedAuthState) {
    try {
      const authState = JSON.parse(savedAuthState);
      // Check if auth state is not too old (24 hours)
      const isRecent = (Date.now() - authState.timestamp) < (24 * 60 * 60 * 1000);
      
      if (isRecent && authState.demoMode) {
        // Restore demo mode
        enableDemoMode();
        return true;
      } else if (isRecent && authState.uid) {
        // For Firebase auth, we'll let onAuthStateChanged handle the restoration
        console.log('Found recent auth state, waiting for Firebase auth restoration');
        return true;
      } else {
        // Auth state is too old, clear it
        localStorage.removeItem('dsaAuthState');
        console.log('Auth state expired, cleared');
      }
    } catch (error) {
      console.error('Error parsing saved auth state:', error);
      localStorage.removeItem('dsaAuthState');
    }
  }
  return false;
}

// Close login modal and update UI
function closeLoginModal() {
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');
  
  if (loginModal) {
    loginModal.style.display = 'none';
  }
  if (signupModal) {
    signupModal.style.display = 'none';
  }
  
  // Clear form fields
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  if (loginForm) {
    loginForm.reset();
  }
  if (signupForm) {
    signupForm.reset();
  }
  
  console.log('Login modal closed');
}

// Update dashboard UI when user logs in
function updateDashboardUI() {
  if (currentUser) {
    // Update dashboard if it's currently visible
    if (currentView === 'dashboard') {
      showDashboard();
    }
    
    // Update any other UI elements that depend on auth state
    updateAuthUI();
    
    console.log('Dashboard UI updated for logged in user');
  }
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
      saveUserSession(currentUser);
      closeLoginModal();
      updateAuthUI();
      updateDashboardUI();
      loadUserProgress();
      showNotification('Successfully signed in!', 'success');
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
      // Ensure user data is saved to Firestore
      return saveUserDataToFirestore(currentUser);
    })
    .then(() => {
      saveUserSession(currentUser);
      closeLoginModal();
      updateAuthUI();
      updateDashboardUI();
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
      // Save user data to Firestore
      return saveUserDataToFirestore(currentUser, displayName);
    })
    .then(() => {
      saveUserSession(currentUser);
      closeLoginModal();
      updateAuthUI();
      updateDashboardUI();
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
      demoMode = false;
      saveUserSession(null); // Clear user session
      console.log('User signed out');
      updateAuthUI();
      updateDashboardUI();
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
  
  // Check if this is a new topic (no previous attempts)
  const isNewTopic = topicProgress.attempts === 0;
  
  // Update topic progress
  topicProgress.completed = Math.max(topicProgress.completed, totalQuestions);
  topicProgress.total = totalQuestions;
  topicProgress.bestScore = Math.max(topicProgress.bestScore, score);
  topicProgress.attempts += 1;
  
  // Always increment correctAnswers by the current score
  topicProgress.correctAnswers += score;
  
  // Only increment totalAttempted for new topics
  if (isNewTopic) {
    topicProgress.totalAttempted += totalQuestions;
  }
  
  // Update overall progress
  userProgress.topics[topicId] = topicProgress;
  
  // Recalculate overall totals
  userProgress.totalQuestionsCompleted = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.completed, 0);
  userProgress.totalAttempted = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.totalAttempted, 0);
  userProgress.totalCorrect = Object.values(userProgress.topics)
    .reduce((sum, topic) => sum + topic.correctAnswers, 0);
  
  // Calculate average score: (totalCorrect / totalAttempted) × 100
  userProgress.averageScore = userProgress.totalAttempted > 0 
    ? Math.round((userProgress.totalCorrect / userProgress.totalAttempted) * 100) 
    : 0;
  
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
        // Update leaderboard in real-time
        debouncedLeaderboardUpdate();
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

// ======= USERNAME RESOLUTION FUNCTIONS =======

// Get user display name with comprehensive fallback strategy
function getUserDisplayName(userId, userData = null) {
  try {
    // Strategy 1: Check if this is the current user and use their displayName from Auth
    if (currentUser && userId === currentUser.uid) {
      if (currentUser.displayName && currentUser.displayName.trim()) {
        return currentUser.displayName.trim();
      }
    }

    // Strategy 2: Check userData from Firestore
    if (userData) {
      // Check various name fields in order of preference
      if (userData.displayName && userData.displayName.trim()) {
        return userData.displayName.trim();
      }
      
      if (userData.name && userData.name.trim()) {
        return userData.name.trim();
      }
      
      if (userData.username && userData.username.trim()) {
        return userData.username.trim();
      }
      
      if (userData.fullName && userData.fullName.trim()) {
        return userData.fullName.trim();
      }
    }

    // Strategy 3: Use email prefix as fallback
    if (userData && userData.email) {
      return userData.email.split('@')[0];
    }

    // Strategy 4: Use current user's email if it's the current user
    if (currentUser && userId === currentUser.uid && currentUser.email) {
      return currentUser.email.split('@')[0];
    }

    // Strategy 5: Try to fetch from Firestore if userData is not provided
    if (!userData && db) {
      // This is a fallback for when userData is not provided
      // We'll return a loading state and let the caller handle the async fetch
      return 'Loading...';
    }

    // Strategy 6: Final fallback
    return 'Anonymous User';

  } catch (error) {
    console.error('Error resolving username:', error);
    return 'Anonymous User';
  }
}

// Save user data to Firestore (used during signup and login)
async function saveUserDataToFirestore(user, displayName = null) {
  if (!db || !user) return;
  
  try {
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    
    // Get the display name to save
    const finalDisplayName = displayName || user.displayName || user.email?.split('@')[0] || 'Anonymous User';
    
    if (!userDoc.exists) {
      // Create new user document
      const initialUserData = {
        uid: user.uid,
        email: user.email,
        displayName: finalDisplayName,
        createdAt: new Date().toISOString(),
        lastActiveDate: new Date().toISOString(),
        totalAttempted: 0,
        totalCorrect: 0,
        averageScore: 0,
        currentStreak: 0,
        totalQuestionsCompleted: 0
      };
      
      await userDocRef.set(initialUserData);
      console.log('New user document created in Firestore:', finalDisplayName);
    } else {
      // Update existing document
      const userData = userDoc.data();
      const updateData = {
        lastActiveDate: new Date().toISOString()
      };
      
      // Update display name if it's missing or different
      if (!userData.displayName || userData.displayName !== finalDisplayName) {
        updateData.displayName = finalDisplayName;
        console.log('User display name updated in Firestore:', finalDisplayName);
      }
      
      // Update email if it's missing
      if (!userData.email && user.email) {
        updateData.email = user.email;
      }
      
      await userDocRef.update(updateData);
      console.log('User document updated in Firestore');
    }
  } catch (error) {
    console.error('Error saving user data to Firestore:', error);
    throw error; // Re-throw to handle in calling function
  }
}

// Ensure user's display name is saved to Firestore
async function ensureUserDisplayNameInFirestore(user) {
  if (!db || !user) return;
  
  try {
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    
    // Get the display name to save
    const displayName = user.displayName || user.email?.split('@')[0] || 'Anonymous User';
    
    if (!userDoc.exists) {
      // Create new user document with display name
      const initialUserData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        lastActiveDate: new Date().toISOString(),
        totalAttempted: 0,
        totalCorrect: 0,
        averageScore: 0,
        currentStreak: 0,
        totalQuestionsCompleted: 0
      };
      
      await userDocRef.set(initialUserData);
      console.log('User document created with display name:', displayName);
    } else {
      // Update existing document with display name if it's missing or different
      const userData = userDoc.data();
      if (!userData.displayName || userData.displayName !== displayName) {
        await userDocRef.update({
          displayName: displayName,
          lastActiveDate: new Date().toISOString()
        });
        console.log('User display name updated in Firestore:', displayName);
      } else {
        // Just update last active date
        await userDocRef.update({
          lastActiveDate: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error ensuring user display name in Firestore:', error);
  }
}

// Update user's display name in both Auth and Firestore
async function updateUserDisplayName(newDisplayName) {
  if (!currentUser || !db) {
    console.error('No authenticated user or database');
    return false;
  }

  if (!newDisplayName || !newDisplayName.trim()) {
    console.error('Invalid display name');
    return false;
  }

  try {
    const trimmedName = newDisplayName.trim();
    
    // Update Firebase Auth profile
    await currentUser.updateProfile({
      displayName: trimmedName
    });

    // Update Firestore document
    const userDocRef = db.collection('users').doc(currentUser.uid);
    await userDocRef.update({
      displayName: trimmedName,
      lastUpdated: new Date().toISOString()
    });

    console.log('Display name updated successfully:', trimmedName);
    
    // Refresh leaderboard to show updated name
    if (typeof renderLeaderboard === 'function') {
      renderLeaderboard();
    }
    
    return true;

  } catch (error) {
    console.error('Error updating display name:', error);
    return false;
  }
}

// Test function to verify username resolution (for debugging)
function testUsernameResolution() {
  console.log('=== Testing Username Resolution ===');
  
  if (currentUser) {
    console.log('Current user:', {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      email: currentUser.email
    });
    
    // Test with current user
    const currentUserName = getUserDisplayName(currentUser.uid, {});
    console.log('Resolved name for current user:', currentUserName);
  } else {
    console.log('No current user logged in');
  }
  
  // Test with sample data
  const testUserData = {
    displayName: 'Test User',
    email: 'test@example.com'
  };
  const testUserName = getUserDisplayName('test-user-id', testUserData);
  console.log('Resolved name for test user:', testUserName);
  
  console.log('=== End Test ===');
}

// ======= LEADERBOARD FUNCTIONS =======

// Global leaderboard data and listener
let leaderboardData = [];
let leaderboardListener = null;

// Get leaderboard data from Firestore with real-time updates
function getLeaderboard() {
  if (demoMode) {
    return Promise.resolve(getDemoLeaderboard());
  }
  
  if (!db) {
    console.error('Firestore not available');
    return Promise.resolve(getDemoLeaderboard());
  }
  
  return fetchAllUsersFromFirestore();
}

// Fetch all users from Firestore for leaderboard
function fetchAllUsersFromFirestore() {
  return new Promise((resolve, reject) => {
    console.log('Fetching all users from Firestore...');
    
    db.collection('users')
      .orderBy('averageScore', 'desc')
      .orderBy('totalAttempted', 'desc')
      .orderBy('lastActiveDate', 'desc')
      .get()
      .then(querySnapshot => {
        const users = [];
        
        querySnapshot.forEach(doc => {
          try {
            const userData = doc.data();
            const userId = doc.id;
            
            // Only include users with some progress
            if (userData.totalAttempted > 0) {
              // Get display name with better fallback strategy
              let displayName = getUserDisplayName(userId, userData);
              
              // If display name is still "Loading..." or "Anonymous User", try to get a better fallback
              if (displayName === 'Loading...') {
                displayName = userData.email ? userData.email.split('@')[0] : 'User ' + userId.substring(0, 8);
              }
              
              users.push({
                id: userId,
                name: displayName,
                email: userData.email || '',
                totalAttempted: userData.totalAttempted || 0,
                totalCorrect: userData.totalCorrect || 0,
                averageScore: userData.averageScore || 0,
                totalQuestionsCompleted: userData.totalQuestionsCompleted || 0,
                currentStreak: userData.currentStreak || 0,
                lastActiveDate: userData.lastActiveDate || new Date().toISOString(),
                createdAt: userData.createdAt || new Date().toISOString(),
                isCurrentUser: currentUser && userId === currentUser.uid,
                source: 'firebase'
              });
            }
          } catch (error) {
            console.error('Error processing user data in leaderboard:', error);
            // Continue with other users
          }
        });
        
        console.log(`Fetched ${users.length} users from Firestore`);
        leaderboardData = users;
        resolve(users);
      })
      .catch(error => {
        console.error('Error fetching users from Firestore:', error);
        // Fallback to demo data on error
        resolve(getDemoLeaderboard());
      });
  });
}

// Set up real-time listener for leaderboard updates
function setupLeaderboardListener() {
  if (demoMode || !db) {
    console.log('Skipping leaderboard listener setup (demo mode or no database)');
    return;
  }
  
  // Remove existing listener if any
  if (leaderboardListener) {
    leaderboardListener();
    leaderboardListener = null;
  }
  
  console.log('Setting up real-time leaderboard listener...');
  
  leaderboardListener = db.collection('users')
    .orderBy('averageScore', 'desc')
    .orderBy('totalAttempted', 'desc')
    .orderBy('lastActiveDate', 'desc')
    .onSnapshot(
      querySnapshot => {
        console.log('Leaderboard data updated in real-time');
        const users = [];
        
        querySnapshot.forEach(doc => {
          try {
            const userData = doc.data();
            const userId = doc.id;
            
            // Only include users with some progress
            if (userData.totalAttempted > 0) {
              // Get display name with better fallback strategy
              let displayName = getUserDisplayName(userId, userData);
              
              // If display name is still "Loading..." or "Anonymous User", try to get a better fallback
              if (displayName === 'Loading...') {
                displayName = userData.email ? userData.email.split('@')[0] : 'User ' + userId.substring(0, 8);
              }
              
              users.push({
                id: userId,
                name: displayName,
                email: userData.email || '',
                totalAttempted: userData.totalAttempted || 0,
                totalCorrect: userData.totalCorrect || 0,
                averageScore: userData.averageScore || 0,
                totalQuestionsCompleted: userData.totalQuestionsCompleted || 0,
                currentStreak: userData.currentStreak || 0,
                lastActiveDate: userData.lastActiveDate || new Date().toISOString(),
                createdAt: userData.createdAt || new Date().toISOString(),
                isCurrentUser: currentUser && userId === currentUser.uid,
                source: 'firebase'
              });
            }
          } catch (error) {
            console.error('Error processing user data in real-time listener:', error);
            // Continue with other users
          }
        });
        
        leaderboardData = users;
        
        // Update UI if leaderboard is currently visible
        if (currentView === 'dashboard' && typeof renderLeaderboard === 'function') {
          renderLeaderboard();
        }
      },
      error => {
        console.error('Error in leaderboard listener:', error);
        showNotification('Failed to load real-time leaderboard updates', 'warning');
      }
    );
}

// Enhanced leaderboard that combines Firebase and localStorage data
function getEnhancedLeaderboard() {
  const leaderboard = [];
  
  // Get current user data
  if (currentUser && userProgress) {
    leaderboard.push({
      id: currentUser.uid || 'current-user',
      name: currentUser.displayName || currentUser.email || 'Current User',
      totalAttempted: userProgress.totalAttempted || 0,
      totalCorrect: userProgress.totalCorrect || 0,
      averageScore: userProgress.averageScore || 0,
      isCurrentUser: true,
      source: demoMode ? 'demo' : 'firebase'
    });
  }
  
  // Get demo users from localStorage
  const demoUsers = getDemoUsersFromStorage();
  leaderboard.push(...demoUsers);
  
  // Get Firebase users if available (for non-demo mode)
  if (!demoMode && db) {
    // This would be populated by Firebase data in a real implementation
    // For now, we'll use demo data as fallback
    const firebaseUsers = getFirebaseUsers();
    leaderboard.push(...firebaseUsers);
  }
  
  // Remove duplicates and sort by average score
  const uniqueLeaderboard = removeDuplicateUsers(leaderboard);
  return sortLeaderboardByAverageScore(uniqueLeaderboard);
}

// Get demo leaderboard data
function getDemoLeaderboard() {
  const leaderboard = [];
  
  // Get current user data if in demo mode
  if (currentUser && userProgress) {
    leaderboard.push({
      id: currentUser.uid || 'demo-user',
      name: currentUser.displayName || 'Demo User',
      totalAttempted: userProgress.totalAttempted || 0,
      totalCorrect: userProgress.totalCorrect || 0,
      averageScore: userProgress.averageScore || 0,
      totalQuestionsCompleted: userProgress.totalQuestionsCompleted || 0,
      currentStreak: userProgress.currentStreak || 0,
      lastActiveDate: userProgress.lastActiveDate || new Date().toISOString(),
      isCurrentUser: true,
      source: 'demo'
    });
  }
  
  // Add some sample users for demonstration
  const sampleUsers = [
    { 
      id: 'alice', 
      name: 'Alice Johnson', 
      totalAttempted: 45, 
      totalCorrect: 38, 
      averageScore: 84, 
      totalQuestionsCompleted: 40,
      currentStreak: 5,
      lastActiveDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'sample' 
    },
    { 
      id: 'bob', 
      name: 'Bob Smith', 
      totalAttempted: 38, 
      totalCorrect: 30, 
      averageScore: 79, 
      totalQuestionsCompleted: 35,
      currentStreak: 3,
      lastActiveDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'sample' 
    },
    { 
      id: 'carol', 
      name: 'Carol Davis', 
      totalAttempted: 32, 
      totalCorrect: 26, 
      averageScore: 81, 
      totalQuestionsCompleted: 30,
      currentStreak: 7,
      lastActiveDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      source: 'sample' 
    },
    { 
      id: 'david', 
      name: 'David Wilson', 
      totalAttempted: 28, 
      totalCorrect: 21, 
      averageScore: 75, 
      totalQuestionsCompleted: 25,
      currentStreak: 1,
      lastActiveDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'sample' 
    },
    { 
      id: 'eva', 
      name: 'Eva Brown', 
      totalAttempted: 25, 
      totalCorrect: 22, 
      averageScore: 88, 
      totalQuestionsCompleted: 22,
      currentStreak: 12,
      lastActiveDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      source: 'sample' 
    }
  ];
  
  leaderboard.push(...sampleUsers);
  return sortLeaderboardByAverageScore(leaderboard);
}

// Get demo users from localStorage
function getDemoUsersFromStorage() {
  const demoUsers = [];
  
  // Check for demo progress data
  const demoProgress = localStorage.getItem('dsaDemoProgress');
  if (demoProgress) {
    try {
      const progress = JSON.parse(demoProgress);
      if (progress.totalAttempted > 0) {
        demoUsers.push({
          id: 'demo-user',
          name: 'Demo User',
          totalAttempted: progress.totalAttempted,
          totalCorrect: progress.totalCorrect,
          averageScore: progress.averageScore,
          isCurrentUser: demoMode,
          source: 'demo'
        });
      }
    } catch (error) {
      console.error('Error parsing demo progress:', error);
    }
  }
  
  return demoUsers;
}

// Get Firebase users (placeholder for real implementation)
function getFirebaseUsers() {
  // In a real implementation, this would fetch from Firebase
  // For now, return empty array
  return [];
}

// Remove duplicate users based on ID
function removeDuplicateUsers(users) {
  const seen = new Set();
  return users.filter(user => {
    if (seen.has(user.id)) {
      return false;
    }
    seen.add(user.id);
    return true;
  });
}

// Sort leaderboard by average score in descending order
function sortLeaderboardByAverageScore(users) {
  return users.sort((a, b) => {
    // Primary sort: average score (descending)
    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }
    // Secondary sort: total attempted (descending)
    if (b.totalAttempted !== a.totalAttempted) {
      return b.totalAttempted - a.totalAttempted;
    }
    // Tertiary sort: total correct (descending)
    if (b.totalCorrect !== a.totalCorrect) {
      return b.totalCorrect - a.totalCorrect;
    }
    // Quaternary sort: current streak (descending)
    if (b.currentStreak !== a.currentStreak) {
      return b.currentStreak - a.currentStreak;
    }
    // Quinary sort: last active date (descending - more recent first)
    if (b.lastActiveDate !== a.lastActiveDate) {
      return new Date(b.lastActiveDate) - new Date(a.lastActiveDate);
    }
    // Final sort: name (ascending)
    return a.name.localeCompare(b.name);
  });
}

// Sort leaderboard by different criteria
function sortLeaderboard(users, sortBy = 'averageScore') {
  return users.sort((a, b) => {
    switch (sortBy) {
      case 'totalScore':
        // Sort by total correct answers
        if (b.totalCorrect !== a.totalCorrect) {
          return b.totalCorrect - a.totalCorrect;
        }
        break;
      case 'totalAttempted':
        // Sort by total questions attempted
        if (b.totalAttempted !== a.totalAttempted) {
          return b.totalAttempted - a.totalAttempted;
        }
        break;
      case 'streak':
        // Sort by current streak
        if (b.currentStreak !== a.currentStreak) {
          return b.currentStreak - a.currentStreak;
        }
        break;
      case 'recent':
        // Sort by last active date
        if (b.lastActiveDate !== a.lastActiveDate) {
          return new Date(b.lastActiveDate) - new Date(a.lastActiveDate);
        }
        break;
      case 'averageScore':
      default:
        // Sort by average score (default)
        if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore;
        }
        break;
    }
    
    // Secondary sort: average score
    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }
    // Tertiary sort: total attempted
    if (b.totalAttempted !== a.totalAttempted) {
      return b.totalAttempted - a.totalAttempted;
    }
    // Final sort: name
    return a.name.localeCompare(b.name);
  });
}

// Real-time leaderboard update function
function updateLeaderboardRealTime() {
  console.log('Updating leaderboard in real-time...');
  renderLeaderboard();
}

// Debounced leaderboard update to prevent excessive re-rendering
let leaderboardUpdateTimeout;
function debouncedLeaderboardUpdate() {
  clearTimeout(leaderboardUpdateTimeout);
  leaderboardUpdateTimeout = setTimeout(() => {
    updateLeaderboardRealTime();
  }, 500); // 500ms delay
}

// Render leaderboard with enhanced features
function renderLeaderboard() {
  const leaderboardContainer = document.getElementById('leaderboardContainer');
  if (!leaderboardContainer) return;
  
  // Show loading state with animation
  leaderboardContainer.innerHTML = `
    <div class="leaderboard-loading">
      <div class="loading-spinner"></div>
      <p class="text-center">Loading leaderboard...</p>
    </div>
  `;
  
  getLeaderboard()
    .then(leaderboard => {
      // Clear container
      leaderboardContainer.innerHTML = '';
      
      if (!leaderboard || leaderboard.length === 0) {
        leaderboardContainer.innerHTML = `
          <div class="leaderboard-empty">
            <div class="empty-icon">📊</div>
            <p class="text-center">No data available yet.</p>
            <p class="text-center text-sm">Take some quizzes to appear on the leaderboard!</p>
          </div>
        `;
        return;
      }
      
      // Add header with stats summary and sorting options
      const header = document.createElement('div');
      header.className = 'leaderboard-header';
      header.innerHTML = `
        <div class="leaderboard-title">
          <h3>🏆 Leaderboard</h3>
          <p class="text-sm">${leaderboard.length} players • Sorted by average score</p>
        </div>
        <div class="leaderboard-controls">
          <select id="leaderboardSort" onchange="changeLeaderboardSort(this.value)" class="sort-select">
            <option value="averageScore">Sort by Average Score</option>
            <option value="totalScore">Sort by Total Score</option>
            <option value="totalAttempted">Sort by Questions Attempted</option>
            <option value="streak">Sort by Current Streak</option>
            <option value="recent">Sort by Most Recent</option>
          </select>
          ${demoMode ? '<div class="demo-badge">Demo Mode</div>' : ''}
        </div>
      `;
      leaderboardContainer.appendChild(header);
      
      // Create leaderboard list
      const leaderboardList = document.createElement('div');
      leaderboardList.className = 'leaderboard-list';
      
      leaderboard.forEach((user, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        const rankDisplay = medal || `#${rank}`;
        
        // Determine if this is the current user
        const isCurrentUser = user.isCurrentUser || (currentUser && user.id === currentUser.uid);
        const userCardClass = `leaderboard-item ${isCurrentUser ? 'current-user' : ''} rank-${rank}`;
        
        // Calculate accuracy percentage
        const accuracy = user.totalAttempted > 0 ? Math.round((user.totalCorrect / user.totalAttempted) * 100) : 0;
        
        // Format last active date
        const lastActive = user.lastActiveDate ? formatLastActive(user.lastActiveDate) : 'Unknown';
        
        const userCard = document.createElement('div');
        userCard.className = userCardClass;
        userCard.innerHTML = `
          <div class="leaderboard-rank">
            <span class="rank-number">${rankDisplay}</span>
          </div>
          <div class="leaderboard-user-info">
            <div class="user-name">
              ${user.name}
              ${isCurrentUser ? '<span class="you-badge">You</span>' : ''}
            </div>
            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-label">Attempted:</span>
                <span class="stat-value">${user.totalAttempted}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Correct:</span>
                <span class="stat-value">${user.totalCorrect}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Accuracy:</span>
                <span class="stat-value">${accuracy}%</span>
              </div>
              <div class="stat-item highlight">
                <span class="stat-label">Avg Score:</span>
                <span class="stat-value">${user.averageScore}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Streak:</span>
                <span class="stat-value">${user.currentStreak || 0}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Last Active:</span>
                <span class="stat-value">${lastActive}</span>
              </div>
            </div>
          </div>
          <div class="leaderboard-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${user.averageScore}%"></div>
            </div>
          </div>
        `;
        
        leaderboardList.appendChild(userCard);
      });
      
      leaderboardContainer.appendChild(leaderboardList);
      
      // Add refresh button and real-time indicator
      const refreshButton = document.createElement('div');
      refreshButton.className = 'leaderboard-refresh';
      refreshButton.innerHTML = `
        <div class="refresh-controls">
          <button class="btn btn-outline btn-sm" onclick="updateLeaderboardRealTime()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
          ${!demoMode ? '<span class="realtime-indicator">🟢 Live Updates</span>' : ''}
        </div>
      `;
      leaderboardContainer.appendChild(refreshButton);
      
    })
    .catch(error => {
      console.error('Error rendering leaderboard:', error);
      leaderboardContainer.innerHTML = `
        <div class="leaderboard-error">
          <div class="error-icon">⚠️</div>
          <p class="text-center">Error loading leaderboard</p>
          <p class="text-center text-sm">${error.message || 'Please check your connection and try again.'}</p>
          <button class="btn btn-primary btn-sm" onclick="renderLeaderboard()">Try Again</button>
        </div>
      `;
    });
}

// Change leaderboard sorting
function changeLeaderboardSort(sortBy) {
  if (!leaderboardData || leaderboardData.length === 0) return;
  
  const sortedData = sortLeaderboard([...leaderboardData], sortBy);
  const leaderboardList = document.querySelector('.leaderboard-list');
  if (!leaderboardList) return;
  
  // Clear and re-render the list
  leaderboardList.innerHTML = '';
  
  sortedData.forEach((user, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    const rankDisplay = medal || `#${rank}`;
    
    const isCurrentUser = user.isCurrentUser || (currentUser && user.id === currentUser.uid);
    const userCardClass = `leaderboard-item ${isCurrentUser ? 'current-user' : ''} rank-${rank}`;
    const accuracy = user.totalAttempted > 0 ? Math.round((user.totalCorrect / user.totalAttempted) * 100) : 0;
    const lastActive = user.lastActiveDate ? formatLastActive(user.lastActiveDate) : 'Unknown';
    
    const userCard = document.createElement('div');
    userCard.className = userCardClass;
    userCard.innerHTML = `
      <div class="leaderboard-rank">
        <span class="rank-number">${rankDisplay}</span>
      </div>
      <div class="leaderboard-user-info">
        <div class="user-name">
          ${user.name}
          ${isCurrentUser ? '<span class="you-badge">You</span>' : ''}
        </div>
        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-label">Attempted:</span>
            <span class="stat-value">${user.totalAttempted}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Correct:</span>
            <span class="stat-value">${user.totalCorrect}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Accuracy:</span>
            <span class="stat-value">${accuracy}%</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-label">Avg Score:</span>
            <span class="stat-value">${user.averageScore}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Streak:</span>
            <span class="stat-value">${user.currentStreak || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last Active:</span>
            <span class="stat-value">${lastActive}</span>
          </div>
        </div>
      </div>
      <div class="leaderboard-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${user.averageScore}%"></div>
        </div>
      </div>
    `;
    
    leaderboardList.appendChild(userCard);
  });
}

// Format last active date for display
function formatLastActive(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

// ======= TESTING FUNCTIONS =======

// Test function to demonstrate the new scoring logic
function testScoringLogic() {
  console.log('=== Testing New Scoring Logic ===');
  
  // Initialize test user progress
  const testProgress = {
    topics: {
      arrays: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 },
      strings: { completed: 0, total: 0, bestScore: 0, attempts: 0, correctAnswers: 0, totalAttempted: 0 }
    },
    totalQuestionsCompleted: 0,
    totalAttempted: 0,
    totalCorrect: 0,
    averageScore: 0
  };
  
  // Simulate first attempt on arrays topic (new topic)
  console.log('Test 1: First attempt on arrays (score: 4/5)');
  userProgress = JSON.parse(JSON.stringify(testProgress));
  saveQuizResult('arrays', 4, 5);
  console.log('Result:', {
    totalAttempted: userProgress.totalAttempted, // Should be 5
    totalCorrect: userProgress.totalCorrect,     // Should be 4
    averageScore: userProgress.averageScore      // Should be 80%
  });
  
  // Simulate second attempt on same arrays topic (existing topic)
  console.log('Test 2: Second attempt on arrays (score: 3/5)');
  saveQuizResult('arrays', 3, 5);
  console.log('Result:', {
    totalAttempted: userProgress.totalAttempted, // Should still be 5 (not incremented)
    totalCorrect: userProgress.totalCorrect,     // Should be 7 (4+3)
    averageScore: userProgress.averageScore      // Should be 140% (7/5*100)
  });
  
  // Simulate first attempt on strings topic (new topic)
  console.log('Test 3: First attempt on strings (score: 5/5)');
  saveQuizResult('strings', 5, 5);
  console.log('Result:', {
    totalAttempted: userProgress.totalAttempted, // Should be 10 (5+5)
    totalCorrect: userProgress.totalCorrect,     // Should be 12 (7+5)
    averageScore: userProgress.averageScore      // Should be 120% (12/10*100)
  });
  
  console.log('=== End Testing ===');
}

// ======= AUTH STATE LISTENER =======

// Listen for auth state changes
auth.onAuthStateChanged(user => {
  currentUser = user;
  
  // Verify session consistency before updating
  if (!verifySessionConsistency() && user) {
    console.log('Session inconsistency detected, refreshing auth state');
    return;
  }
  
  // Save auth state to localStorage (don't trigger cross-tab event here to avoid loops)
  saveAuthState(user, false);
  
  // Update UI
  updateAuthUI();
  
  if (user) {
    // User is logged in
    console.log('Auth state changed: user logged in');
    
    // Ensure user's display name is saved to Firestore
    ensureUserDisplayNameInFirestore(user);
    
    updateDashboardUI();
    loadUserProgress();
    
    // Set up real-time leaderboard listener
    setupLeaderboardListener();
  } else {
    // User is logged out
    console.log('Auth state changed: user logged out');
    userProgress = {};
    demoMode = false;
    
    // Clear local cache when user logs out
    clearCachedAuthData();
    
    // Remove leaderboard listener
    if (leaderboardListener) {
      leaderboardListener();
      leaderboardListener = null;
    }
    
    updateDashboardUI();
  }
});

// Initialize auth state on page load
function initializeAuthOnPageLoad() {
  console.log('Initializing auth state on page load...');
  
  // Try to load saved auth state
  const authStateRestored = loadAuthState();
  
  if (!authStateRestored) {
    console.log('No valid auth state found, user will need to log in');
    // Ensure UI shows logged out state
    updateAuthUI();
  }
}

// Sync local cache with Firebase when coming back online
window.addEventListener('online', () => {
  if (currentUser && !demoMode) {
    console.log('Connection restored, syncing with Firebase...');
    loadUserProgress();
  }
});

// Initialize auth state when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure Firebase is initialized
  setTimeout(() => {
    // Initialize simplified session management
    initializeSessionManagement();
    
    // Set up page visibility change handler
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, check session
        updateUIFromSession();
      }
    });
  }, 500);
});

