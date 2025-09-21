// script.js
// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBpTTk0xrFOFBEnBU62mWCgtbLbAYHZ3Is",
    authDomain: "career-and-skill-advisor-1ce79.firebaseapp.com",
    projectId: "career-and-skill-advisor-1ce79",
    storageBucket: "career-and-skill-advisor-1ce79.firebasestorage.app",
    messagingSenderId: "340590498085",
    appId: "1:340590498085:web:914c8ee3c10517b00fcacc",
    measurementId: "G-YC51LTSTDW"
};

// Initialize Firebase once
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// API Key for Gemini (Replace with your actual key)
const API_KEY = "AIzaSyBaT7G0IVOhzdCW08_Hg9EQHw1ibw5Vx5M";
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;

// Supported Indian languages and their codes for the chatbot
const supportedLanguages = {
    'english': 'en',
    'hindi': 'hi',
    'bengali': 'bn',
    'telugu': 'te',
    'marathi': 'mr',
    'tamil': 'ta',
    'gujarati': 'gu',
    'kannada': 'kn',
    'malayalam': 'ml',
    'punjabi': 'pa'
};

let currentLanguage = 'en';

document.addEventListener("DOMContentLoaded", function() {
    const loading = document.getElementById("loading");
    const appContent = document.getElementById("app-content-container");
    const userProfile = document.getElementById("user-profile");
    const loginLink = document.getElementById("login-signup-link");
    const logoutLink = document.getElementById("logout-link");
    const emailVerificationBanner = document.getElementById("email-verification-banner");

    // Chatbot elements
    const chatbotToggle = document.getElementById("chatbot-toggle");
    const chatbotContainer = document.getElementById("chatbot-container");
    const chatbotClose = document.getElementById("chatbot-close");
    const chatbotBody = document.getElementById("chatbot-body");
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotSendBtn = document.getElementById("chatbot-send");

    // Welcome message elements from index.html
    const welcomeMessageElement = document.getElementById("welcome-message");
    const heroSubtitleElement = document.querySelector(".hero-content .hero-subtitle");
    const heroContent = document.querySelector(".hero-content");
    
    // Quiz page elements
    const quizPromptContainer = document.getElementById("quiz-prompt-container");
    const quizQuestionsContainer = document.getElementById("quiz-questions-container");
    const userSkillsInput = document.getElementById("user-skills-input");
    const difficultySelect = document.getElementById("difficulty-select");
    const questionsContainer = document.getElementById("questions-container");
    const submitQuizBtn = document.getElementById("submit-quiz-btn");
    
    let currentQuizData = [];

    auth.onAuthStateChanged(user => {
        if (loading) {
            loading.style.display = 'none';
        }
        
        if (appContent) {
            appContent.style.display = 'block';
        }

        if (user) {
            console.log("User is signed in:", user.email);
            if (userProfile) {
                userProfile.style.display = 'flex';
            }
            if (loginLink) {
                loginLink.style.display = 'none';
            }

            if (!user.emailVerified) {
                if (emailVerificationBanner) {
                    emailVerificationBanner.style.display = 'block';
                }
            } else {
                if (emailVerificationBanner) {
                    emailVerificationBanner.style.display = 'none';
                }
            }

            if (welcomeMessageElement && heroSubtitleElement) {
                db.collection("users").doc(user.uid).get().then(doc => {
                    const userData = doc.data();
                    if (userData && userData.username) {
                        welcomeMessageElement.textContent = `Welcome, ${userData.username}!`;
                    } else {
                        welcomeMessageElement.textContent = `Welcome, User!`;
                    }
                    heroSubtitleElement.style.marginTop = '20px';
                }).catch(error => {
                    console.error("Error fetching user data:", error);
                    welcomeMessageElement.textContent = `Welcome, User!`;
                    heroSubtitleElement.style.marginTop = '20px';
                });
            }

        } else {
            console.log("User is signed out");
            if (userProfile) {
                userProfile.style.display = 'none';
            }
            if (loginLink) {
                loginLink.style.display = 'block';
            }
            if (emailVerificationBanner) {
                emailVerificationBanner.style.display = 'none';
            }

            if (welcomeMessageElement && heroSubtitleElement) {
                welcomeMessageElement.textContent = '';
                heroSubtitleElement.style.marginTop = '0';
            }
        }
    });

    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                window.location.href = "login.html";
            }).catch((error) => {
                console.error("Sign-out Error:", error.message);
                alert("Error signing out: " + error.message);
            });
        });
    }

    if (chatbotToggle) {
        chatbotToggle.addEventListener("click", () => {
            chatbotContainer.classList.toggle("active");
        });
    }

    if (chatbotClose) {
        chatbotClose.addEventListener("click", () => {
            chatbotContainer.classList.remove("active");
        });
    }

    function addMessage(text, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", `${sender}-message`);
        messageElement.textContent = text;
        chatbotBody.appendChild(messageElement);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }

    function isIndianLanguage(text) {
      const langKeywords = {
        'hi': ['नमस्ते', 'क्या', 'आप', 'हैं'],
        'bn': ['নমস্কার', 'আপনি', 'কেমন', 'আছেন'],
        'te': ['నమస్కారం', 'మీరు', 'ఎలా', 'ఉన్నారు'],
        'mr': ['नमस्कार', 'तुम्ही', 'कसे', 'आहात'],
        'ta': ['வணக்கம்', 'நீங்கள்', 'எப்படி', 'இருக்கிறீர்கள்'],
        'gu': ['નમસ્કાર', 'તમે', 'કેમ', 'છો'],
        'kn': ['ನಮಸ್ಕಾರ', 'ನೀವು', 'ಹೇಗಿದ್ದೀರಿ'],
        'ml': ['നമസ്കാരം', 'നിങ്ങൾ', 'എങ്ങനെയുണ്ട്'],
        'pa': ['ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'ਤੁਸੀਂ', 'ਕਿਵੇਂ', 'ਹੋ']
      };

      for (const langCode in langKeywords) {
        if (langKeywords[langCode].some(keyword => text.includes(keyword))) {
          return langCode;
        }
      }
      return null;
    }
    
    async function handleUserMessage(messageText) {
        addMessage(messageText, "user");
        chatbotInput.value = '';

        const lowerMessage = messageText.toLowerCase().trim();

        if (lowerMessage.includes('skill quiz') || lowerMessage.includes('take a quiz') || lowerMessage.includes('test my skills')) {
            addMessage("I can help with that! Please choose an option on the skill quiz prompt.", "bot");
            window.location.href = "quiz.html";
            return;
        }

        if (lowerMessage === 'hi' || lowerMessage === 'hello') {
            const languagesList = Object.keys(supportedLanguages).map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(', ');
            addMessage(`Hello! Which language do you prefer? You can choose from: ${languagesList}.`, "bot");
            return;
        }

        const languageSelection = Object.keys(supportedLanguages).find(lang => lowerMessage.includes(lang));
        if (languageSelection && currentLanguage !== supportedLanguages[languageSelection]) {
            currentLanguage = supportedLanguages[languageSelection];
            addMessage(`Language set to ${languageSelection.charAt(0).toUpperCase() + languageSelection.slice(1)}.`, "bot");
            return;
        }

        const detectedLang = isIndianLanguage(lowerMessage);
        if (detectedLang) {
          currentLanguage = detectedLang;
        } else if (currentLanguage !== 'en' && !languageSelection) {
            addMessage(`I don't understand that language. Please type in English or select a language from: ${Object.keys(supportedLanguages).filter(l => l !== 'english').join(', ')}.`, "bot");
            return;
        }

        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Answer the following query in a conversational tone. The user's language preference is ${currentLanguage}. Please respond in that language. User's query: ${messageText}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2000
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
            addMessage(botResponse, "bot");
        } catch (error) {
            console.error("Error fetching chatbot response:", error);
            addMessage("I'm sorry, I am currently unable to provide a response. Please try again later.", "bot");
        }
    }

    if (chatbotSendBtn) {
        chatbotSendBtn.addEventListener("click", () => {
            const userMessage = chatbotInput.value.trim();
            if (userMessage) {
                handleUserMessage(userMessage);
            }
        });
    }
    
    if (chatbotInput) {
        chatbotInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                const userMessage = chatbotInput.value.trim();
                if (userMessage) {
                    handleUserMessage(userMessage);
                }
            }
        });
    }

    // --- Quiz Page Logic ---
    window.showSkillInput = function() {
        document.getElementById('skill-input-container').style.display = 'block';
        document.getElementById('difficulty-container').style.display = 'block';
    }

    window.redirectToAssessment = function() {
        window.location.href = 'form.html';
    }

    window.generateQuiz = async function() {
        const skills = userSkillsInput.value;
        const difficulty = difficultySelect.value;
        if (skills.trim() === '') {
            alert('Please enter your skills to start the quiz.');
            return;
        }
        
        quizPromptContainer.style.display = 'none';
        loading.style.display = 'flex';

        const API_ENDPOINT_QUIZ = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;
        
        const prompt = `Generate a multiple-choice quiz with 10 questions on the following skills: ${skills}. The difficulty should be ${difficulty}. Each question should have 4 options and a single correct answer. Format the response as a JSON array of objects, where each object has "question", "options" (an array of strings), and "answer" (the correct option). Do not include any additional text outside the JSON.`;

        try {
            const response = await fetch(API_ENDPOINT_QUIZ, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                      temperature: 0.7,
                      maxOutputTokens: 2000
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";
            
            let jsonString = aiResponse;
            const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                jsonString = jsonMatch[1];
            }
            
            currentQuizData = JSON.parse(jsonString);
            
            loading.style.display = 'none';
            renderQuiz();

        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Failed to generate quiz. Please check the API key and console for details.');
            loading.style.display = 'none';
            quizPromptContainer.style.display = 'flex';
        }
    }

    window.renderQuiz = function() {
        questionsContainer.innerHTML = '';
        currentQuizData.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('quiz-question');
            questionDiv.innerHTML = `<h4>${index + 1}. ${q.question}</h4>`;
            
            const optionsDiv = document.createElement('div');
            optionsDiv.classList.add('quiz-options');
            
            q.options.forEach(option => {
                const optionLabel = document.createElement('label');
                optionLabel.classList.add('quiz-option');
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `question-${index}`;
                radio.value = option;

                optionLabel.appendChild(radio);
                optionLabel.innerHTML += `<span>${option}</span>`;
                optionsDiv.appendChild(optionLabel);
            });

            questionDiv.appendChild(optionsDiv);
            questionsContainer.appendChild(questionDiv);
        });

        quizQuestionsContainer.style.display = 'flex';
        submitQuizBtn.style.display = 'block';
    }

    window.submitQuiz = function() {
        const questions = document.querySelectorAll('.quiz-question');
        let score = 0;

        questions.forEach((questionDiv, index) => {
            const selectedOption = questionDiv.querySelector(`input[name="question-${index}"]:checked`);
            const correctAnswer = currentQuizData[index].answer;
            const feedbackContainer = document.createElement('div');
            feedbackContainer.classList.add('result-feedback');

            if (selectedOption) {
                const isCorrect = selectedOption.value === correctAnswer;
                const optionLabel = selectedOption.closest('.quiz-option');
                
                if (isCorrect) {
                    score++;
                    optionLabel.classList.add('correct');
                    feedbackContainer.textContent = "Correct!";
                    feedbackContainer.classList.add('correct-answer');
                } else {
                    optionLabel.classList.add('incorrect');
                    feedbackContainer.textContent = "Incorrect. The correct answer is: " + correctAnswer;
                    feedbackContainer.classList.add('incorrect-feedback');
                    
                    const correctOption = questionDiv.querySelector(`input[value="${correctAnswer}"]`);
                    if (correctOption) {
                        correctOption.closest('.quiz-option').classList.add('correct');
                    }
                }
            } else {
                feedbackContainer.textContent = "You did not select an answer. The correct answer is: " + correctAnswer;
                feedbackContainer.classList.add('incorrect-feedback');
                const correctOption = questionDiv.querySelector(`input[value="${correctAnswer}"]`);
                if (correctOption) {
                    correctOption.closest('.quiz-option').classList.add('correct');
                }
            }
            questionDiv.appendChild(feedbackContainer);
        });

        const totalScoreElement = document.createElement('h3');
        totalScoreElement.textContent = `You scored ${score} out of ${currentQuizData.length}!`;
        totalScoreElement.style.textAlign = 'center';
        questionsContainer.prepend(totalScoreElement);

        submitQuizBtn.style.display = 'none';
    }
    document.querySelectorAll(".progress-bar").forEach(bar => {
        const progress = bar.getAttribute("data-progress");
        const fill = bar.querySelector(".progress-fill");
        if (fill) {
            fill.style.width = progress + "%";
        }
    });

    console.log("Script initialization complete");
});
