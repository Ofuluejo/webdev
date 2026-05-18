// YouTube Study Mode - Content Script (Fully Updated & Premium)
function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

class YouTubeStudyMode {
  constructor() {
    this.focusModeEnabled = false;
    this.isStudySession = false;
    this.streak = 0;
    this.motivationalOverlay = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    
    if (this.focusModeEnabled) {
      this.enableFocusMode();
    }

    if (this.shouldShowOverlay()) {
      this.showMotivationalOverlay();
    }

    this.checkBlockedPages();

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
      this.handleStorageChanges(changes);
    });

    // Observe YouTube SPA navigation
    this.observePageChanges();
  }

  async loadSettings() {
    const data = await getStorage(['focusMode', 'isStudying', 'streak']);
    this.focusModeEnabled = data.focusMode || false;
    this.isStudySession = data.isStudying || false;
    this.streak = data.streak || 0;
  }

  enableFocusMode() {
    document.documentElement.setAttribute('data-study-mode', 'true');
    console.log('📚 Study Mode: Focus Mode Activated');
  }

  disableFocusMode() {
    document.documentElement.removeAttribute('data-study-mode');
    console.log('📚 Study Mode: Focus Mode Deactivated');
  }

  shouldShowOverlay() {
    const homepagePaths = ['/', '/feed/trending', '/feed/subscriptions'];
    const isHomepage = homepagePaths.includes(window.location.pathname) || 
                      window.location.pathname === '/';
    
    const dismissed = sessionStorage.getItem('studyOverlayDismissed');
    
    return isHomepage && !dismissed && !this.isStudySession;
  }

  isBlockedPage() {
    const blockedPatterns = [
      /^\/shorts/,
      /^\/feed\/trending/,
      /^\/feed\/explore/,
      /^\/gaming/,
      /^\/results\?/,           // Search results with distractions
      /^\/watch\?.*list=.*RD/,  // Mix playlists
    ];

    const currentPath = window.location.pathname + window.location.search;
    return blockedPatterns.some(pattern => pattern.test(currentPath));
  }

  showMotivationalOverlay() {
    if (this.motivationalOverlay) return;

    const messages = [
      "What are you here to master today?",
      "Your future self is watching. Make them proud.",
      "Focus is the currency of achievement.",
      "Every great mind has one thing in common: deep focus.",
      "Small consistent sessions create massive results.",
      "You're building something great. Stay in the zone."
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const overlay = document.createElement('div');
    overlay.className = 'study-mode-overlay';
    
    overlay.innerHTML = `
      <div class="study-mode-card">
        <div class="study-mode-icon">📚</div>
        <h2 class="study-mode-title">${randomMessage}</h2>
        <p class="study-mode-subtitle">Study Mode is protecting your focus. Let's make this session count.</p>
        
        ${this.streak >= 2 ? `
        <div class="streak-info">
          🔥 ${this.streak} day streak — You're on fire!
        </div>` : ''}
        
        <button class="study-mode-close">I'm Ready to Focus</button>
      </div>
    `;

    document.body.appendChild(overlay);
    this.motivationalOverlay = overlay;

    const closeBtn = overlay.querySelector('.study-mode-close');
    closeBtn.addEventListener('click', () => this.dismissOverlay());

    // Auto dismiss after 9 seconds
    setTimeout(() => {
      if (this.motivationalOverlay) this.dismissOverlay();
    }, 9000);
  }

  dismissOverlay() {
    if (this.motivationalOverlay) {
      this.motivationalOverlay.style.opacity = '0';
      setTimeout(() => {
        this.motivationalOverlay?.remove();
        this.motivationalOverlay = null;
      }, 350);
      
      sessionStorage.setItem('studyOverlayDismissed', 'true');
    }
  }

  checkBlockedPages() {
    if (!this.isStudySession) return;

    if (this.isBlockedPage()) {
      this.showBlockedPage();
    }
  }

  showBlockedPage() {
    const blockedUrl = chrome.runtime.getURL('blocked.html');
    if (window.location.href !== blockedUrl) {
      window.location.replace(blockedUrl);
    }
  }

  handleStorageChanges(changes) {
    if (changes.focusMode !== undefined) {
      this.focusModeEnabled = changes.focusMode.newValue;
      if (this.focusModeEnabled) {
        this.enableFocusMode();
      } else {
        this.disableFocusMode();
      }
    }

    if (changes.isStudying !== undefined) {
      this.isStudySession = changes.isStudying.newValue;
      this.checkBlockedPages();
    }

    if (changes.streak !== undefined) {
      this.streak = changes.streak.newValue || 0;
    }
  }

  observePageChanges() {
    let lastUrl = location.href;

    new MutationObserver(() => {
      const currentUrl = location.href;
      
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;

        // Re-apply focus mode after navigation
        if (this.focusModeEnabled) {
          setTimeout(() => this.enableFocusMode(), 300);
        }

        // Check for blocked pages
        this.checkBlockedPages();

        // Show motivational overlay on homepage
        if (this.shouldShowOverlay()) {
          setTimeout(() => this.showMotivationalOverlay(), 600);
        }
      }
    }).observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new YouTubeStudyMode());
} else {
  new YouTubeStudyMode();
}