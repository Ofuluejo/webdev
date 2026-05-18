// YouTube Study Mode - Popup Script (Full Version with Premium Dark Mode)
function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function setStorage(items) {
  return new Promise((resolve) => chrome.storage.local.set(items, resolve));
}

class StudyModePopup {
  constructor() {
    this.timeRemaining = 25 * 60;
    this.isRunning = false;
    this.isBreak = false;
    this.streak = 0;
    this.stats = { sessions: 0, minutes: 0 };
    this.studyDuration = 25 * 60;
    this.darkMode = false;

    this.elements = {
      focusToggle: document.getElementById('focusModeToggle'),
      focusStatus: document.getElementById('focusModeStatus'),
      timerDisplay: document.getElementById('timerDisplay'),
      timerStatus: document.getElementById('timerStatus'),
      sessionType: document.getElementById('sessionType'),
      startBtn: document.getElementById('startBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      resetBtn: document.getElementById('resetBtn'),
      sessionsCount: document.getElementById('sessionsCount'),
      minutesCount: document.getElementById('minutesCount'),
      streakDisplay: document.getElementById('streakDisplay'),
      durationSelect: document.getElementById('durationSelect'),
      darkModeToggle: document.getElementById('darkModeToggle'),
      resetStatsBtn: document.getElementById('resetStatsBtn')
    };

    this.init();
  }

  async init() {
    await this.loadState();
    this.setupEventListeners();
    this.updateDisplay();
    this.updateButtons();
    this.updateStats();
    this.loadDarkMode();

    // Listen for timer updates from background
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'TIMER_UPDATE') {
        this.timeRemaining = msg.state.timeRemaining;
        this.isRunning = msg.state.isRunning;
        this.isBreak = msg.state.isBreak;
        this.updateDisplay();
        this.updateButtons();
      } else if (msg.type === 'TIMER_COMPLETE') {
        this.timeRemaining = msg.state.timeRemaining;
        this.isRunning = false;
        this.isBreak = msg.state.isBreak;
        this.streak = msg.streak || this.streak;
        this.stats = msg.stats || this.stats;
        this.updateDisplay();
        this.updateButtons();
        this.updateStats();
      }
    });
  }

  async loadState() {
    const data = await getStorage(['focusMode', 'timerState', 'dailyStats', 'streak', 'darkMode']);
    
    // Focus Mode
    this.elements.focusToggle.checked = !!data.focusMode;
    this.updateFocusStatus(!!data.focusMode);

    // Timer State
    if (data.timerState) {
      this.timeRemaining = data.timerState.timeRemaining;
      this.isRunning = data.timerState.isRunning;
      this.isBreak = data.timerState.isBreak;
      this.studyDuration = data.timerState.studyDuration || 25 * 60;
      
      if (this.elements.durationSelect) {
        this.elements.durationSelect.value = Math.floor(this.studyDuration / 60);
      }
    }

    // Stats
    if (data.dailyStats) this.stats = data.dailyStats;
    if (data.streak) this.streak = data.streak;
  }

  async loadDarkMode() {
    const data = await getStorage(['darkMode']);
    this.darkMode = data.darkMode !== undefined ? data.darkMode : 
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    document.body.classList.toggle('dark', this.darkMode);
    document.body.classList.toggle('light', !this.darkMode);
    
    if (this.elements.darkModeToggle) {
      this.elements.darkModeToggle.checked = this.darkMode;
    }
  }

  setupEventListeners() {
    // Focus Mode
    this.elements.focusToggle.addEventListener('change', (e) => this.toggleFocusMode(e.target.checked));

    // Timer Controls
    this.elements.startBtn.addEventListener('click', () => this.handleStart());
    this.elements.pauseBtn.addEventListener('click', () => this.handlePause());
    this.elements.resetBtn.addEventListener('click', () => this.handleReset());
    this.elements.resetStatsBtn.addEventListener('click', () => this.resetStats());

    // Duration Preset
    if (this.elements.durationSelect) {
      this.elements.durationSelect.addEventListener('change', (e) => {
        this.studyDuration = parseInt(e.target.value) * 60;
      });
    }

    // Dark Mode
    if (this.elements.darkModeToggle) {
      this.elements.darkModeToggle.addEventListener('change', (e) => this.toggleDarkMode(e.target.checked));
    }
  }

  async toggleFocusMode(enabled) {
    await setStorage({ focusMode: enabled });
    this.updateFocusStatus(enabled);
    const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
    tabs.forEach(tab => chrome.tabs.reload(tab.id));
  }

  updateFocusStatus(enabled) {
    this.elements.focusStatus.textContent = enabled ? 'ON' : 'OFF';
    this.elements.focusStatus.classList.toggle('active', enabled);
  }

  async toggleDarkMode(enabled) {
    this.darkMode = enabled;
    document.body.classList.toggle('dark', enabled);
    document.body.classList.toggle('light', !enabled);
    await setStorage({ darkMode: enabled });
  }

  async handleStart() {
    this.isRunning = true;
    await setStorage({ 
      isStudying: true,
      timerState: {
        timeRemaining: this.studyDuration,
        isRunning: true,
        isBreak: false,
        studyDuration: this.studyDuration
      }
    });
    chrome.runtime.sendMessage({ 
      type: 'START_TIMER', 
      studyDuration: this.studyDuration 
    });
    this.updateButtons();
    this.updateDisplay();
  }

  async handlePause() {
    this.isRunning = false;
    chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
    
    await setStorage({ 
      isStudying: false,
      timerState: {
        timeRemaining: this.timeRemaining,
        isRunning: false,
        isBreak: this.isBreak,
        studyDuration: this.studyDuration
      }
    });

    this.updateButtons();
    this.updateDisplay();
  }

  async handleReset() {
    this.isRunning = false;
    this.timeRemaining = this.isBreak ? 5 * 60 : this.studyDuration;
    
    chrome.runtime.sendMessage({ type: 'RESET_TIMER' });
    
    await setStorage({ 
      isStudying: false,
      timerState: {
        timeRemaining: this.timeRemaining,
        isRunning: false,
        isBreak: this.isBreak,
        studyDuration: this.studyDuration
      }
    });

    this.updateDisplay();
    this.updateButtons();
  }

  updateDisplay() {
    const min = Math.floor(this.timeRemaining / 60);
    const sec = this.timeRemaining % 60;
    this.elements.timerDisplay.textContent = `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;

    this.elements.timerStatus.textContent = this.isRunning 
      ? (this.isBreak ? 'Taking a break...' : 'Focus time! Keep going 🔥')
      : 'Ready to focus';

    this.elements.sessionType.textContent = this.isBreak 
      ? 'Break Time (5min)' 
      : `Study Session (${Math.floor(this.studyDuration/60)}min)`;
    this.elements.sessionType.classList.toggle('break', this.isBreak);
  }

  updateButtons() {
    if (this.isRunning) {
      this.elements.startBtn.textContent = "Running...";
      this.elements.startBtn.disabled = true;
      this.elements.pauseBtn.disabled = false;
    } else {
      this.elements.startBtn.textContent = (this.timeRemaining < this.studyDuration && !this.isBreak) 
        ? "Resume" 
        : "Start Session";
      this.elements.startBtn.disabled = false;
      this.elements.pauseBtn.disabled = true;
    }
  }

  updateStats() {
    this.elements.sessionsCount.textContent = this.stats.sessions || 0;
    this.elements.minutesCount.textContent = this.stats.minutes || 0;
    if (this.elements.streakDisplay) this.elements.streakDisplay.textContent = `${this.streak} days`;
  }

  async resetStats() {
    if (confirm('Reset today’s statistics?')) {
      this.stats = { date: new Date().toISOString().split('T')[0], sessions: 0, minutes: 0 };
      await setStorage({ dailyStats: this.stats });
      this.updateStats();
    }
  }
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', () => new StudyModePopup());