// YouTube Study Mode - Background Service Worker (Fixed)
let timerInterval = null;

function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function setStorage(items) {
  return new Promise((resolve) => chrome.storage.local.set(items, resolve));
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      focusMode: false,
      isStudying: false,
      timerState: { 
        timeRemaining: 25*60, 
        isRunning: false, 
        isBreak: false,
        studyDuration: 25*60 
      },
      dailyStats: { date: new Date().toISOString().split('T')[0], sessions: 0, minutes: 0 },
      streak: 0
    });
  }
});

async function startBackgroundTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(async () => {
    const data = await getStorage(['timerState']);
    let state = data.timerState || {};

    if (!state.isRunning || state.timeRemaining <= 0) return;

    state.timeRemaining--;
    
    await setStorage({ timerState: state });
    chrome.runtime.sendMessage({ type: 'TIMER_UPDATE', state }).catch(() => {});

    if (state.timeRemaining <= 0) {
      handleTimerComplete();
    }
  }, 1000);
}

async function handleTimerComplete() {
  if (timerInterval) clearInterval(timerInterval);

  const data = await getStorage(['timerState', 'dailyStats', 'streak']);
  let timerState = data.timerState || {};
  let stats = data.dailyStats || { sessions: 0, minutes: 0 };
  let streak = data.streak || 0;

  if (!timerState.isBreak) {
    stats.sessions++;
    stats.minutes += Math.floor(timerState.studyDuration / 60);
    streak++;
  }

  timerState.isRunning = false;
  timerState.isBreak = !timerState.isBreak;
  timerState.timeRemaining = timerState.isBreak ? 5*60 : timerState.studyDuration;

  await setStorage({ timerState, isStudying: false, dailyStats: stats, streak });

  chrome.runtime.sendMessage({ 
    type: 'TIMER_COMPLETE', 
    state: timerState,
    stats,
    streak 
  }).catch(() => {});
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_TIMER') {
    startBackgroundTimer();
  } 
  else if (message.type === 'PAUSE_TIMER') {
    console.log("⏸️ Timer Paused");
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  } 
  else if (message.type === 'RESET_TIMER') {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
});

chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
console.log('✅ YouTube Study Mode background ready');