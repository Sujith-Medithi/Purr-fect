document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       Theme Toggle (Dark / Light Mode)
       ========================================================================== */
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    // Check for saved theme preference, otherwise default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    /* ==========================================================================
       Mobile Navigation Menu
       ========================================================================== */
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside of header
    document.addEventListener('click', (e) => {
        if (!mobileMenuBtn.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });

    /* ==========================================================================
       Scroll Reveal Intersection Observer
       ========================================================================== */
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                // Unobserve after animating in
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    /* ==========================================================================
       Modals for Cat Natures
       ========================================================================== */
    const openModalButtons = document.querySelectorAll('.open-modal-btn');
    const closeModalButtons = document.querySelectorAll('.modal-close');
    const modalOverlays = document.querySelectorAll('.modal-overlay');

    openModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const targetModal = document.getElementById(targetId);
            if (targetModal) {
                targetModal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Lock background scroll
            }
        });
    });

    function closeModal() {
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = ''; // Unlock background scroll
    }

    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', closeModal);
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    /* ==========================================================================
       Interactive Quiz: Find Your Purr-fect Match
       ========================================================================== */
    const quizIntro = document.getElementById('quizIntro');
    const quizContainer = document.getElementById('quizContainer');
    const quizResult = document.getElementById('quizResult');
    const startQuizBtn = document.getElementById('startQuizBtn');
    const restartQuizBtn = document.getElementById('restartQuizBtn');
    
    const progressFill = document.getElementById('progressFill');
    const questionNumber = document.getElementById('questionNumber');
    const questionText = document.getElementById('questionText');
    const quizOptions = document.getElementById('quizOptions');

    const resultTitle = document.getElementById('resultTitle');
    const resultIllustration = document.getElementById('resultIllustration');
    const resultDesc = document.getElementById('resultDesc');
    const resultTipsList = document.getElementById('resultTipsList');

    const quizQuestions = [
        {
            question: "How much time do you spend away from home on a typical day?",
            options: [
                { text: "Hardly any—I work from home or spend most of my time indoors.", score: { cuddler: 4, chatterbox: 2, sage: 0, explorer: 1 }, letter: "A" },
                { text: "A moderate amount—I'm away for normal work/study hours, but home on evenings.", score: { sage: 2, explorer: 3, cuddler: 2, chatterbox: 2 }, letter: "B" },
                { text: "A significant amount—I have a busy schedule, long shifts, or travel often.", score: { sage: 5, cuddler: 0, chatterbox: 0, explorer: 1 }, letter: "C" }
            ]
        },
        {
            question: "What is your idea of a perfect weekend evening?",
            options: [
                { text: "Snuggled under a soft blanket, reading a book or watching a movie.", score: { cuddler: 5, sage: 3, chatterbox: 0, explorer: 0 }, letter: "A" },
                { text: "Playing interactive video games or starting a fun DIY home project.", score: { explorer: 5, chatterbox: 2, cuddler: 1, sage: 0 }, letter: "B" },
                { text: "Having a friendly conversation or hanging out with close friends.", score: { chatterbox: 5, explorer: 2, cuddler: 2, sage: 0 }, letter: "C" }
            ]
        },
        {
            question: "How would you describe the atmosphere and space of your home?",
            options: [
                { text: "Cozy and quiet with limited space—a peaceful sanctuary.", score: { cuddler: 4, sage: 4, chatterbox: 1, explorer: 0 }, letter: "A" },
                { text: "Spacious with high ledges, window sills, and room to run around.", score: { explorer: 5, chatterbox: 2, cuddler: 1, sage: 1 }, letter: "B" },
                { text: "Vibrant and busy with children, guests, or other animal companions.", score: { explorer: 2, chatterbox: 4, cuddler: 2, sage: 0 }, letter: "C" }
            ]
        },
        {
            question: "What primary quality are you looking for in a cat?",
            options: [
                { text: "Unconditional warmth, lap-cuddles, and physical attachment.", score: { cuddler: 5, chatterbox: 1, explorer: 0, sage: 0 }, letter: "A" },
                { text: "An intelligent, high-spirited companion who keeps me entertained with play.", score: { explorer: 5, chatterbox: 1, cuddler: 0, sage: 0 }, letter: "B" },
                { text: "A vocal, responsive buddy who chats back and interacts actively.", score: { chatterbox: 5, explorer: 1, cuddler: 1, sage: 0 }, letter: "C" },
                { text: "A dignified, independent roommate who respects my personal boundaries.", score: { sage: 5, cuddler: 0, explorer: 0, chatterbox: 0 }, letter: "D" }
            ]
        }
    ];

    let currentQuestionIndex = 0;
    let userScores = {
        cuddler: 0,
        explorer: 0,
        sage: 0,
        chatterbox: 0
    };

    const temperamentInfo = {
        cuddler: {
            title: "The Cozy Cuddler!",
            img: "images/cuddly_cat.png",
            desc: "You matched with the Cozy Cuddler nature. You appreciate peaceful, warm, and deeply affectionate connections. A Cuddler cat will gladly be your shadow, curl up in your lap while you work or read, and offer relaxing, therapeutic purrs to ease your day.",
            tips: [
                "Invest in soft, premium cat beds and window perches near your favorite seating areas.",
                "Dedicate quiet moments daily for physical bonding and grooming sessions.",
                "Ensure your home environment stays relatively quiet, as Cuddlers thrive in peaceful settings."
            ]
        },
        explorer: {
            title: "The Playful Explorer!",
            img: "images/playful_cat.png",
            desc: "You matched with the Playful Explorer nature. You have an active lifestyle and appreciate intelligence and amusement. An Explorer cat is full of life and curiosity, constantly scaling high perches, chasing toys, and engaging in energetic play that will keep you laughing.",
            tips: [
                "Install vertical cat trees, climbing shelves, and window perches to satisfy their urge to climb.",
                "Provide puzzle feeders and rotation-based toys to keep their active minds stimulated.",
                "Set aside 15-20 minutes twice a day for interactive play with feather wands or laser pointers."
            ]
        },
        sage: {
            title: "The Independent Sage!",
            img: "images/sage_cat.png",
            desc: "You matched with the Independent Sage nature. You live a busy life or enjoy personal space, making this dignified companion perfect. A Sage cat is calm, quiet, and independent. They show love through gentle slow-blinks and like to observe you peacefully from a distance without demanding constant attention.",
            tips: [
                "Provide small cozy cubbies or cardboard boxes where they can retreat and rest completely undisturbed.",
                "Establish a reliable, automated daily routine for meals, as they find comfort in predictability.",
                "Let them initiate physical contact. Respect their cues when they need quiet time."
            ]
        },
        chatterbox: {
            title: "The Vocal Chatterbox!",
            img: "images/chatterbox_cat.png",
            desc: "You matched with the Vocal Chatterbox nature. You love social engagement and constant interaction. A Chatterbox is an outgoing communicator who will chirp, trill, and meow to share their daily thoughts, answer your questions, and express exactly what they need.",
            tips: [
                "Engage in conversations with them! Vocal feedback strengthens your bond.",
                "Prevent boredom-induced calling by keeping window blinds open or setting up a bird feeder outside.",
                "Consider adopting a compatible companion cat if you are away for parts of the day."
            ]
        }
    };

    startQuizBtn.addEventListener('click', startQuiz);
    restartQuizBtn.addEventListener('click', restartQuiz);

    function startQuiz() {
        quizIntro.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        currentQuestionIndex = 0;
        userScores = { cuddler: 0, explorer: 0, sage: 0, chatterbox: 0 };
        showQuestion();
    }

    function showQuestion() {
        const currentQuestion = quizQuestions[currentQuestionIndex];
        
        // Progress Bar
        const progressPercent = ((currentQuestionIndex) / quizQuestions.length) * 100;
        progressFill.style.width = `${progressPercent || 5}%`;
        
        questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
        questionText.textContent = currentQuestion.question;
        
        // Generate options HTML
        quizOptions.innerHTML = '';
        currentQuestion.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.innerHTML = `
                <span class="option-letter">${option.letter}</span>
                <span class="option-text">${option.text}</span>
            `;
            btn.addEventListener('click', () => handleOptionClick(option.score));
            quizOptions.appendChild(btn);
        });
    }

    function handleOptionClick(score) {
        // Add option scores to user totals
        for (const temperament in score) {
            userScores[temperament] += score[temperament];
        }

        currentQuestionIndex++;

        if (currentQuestionIndex < quizQuestions.length) {
            showQuestion();
        } else {
            showResult();
        }
    }

    function showResult() {
        quizContainer.classList.add('hidden');
        quizResult.classList.remove('hidden');
        progressFill.style.width = '100%';

        // Determine highest score
        let bestMatch = 'cuddler';
        let highestScore = -1;

        for (const temperament in userScores) {
            if (userScores[temperament] > highestScore) {
                highestScore = userScores[temperament];
                bestMatch = temperament;
            }
        }

        const matchInfo = temperamentInfo[bestMatch];

        resultTitle.textContent = `You Matched with: ${matchInfo.title}`;
        resultDesc.textContent = matchInfo.desc;

        // Render visual
        if (matchInfo.img) {
            resultIllustration.innerHTML = `<img src="${matchInfo.img}" alt="${matchInfo.title}">`;
        } else if (matchInfo.vector) {
            resultIllustration.innerHTML = matchInfo.vector;
        }

        // Render tips
        resultTipsList.innerHTML = '';
        matchInfo.tips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            resultTipsList.appendChild(li);
        });

        // Scroll result into view smoothly
        quizResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function restartQuiz() {
        quizResult.classList.add('hidden');
        startQuiz();
    }
});
