// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const calculatorForm = document.getElementById("calculator-form");
  const progressForm = document.getElementById('progress-form');
  const logList = document.getElementById('log-list');
  const db = firebase.firestore();

  // Calculator Form Handling
  if (calculatorForm) {
    calculatorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const errorMessages = document.querySelectorAll(".error-message");
      errorMessages.forEach((msg) => msg.remove());

      const age = +document.getElementById("age").value;
      const gender = document.getElementById("gender").value;
      const height = +document.getElementById("height").value;
      const weight = +document.getElementById("weight").value;
      const activity = +document.getElementById("activity").value;

      let hasError = false;

      if (isNaN(age) || age < 12 || age > 100) {
        displayError("age", "Age must be a number between 12 and 100.");
        hasError = true;
      }
      if (!gender) {
        displayError("gender", "Please select a gender.");
        hasError = true;
      }
      if (isNaN(height) || height <= 0 || height >= 240) {
        displayError("height", "Height must be between 0 and 240 cm");
        hasError = true;
      }
      if (isNaN(weight) || weight <= 0) {
        displayError("weight", "Weight must be a positive number.");
        hasError = true;
      }
      if (!activity) {
        displayError("activity", "Please select an activity level.");
        hasError = true;
      }

      if (hasError) return;

      const bmr = gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

      const calories = bmr * activity;
      const protein = weight * 2;
      const bmi = weight / ((height / 100) ** 2);
      const bmiCategory = bmi < 18.5 ? "Underweight"
                        : bmi < 25 ? "Normal"
                        : bmi < 30 ? "Overweight"
                        : "Obese";

      const resultBox = document.getElementById("result-box");
      resultBox.classList.remove("hidden");
      resultBox.classList.add("fade-in");

      document.getElementById("calories").textContent = `Calories Needed: ${Math.round(calories)} kcal/day`;
      document.getElementById("protein").textContent = `Recommended Protein: ${Math.round(protein)} g/day`;
      document.getElementById("bmi").textContent = `BMI: ${bmi.toFixed(2)}`;
      document.getElementById("bmi-category").textContent = `BMI Category: ${bmiCategory}`;
    });
  }

  // Show validation error
  function displayError(inputId, message) {
    const inputField = document.getElementById(inputId);
    const errorMessage = document.createElement("div");
    errorMessage.classList.add("error-message");
    errorMessage.textContent = message;
    inputField.parentElement.appendChild(errorMessage);
  }

  // Progress Tracker Form
  if (progressForm) {
    progressForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const errorMessages = document.querySelectorAll(".error-message");
      errorMessages.forEach((msg) => msg.remove());

      const date = document.getElementById('date').value;
      const weight = +document.getElementById('current-weight').value;
      const waist = +document.getElementById('waist').value;

      let hasError = false;
      if (!date) {
        displayError("date", "Please enter a valid date.");
        hasError = true;
      }
      if (isNaN(weight) || weight <= 0) {
        displayError("current-weight", "Weight must be a positive number.");
        hasError = true;
      }
      if (isNaN(waist) || waist <= 0) {
        displayError("waist", "Waist measurement must be a positive number.");
        hasError = true;
      }
      if (hasError) return;

      saveProgressToFirestore(date, weight, waist);
      progressForm.reset();
    });
  }

  // Save progress to Firestore
  function saveProgressToFirestore(date, weight, waist) {
    const user = firebase.auth().currentUser;
    if (user) {
      const userId = user.uid;
      const userProgressRef = db.collection('users').doc(userId).collection('progressLogs');

      userProgressRef.add({
        date,
        weight,
        waist,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        console.log('Progress saved successfully');
        loadUserProgress(); // Refresh logs
      })
      .catch((error) => {
        console.error('Error saving progress: ', error);
      });
    } else {
      console.log('No user is signed in.');
    }
  }

  // Load user progress from Firestore
  // Load user progress from Firestore
function loadUserProgress() {
  const user = firebase.auth().currentUser;
  if (user) {
    const userId = user.uid;
    const userProgressRef = db.collection('users').doc(userId).collection('progressLogs');

    userProgressRef.orderBy('timestamp', 'desc').get()
      .then((querySnapshot) => {
        const logList = document.getElementById('log-list');
        logList.innerHTML = ''; // Clear previous logs

        querySnapshot.forEach((doc) => {
          const log = doc.data();
          const li = document.createElement('li');
          li.textContent = `${log.date} | Weight: ${log.weight}kg | Waist: ${log.waist}cm`;

          // Create a delete button for each entry
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.classList.add('delete-btn');
          
          // Add click event to delete the progress entry
          deleteButton.addEventListener('click', () => {
            deleteProgress(doc.id); // Pass document ID to delete
          });

          // Append delete button to the list item
          li.appendChild(deleteButton);
          logList.appendChild(li);
        });
      })
      .catch((error) => {
        console.error('Error loading progress: ', error);
      });
  } else {
    console.log('No user is signed in.');
  }
}


  // Navbar Toggle
  const toggleButton = document.querySelector('.navbar-toggle');
  const navbarMenu = document.querySelector('.navbar-menu');
  if (toggleButton && navbarMenu) {
    toggleButton.addEventListener('click', () => {
      navbarMenu.classList.toggle('active');
    });
  }


  // Clear Progress Button - also deletes from Firestore
