// Pomodoro Timer Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Check if pomodoro container exists
    const pomodoroContainer = document.getElementById('pomodoro-container');
    if (!pomodoroContainer) return;

    // Timer variables
    let timer;
    let minutes = 25;
    let seconds = 0;
    let isRunning = false;
    let mode = 'work'; // 'work', 'shortBreak', 'longBreak'
    let cycles = 0;
    
    // Settings
    const settings = {
        work: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4
    };

    // Create timer elements
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('pomodoro-start');
    const resetBtn = document.getElementById('pomodoro-reset');
    const modeButtons = document.querySelectorAll('.pomodoro-mode');

    // Initialize timer display
    updateTimerDisplay();

    // Event listeners
    startBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const newMode = this.dataset.mode;
            changeMode(newMode);
            
            // Update active button
            modeButtons.forEach(b => b.classList.remove('bg-indigo-600', 'text-white'));
            this.classList.add('bg-indigo-600', 'text-white');
        });
    });

    // Timer functions
    function toggleTimer() {
        if (isRunning) {
            clearInterval(timer);
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
            startBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            startBtn.classList.add('bg-green-500', 'hover:bg-green-600');
        } else {
            timer = setInterval(updateTimer, 1000);
            startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            startBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
            startBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        }
        isRunning = !isRunning;
    }

    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        setTimerForMode(mode);
        updateTimerDisplay();
        startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        startBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        startBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    }

    function updateTimer() {
        if (seconds === 0) {
            if (minutes === 0) {
                clearInterval(timer);
                playAlarm();
                completeTimer();
                return;
            }
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        // Update document title
        document.title = `(${timerDisplay.textContent}) TaskForge`;
        
        // Add color changes when timer is running low
        if (mode === 'work') {
            timerDisplay.classList.remove('warning', 'danger');
            if (minutes === 0 && seconds <= 30) {
                timerDisplay.classList.add('danger');
            } else if (minutes === 0 && seconds <= 59) {
                timerDisplay.classList.add('warning');
            } else if (minutes === 1 && seconds <= 30) {
                timerDisplay.classList.add('warning');
            }
        }
    }

    function changeMode(newMode) {
        mode = newMode;
        resetTimer();
    }

    function setTimerForMode(mode) {
        switch(mode) {
            case 'work':
                minutes = settings.work;
                break;
            case 'shortBreak':
                minutes = settings.shortBreak;
                break;
            case 'longBreak':
                minutes = settings.longBreak;
                break;
        }
        seconds = 0;
    }

    function completeTimer() {
        if (mode === 'work') {
            cycles++;
            if (cycles % settings.longBreakInterval === 0) {
                changeMode('longBreak');
                document.querySelector('[data-mode="longBreak"]').click();
            } else {
                changeMode('shortBreak');
                document.querySelector('[data-mode="shortBreak"]').click();
            }
        } else {
            changeMode('work');
            document.querySelector('[data-mode="work"]').click();
        }
        
        // Show notification
        showNotification();
        
        // Auto-start next timer
        if (!isRunning) toggleTimer();
    }

    function playAlarm() {
        // Play sound
        const audio = new Audio('/sounds/bell.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
    }

    function showNotification() {
        let title, message;
        
        if (mode === 'work') {
            title = 'Break Time!';
            message = 'Take a break and relax.';
        } else {
            title = 'Back to Work!';
            message = 'Focus time starts now.';
        }
        
        // Check if browser supports notifications
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, { 
                    body: message,
                    icon: '/favicon.ico'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, { 
                            body: message,
                            icon: '/favicon.ico'
                        });
                    }
                });
            }
        }
        
        // Fallback to alert if notifications not supported or denied
        const toast = document.getElementById('toast');
        if (toast) {
            const toastTitle = document.getElementById('toast-title');
            const toastMessage = document.getElementById('toast-message');
            
            toastTitle.textContent = title;
            toastMessage.textContent = message;
            
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 5000);
        }
    }
});