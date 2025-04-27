// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {

  // Calculator Form Handling
  const calculatorForm = document.getElementById("calculator-form");

  if (calculatorForm) {
    calculatorForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Clear previous error messages
      const errorMessages = document.querySelectorAll(".error-message");
      errorMessages.forEach((msg) => msg.remove());

      // Get the input values
      const age = +document.getElementById("age").value;
      const gender = document.getElementById("gender").value;
      const height = +document.getElementById("height").value;
      const weight = +document.getElementById("weight").value;
      const activity = +document.getElementById("activity").value;

      let hasError = false;

      // Validate Age
      if (isNaN(age) || age < 12 || age > 100) {
        displayError("age", "Age must be a number between 12 and 100.");
        hasError = true;
      }

      // Validate Gender
      if (!gender) {
        displayError("gender", "Please select a gender.");
        hasError = true;
      }

      // Validate Height
      if (isNaN(height) || height <= 0 || height >= 240) {
        displayError("height", "Height must be between 0 and 240 cm");
        hasError = true;
      }

      // Validate Weight
      if (isNaN(weight) || weight <= 0) {
        displayError("weight", "Weight must be a positive number.");
        hasError = true;
      }

      // Validate Activity Level
      if (!activity) {
        displayError("activity", "Please select an activity level.");
        hasError = true;
      }

      // If there are any validation errors, stop the calculation
      if (hasError) {
        return; // Stop further execution if there are validation errors
      }

      // Calculate BMR if validation passes
      let bmr;
      if (gender === "male") {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      let calories = bmr * activity;
      const protein = weight * 2;
      const bmi = weight / ((height / 100) ** 2);

      const bmiCategory = bmi < 18.5 ? "Underweight"
                        : bmi < 25 ? "Normal"
                        : bmi < 30 ? "Overweight"
                        : "Obese";

      // Show Results
      const resultBox = document.getElementById("result-box");
      resultBox.classList.remove("hidden");

      document.getElementById("calories").textContent = `Calories Needed: ${Math.round(calories)} kcal/day`;
      document.getElementById("protein").textContent = `Recommended Protein: ${Math.round(protein)} g/day`;
      document.getElementById("bmi").textContent = `BMI: ${bmi.toFixed(2)}`;
      document.getElementById("bmi-category").textContent = `BMI Category: ${bmiCategory}`;

      resultBox.classList.add("fade-in");
    });
  }

  // Function to display error messages below each input
  function displayError(inputId, message) {
    const inputField = document.getElementById(inputId);
    const errorMessage = document.createElement("div");
    errorMessage.classList.add("error-message");
    errorMessage.textContent = message;
    inputField.parentElement.appendChild(errorMessage);
  }

  // Progress Tracker Script
  const progressForm = document.getElementById('progress-form');
  const logList = document.getElementById('log-list');

  // Load saved progress from localStorage
  loadProgress();

  if (progressForm) {
    progressForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Clear previous error messages
      const errorMessages = document.querySelectorAll(".error-message");
      errorMessages.forEach((msg) => msg.remove());

      // Get the input values
      const date = document.getElementById('date').value;
      const weight = +document.getElementById('current-weight').value;
      const waist = +document.getElementById('waist').value;

      let hasError = false;

      // Validate Date
      if (!date) {
        displayError("date", "Please enter a valid date.");
        hasError = true;
      }

      // Validate Weight
      if (isNaN(weight) || weight <= 0) {
        displayError("current-weight", "Weight must be a positive number.");
        hasError = true;
      }

      // Validate Waist
      if (isNaN(waist) || waist <= 0) {
        displayError("waist", "Waist measurement must be a positive number.");
        hasError = true;
      }

      // If there are validation errors, stop the form submission
      if (hasError) {
        return;
      }

      // Create log entry if no validation errors
      const progressData = { date, weight, waist };

      // Save the new progress data to localStorage
      saveProgress(progressData);

      // Append the new progress data to the log list
      const li = document.createElement('li');
      li.textContent = `${date} - Weight: ${weight}kg, Waist: ${waist}cm`;
      if (logList) {
        logList.appendChild(li);
      }

      // Reset form after submission
      progressForm.reset();
    });
  }

  // Function to save progress to localStorage
  function saveProgress(data) {
    let progressLogs = JSON.parse(localStorage.getItem('progressLogs')) || [];
    progressLogs.push(data);
    localStorage.setItem('progressLogs', JSON.stringify(progressLogs));
  }

  // Function to load progress from localStorage
  function loadProgress() {
    const progressLogs = JSON.parse(localStorage.getItem('progressLogs')) || [];
    if (logList) {
      progressLogs.forEach(log => {
        const li = document.createElement('li');
        li.textContent = `${log.date} | Weight: ${log.weight}kg | Waist: ${log.waist}cm`;
        logList.appendChild(li);
      });
    }
  }

  // Navbar Toggle
  const toggleButton = document.querySelector('.navbar-toggle');
  const navbarMenu = document.querySelector('.navbar-menu');

  if (toggleButton && navbarMenu) {
    toggleButton.addEventListener('click', () => {
      navbarMenu.classList.toggle('active'); // This will show/hide the menu
    });
  }

  // Clear Progress Button
  const clearProgressButton = document.getElementById('clear-progress');
  if (clearProgressButton && logList) {
    clearProgressButton.addEventListener('click', function () {
      localStorage.removeItem('progressLogs');
      if (logList) {
        logList.innerHTML = ''; // Clear the displayed progress logs
      }
    });
  }
});