// Clear Progress Button - also deletes from Firestore with confirmation
const clearProgressButton = document.getElementById('clear-progress');
if (clearProgressButton && logList) {
  clearProgressButton.addEventListener('click', function () {
    // Ask for confirmation before clearing progress
    const confirmDelete = window.confirm("Are you sure you want to delete all your progress? This action cannot be undone.");

    if (!confirmDelete) {
      return; // Do nothing if the user cancels
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      console.log("No user signed in.");
      return;
    }

    const userId = user.uid;
    const userProgressRef = db.collection('users').doc(userId).collection('progressLogs');

    // First, get all documents
    userProgressRef.get()
      .then((querySnapshot) => {
        const batch = db.batch();
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        return batch.commit(); // Commit all deletions
      })
      .then(() => {
        console.log("All progress entries deleted from Firestore.");
        logList.innerHTML = ''; // Also clear from UI
      })
      .catch((error) => {
        console.error("Error deleting progress entries: ", error);
      });
  });
}



  // Authentication Section
  const signInButton = document.getElementById("google-signin");
  const signOutButton = document.getElementById("signout");
  const userInfo = document.getElementById("user-info");
  const provider = new firebase.auth.GoogleAuthProvider();

  // Auth listeners
  if (signInButton) {
    signInButton.addEventListener("click", () => {
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          const user = result.user;
          toggleAuthUI(user);
          loadUserProgress(); // Load logs when signed in
        })
        .catch((error) => {
          console.error("Sign-in error:", error);
        });
    });
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", () => {
      firebase.auth().signOut().then(() => {
        console.log("User signed out successfully.");
        toggleAuthUI(null);
        if (logList) logList.innerHTML = '';
      }).catch((error) => {
        console.error("Sign-out error:", error);
      });
    });
  }

  firebase.auth().onAuthStateChanged((user) => {
    toggleAuthUI(user);
    if (user) loadUserProgress(); // Load data on page load if already signed in
  });

  function toggleAuthUI(user) {
    if (user) {
      userInfo.textContent = `Signed in as ${user.displayName}`;
      userInfo.classList.remove("hidden");
      signOutButton.classList.remove("hidden");
      signInButton.classList.add("hidden");
  
      toggleProgressAccess(true);  // Enable access
      loadUserProgress();         // Load progress
  
    } else {
      userInfo.classList.add("hidden");
      signOutButton.classList.add("hidden");
      signInButton.classList.remove("hidden");
  
      toggleProgressAccess(false); // Disable access
      document.getElementById("log-list").innerHTML = ''; // Clear display
    }
  }
  
});




function saveProgressToFirestore(date, weight, waist) {
  const user = firebase.auth().currentUser;  // Get current user
  if (user) {
    const userId = user.uid;  // Get the user ID

    // Reference to the Firestore "progressLogs" collection for the user
    const userProgressRef = db.collection('users').doc(userId).collection('progressLogs');

    // Add a new document with the progress data
    userProgressRef.add({
      date: date,
      weight: weight,
      waist: waist,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),  // To add a timestamp
    })
    .then(() => {
      console.log('Progress saved successfully');
    })
    .catch((error) => {
      console.error('Error saving progress: ', error);
    });
  } else {
    console.log('No user is signed in.');
  }
}



// Function to load user progress from Firestore
// Load user progress from Firestore
function loadUserProgress() {
  const user = firebase.auth().currentUser;
  if (user) {
    const userId = user.uid;
    const userProgressRef = db.collection('users').doc(userId).collection('progressLogs');

    userProgressRef.orderBy('timestamp', 'desc').get()
      .then((querySnapshot) => {
        const logList = document.getElementById('log-list');
        logList.innerHTML = ''; // Clear previous logs (this will be fine now)

        querySnapshot.forEach((doc) => {
          const log = doc.data();
          const li = document.createElement('li');
          li.textContent = `${log.date} | Weight: ${log.weight}kg | Waist: ${log.waist}cm`;

          // Create a delete button for each entry
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.classList.add('delete-btn');
          
          // Add click event to delete the progress entry
          deleteButton.addEventListener('click', () => {
            deleteProgress(doc.id, li); // Pass document ID and the list item (li) element
          });

          // Append delete button to the list item
          li.appendChild(deleteButton);
          logList.appendChild(li);
        });
      })
      .catch((error) => {
        console.error('Error loading progress: ', error);
      });
  } else {
    console.log('No user is signed in.');
  }
}


const warningMessage = document.getElementById("progress-warning");

const user = firebase.auth().currentUser;
if (user) {
  saveProgressToFirestore(date, weight, waist);
  progressForm.reset();
  if (warningMessage) warningMessage.classList.add("hidden"); // Hide warning if previously shown
} else {
  if (warningMessage) warningMessage.classList.remove("hidden"); // Show warning
}

function toggleProgressForm(enabled) {
  const formElements = document.querySelectorAll('#progress-form input, #progress-form button');
  formElements.forEach(el => el.disabled = !enabled);

  const warning = document.getElementById("progress-warning");
  if (warning) {
    if (enabled) {
      warning.classList.add("hidden");
    } else {
      warning.classList.remove("hidden");
    }
  }
}

function toggleProgressAccess(isSignedIn) {
  const elements = document.querySelectorAll('#progress-form input, #progress-form button, #clear-progress');
  elements.forEach(el => el.disabled = !isSignedIn);

  const warning = document.getElementById('progress-warning');
  warning.style.display = isSignedIn ? 'none' : 'block';
}

// Function to delete progress entry from Firestore
// Function to delete progress entry from Firestore
// Function to delete progress entry from Firestore
function deleteProgress(progressId, liElement) {
  const user = firebase.auth().currentUser;
  if (user) {
    const userId = user.uid;
    const userProgressRef = db.collection('users').doc(userId).collection('progressLogs');

    // Delete the specific progress entry using its document ID
    userProgressRef.doc(progressId).delete()
      .then(() => {
        console.log('Progress deleted successfully');
        loadUserProgress(); // Re-load the progress to update the UI immediately
      })
      .catch((error) => {
        console.error('Error deleting progress: ', error);
      });
  } else {
    console.log('No user is signed in.');
  }
}
