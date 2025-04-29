document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const startSection = document.getElementById('assessment-start');
    const formSection = document.getElementById('assessment-form');
    const resultsSection = document.getElementById('assessment-results');
    const startButton = document.getElementById('start-assessment');
    const prevButton = document.getElementById('prev-btn');
    const nextButton = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const questionProgress = document.getElementById('question-progress');
    const restartButton = document.getElementById('restart-assessment');
    
    // Result sections
    const highRiskResult = document.getElementById('result-high-risk');
    const mediumRiskResult = document.getElementById('result-medium-risk');
    const lowRiskResult = document.getElementById('result-low-risk');
    
    // Variables
    let currentQuestion = 1;
    const totalQuestions = document.querySelectorAll('.question-slide').length;
    
    // Start assessment button
    startButton.addEventListener('click', function() {
        startSection.style.display = 'none';
        formSection.style.display = 'block';
        updateProgressBar();
    });
    
    // Restart assessment button
    restartButton.addEventListener('click', function() {
        // Reset all form inputs
        document.querySelectorAll('input[type="radio"]').forEach(input => {
            input.checked = false;
        });
        
        // Reset to first question
        currentQuestion = 1;
        
        // Show first question, hide others
        document.querySelectorAll('.question-slide').forEach(slide => {
            slide.style.display = 'none';
        });
        document.querySelector(`.question-slide[data-question="1"]`).style.display = 'block';
        
        // Update progress
        updateProgressBar();
        
        // Reset buttons
        prevButton.disabled = true;
        nextButton.textContent = 'Next';
        
        // Hide results, show form
        resultsSection.style.display = 'none';
        formSection.style.display = 'block';
    });
    
    // Previous button
    prevButton.addEventListener('click', function() {
        if (currentQuestion > 1) {
            document.querySelector(`.question-slide[data-question="${currentQuestion}"]`).style.display = 'none';
            currentQuestion--;
            document.querySelector(`.question-slide[data-question="${currentQuestion}"]`).style.display = 'block';
            
            // If at first question, disable previous button
            if (currentQuestion === 1) {
                prevButton.disabled = true;
            }
            
            // If not at last question, show "Next" instead of "Submit"
            if (currentQuestion < totalQuestions) {
                nextButton.textContent = 'Next';
            }
            
            updateProgressBar();
        }
    });
    
    // Next button
    nextButton.addEventListener('click', function() {
        // Check if current question is answered
        const currentSlide = document.querySelector(`.question-slide[data-question="${currentQuestion}"]`);
        const radioButtons = currentSlide.querySelectorAll('input[type="radio"]');
        let answered = false;
        
        radioButtons.forEach(radio => {
            if (radio.checked) {
                answered = true;
            }
        });
        
        if (!answered) {
            alert('Please answer the current question before proceeding.');
            return;
        }
        
        if (currentQuestion < totalQuestions) {
            currentSlide.style.display = 'none';
            currentQuestion++;
            document.querySelector(`.question-slide[data-question="${currentQuestion}"]`).style.display = 'block';
            
            // Enable previous button
            prevButton.disabled = false;
            
            // If at last question, change "Next" to "Submit"
            if (currentQuestion === totalQuestions) {
                nextButton.textContent = 'Submit';
            }
            
            updateProgressBar();
        } else {
            // Submit form
            calculateRisk();
        }
    });
    
    // Update progress bar
    function updateProgressBar() {
        const progress = (currentQuestion - 1) / totalQuestions * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        questionProgress.textContent = `Question ${currentQuestion} of ${totalQuestions}`;
    }
    
    // Calculate risk level
    function calculateRisk() {
        // Get all answers
        const fever = document.querySelector('input[name="fever"]:checked').value;
        const cough = document.querySelector('input[name="cough"]:checked').value;
        const breathing = document.querySelector('input[name="breathing"]:checked').value;
        const smellTaste = document.querySelector('input[name="smell-taste"]:checked').value;
        const fatigue = document.querySelector('input[name="fatigue"]:checked').value;
        const otherSymptoms = document.querySelector('input[name="other-symptoms"]:checked').value;
        const contact = document.querySelector('input[name="contact"]:checked').value;
        const medicalCondition = document.querySelector('input[name="medical-condition"]:checked').value;
        
        // Assign risk scores
        let score = 0;
        
        // Major symptoms
        if (fever === 'yes') score += 3;
        if (cough === 'yes') score += 3;
        if (breathing === 'yes') score += 5;
        if (smellTaste === 'yes') score += 4;
        
        // Minor symptoms
        if (fatigue === 'yes') score += 2;
        if (otherSymptoms === 'yes') score += 2;
        
        // Risk factors
        if (contact === 'yes') score += 3;
        if (medicalCondition === 'yes') score += 2;
        
        // Determine risk level
        let riskLevel;
        if (breathing === 'yes' || score >= 8) {
            riskLevel = 'high';
        } else if (score >= 4) {
            riskLevel = 'medium';
        } else {
            riskLevel = 'low';
        }
        
        // Show appropriate result
        formSection.style.display = 'none';
        resultsSection.style.display = 'block';
        
        // Hide all results first
        highRiskResult.style.display = 'none';
        mediumRiskResult.style.display = 'none';
        lowRiskResult.style.display = 'none';
        
        // Show appropriate result
        if (riskLevel === 'high') {
            highRiskResult.style.display = 'block';
        } else if (riskLevel === 'medium') {
            mediumRiskResult.style.display = 'block';
        } else {
            lowRiskResult.style.display = 'block';
        }
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
});
