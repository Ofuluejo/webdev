const input = document.getElementById('input-el')
const btn = document.getElementById('input-btn')
const lengthOutput = document.getElementById('length')
const volumeOutput = document.getElementById('volume')
const massOutput = document.getElementById('mass')
const summaryLength = document.getElementById('summary-length')
const summaryVolume = document.getElementById('summary-volume')
const summaryMass = document.getElementById('summary-mass')
const historyLine = document.getElementById('history-line')
const historyList = document.getElementById('history-list')
const clearHistoryBtn = document.getElementById('clear-history')
const darkToggle = document.getElementById('dark-toggle')
const darkIcon = document.getElementById('dark-icon')
const helpBtn = document.getElementById('help-btn')
const helpTooltip = document.getElementById('help-tooltip')

const HISTORY_KEY = 'unitConverterHistory'
const THEME_KEY = 'unitConverterTheme'
const MAX_HISTORY_ITEMS = 8
let history = []

btn.addEventListener('click', handleConvert)
input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleConvert()
    }
})

clearHistoryBtn?.addEventListener('click', handleClearHistory)
darkToggle?.addEventListener('click', toggleTheme)
helpBtn?.addEventListener('click', (event) => {
    helpTooltip.classList.toggle('hidden')
    event.stopPropagation()
})
document.addEventListener('click', (event) => {
    if (helpTooltip && !helpTooltip.classList.contains('hidden') && !helpBtn.contains(event.target)) {
        helpTooltip.classList.add('hidden')
    }
})
document.getElementById('input-btn').addEventListener('click', function (e) {
    const btn = e.currentTarget
    const circle = document.createElement('span')
    circle.className = 'ripple'
    const rect = btn.getBoundingClientRect()
    circle.style.left = `${e.clientX - rect.left}px`
    circle.style.top = `${e.clientY - rect.top}px`
    btn.appendChild(circle)
    setTimeout(() => circle.remove(), 600)
})

function handleConvert(saveHistory = true) {
    const inputValue = parseFloat(input.value)
    if (Number.isNaN(inputValue) || input.value.trim() === '') {
        const message = 'Please enter a valid number.'
        lengthOutput.textContent = message
        volumeOutput.textContent = message
        massOutput.textContent = message
        return
    }

    convert(inputValue)
    if (saveHistory) {
        addHistoryEntry(inputValue)
    }
}

function formatNumber(value) {
    return Number(value).toLocaleString(undefined, {maximumFractionDigits: 3})
}

function formatTimestamp(isoString) {
    return new Date(isoString).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
}

function animateNumber(element, start, end, duration = 600) {
    const range = end - start
    const startTime = performance.now()

    function step(currentTime) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const value = start + range * easeOutCubic(progress)
        element.textContent = formatNumber(value)
        if (progress < 1) {
            requestAnimationFrame(step)
        }
    }

    requestAnimationFrame(step)
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
}

function updateSummary(feet, gallons, pounds) {
    animateNumber(summaryLength, parseFloat(summaryLength.textContent.replace(/,/g, '')) || 0, feet)
    animateNumber(summaryVolume, parseFloat(summaryVolume.textContent.replace(/,/g, '')) || 0, gallons)
    animateNumber(summaryMass, parseFloat(summaryMass.textContent.replace(/,/g, '')) || 0, pounds)
}

function loadHistory() {
    try {
        const stored = localStorage.getItem(HISTORY_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.warn('Could not parse history from localStorage', error)
        return []
    }
}

function saveHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

function renderHistory(items) {
    if (!historyList) return

    historyList.innerHTML = ''
    if (!items.length) {
        historyList.innerHTML = '<li class="history-item">No history yet.</li>'
        clearHistoryBtn?.setAttribute('disabled', 'true')
        return
    }

    clearHistoryBtn?.removeAttribute('disabled')
    items.forEach((entry) => {
        const listItem = document.createElement('li')
        listItem.className = 'history-item'
        listItem.innerHTML = `
            <strong>${formatNumber(entry.input)}</strong> → ${formatNumber(entry.feet)} ft, ${formatNumber(entry.gallons)} gal, ${formatNumber(entry.pounds)} lb
            <span class="history-timestamp">${formatTimestamp(entry.timestamp)}</span>
        `
        historyList.appendChild(listItem)
    })
}

function updateHistoryLine(entry) {
    if (!historyLine) return
    historyLine.textContent = `Latest conversion: ${formatNumber(entry.input)} → ${formatNumber(entry.feet)} ft, ${formatNumber(entry.gallons)} gal, ${formatNumber(entry.pounds)} lb`
}

function addHistoryEntry(inputValue) {
    const feet = inputValue * 3.28084
    const gallons = inputValue * 0.264172
    const pounds = inputValue * 2.20462
    const entry = {
        id: Date.now(),
        input: inputValue,
        feet,
        gallons,
        pounds,
        timestamp: new Date().toISOString(),
    }

    history = [entry, ...history].slice(0, MAX_HISTORY_ITEMS)
    saveHistory(history)
    renderHistory(history)
    updateHistoryLine(entry)
}

function clearHistory() {
    history = []
    saveHistory(history)
    renderHistory(history)
    if (historyLine) {
        historyLine.textContent = 'No saved conversions yet. Add one and it will appear here.'
    }
}

function handleClearHistory() {
    if (!confirm('Clear saved history?')) return
    clearHistory()
}

function setTheme(isDark) {
    document.body.classList.toggle('dark', isDark)
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
    if (!darkIcon) return
    darkIcon.innerHTML = isDark
        ? '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>'
        : '<circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.34 6.34l-1.41-1.41m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41"/>'
}

function toggleTheme() {
    setTheme(!document.body.classList.contains('dark'))
}

function initializeTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(storedTheme ? storedTheme === 'dark' : prefersDark)
}

function convert(value) {
    const feet = value * 3.28084
    const meters = value * 0.3048
    const gallons = value * 0.264172
    const liters = value * 3.78541
    const pounds = value * 2.20462
    const kilograms = value * 0.453592

    lengthOutput.innerHTML = `
        <div class="unit-result-line"><strong>${formatNumber(value)}</strong> meter(s) = <strong>${formatNumber(feet)}</strong> foot/feet</div>
        <div class="unit-result-line"><strong>${formatNumber(value)}</strong> foot/feet = <strong>${formatNumber(meters)}</strong> meter(s)</div>
    `
    volumeOutput.innerHTML = `
        <div class="unit-result-line"><strong>${formatNumber(value)}</strong> liter(s) = <strong>${formatNumber(gallons)}</strong> gallon(s)</div>
        <div class="unit-result-line"><strong>${formatNumber(value)}</strong> gallon(s) = <strong>${formatNumber(liters)}</strong> liter(s)</div>
    `
    massOutput.innerHTML = `
        <div class="unit-result-line"><strong>${formatNumber(value)}</strong> kilogram(s) = <strong>${formatNumber(pounds)}</strong> pound(s)</div>
        <div class="unit-result-line"><strong>${formatNumber(value)}</strong> pound(s) = <strong>${formatNumber(kilograms)}</strong> kilogram(s)</div>
    `

    updateSummary(feet, gallons, pounds)
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme()
    history = loadHistory()
    renderHistory(history)

    if (history.length) {
        updateSummary(history[0].feet, history[0].gallons, history[0].pounds)
        updateHistoryLine(history[0])
    }

    handleConvert(false)
})
