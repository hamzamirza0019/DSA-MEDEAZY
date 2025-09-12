// Firebase SDK v10 (loaded via <script> in HTML)

// Your Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyB9qjmYvLq04p8noLrr8GcgpipMtVhHDzG",
//   authDomain: "dsa-med-eazy.firebaseapp.com",
//   projectId: "dsa-med-eazy",
//   storageBucket: "dsa-med-eazy.appspot.com",
//   messagingSenderId: "79935998558",
//   appId: "1:79935998558:web:6c6c6c2267f0f8453742cf",
//   measurementId: "G-574Z1ECX9S"
// };

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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Google Login
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      alert(`Welcome ${user.displayName}`);
    })
    .catch(error => {
      console.error("Login error:", error.message);
    });
}

// Logout
function logout() {
  auth.signOut().then(() => alert("Logged out"));
}
