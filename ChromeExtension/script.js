let myLeads = []
const inputEl = document.getElementById("input-el")
const inputBtn = document.getElementById("input-btn")
const deleteBtn = document.getElementById("delete-btn")
const ulEl = document.getElementById("ul-el")
const tabBtn = document.getElementById("tab-btn")
const countEl = document.getElementById("count")
const searchToggle = document.getElementById("search-toggle")
const searchBar = document.getElementById("search-bar")
const searchInput = document.getElementById("search-input")
const searchClose = document.getElementById("search-close")
const emptyState = document.getElementById("empty-state")

// Load from localStorage
let leadsFromLocalStorage = JSON.parse(localStorage.getItem("myLeads"))

if (leadsFromLocalStorage) {
    myLeads = leadsFromLocalStorage
    render(myLeads)
}

// Save Input
inputBtn.addEventListener("click", function() {
    if (inputEl.value.trim() === "") return
    
    myLeads.push(inputEl.value.trim())
    inputEl.value = ""
    saveAndRender()
    showToast("Lead saved successfully!")
})

// Enter key support
inputEl.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        inputBtn.click()
    }
})

// Save Current Tab
tabBtn.addEventListener("click", function(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        if (tabs && tabs[0]) {
            myLeads.push(tabs[0].url)
            saveAndRender()
            
            // Visual feedback
            const originalHTML = tabBtn.innerHTML
            tabBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Tab Saved!
            `
            tabBtn.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3))"
            tabBtn.style.borderColor = "rgba(16, 185, 129, 0.5)"
            
            setTimeout(() => {
                tabBtn.innerHTML = originalHTML
                tabBtn.style.background = ""
                tabBtn.style.borderColor = ""
            }, 2000)
            
            showToast("Current tab saved!")
        }
    })
})

// Delete All (double click)
deleteBtn.addEventListener("dblclick", function(){
    if (confirm("⚠️ Delete all leads permanently?\n\nThis action cannot be undone.")) {
        localStorage.clear()
        myLeads = []
        render(myLeads)
        showToast("All leads deleted", "danger")
    }
})

// Search toggle
searchToggle.addEventListener("click", function(){
    const isHidden = searchBar.style.display === "none"
    searchBar.style.display = isHidden ? "flex" : "none"
    
    if (isHidden) {
        searchInput.focus()
    } else {
        searchInput.value = ""
        render(myLeads)
    }
})

// Search close
searchClose.addEventListener("click", function(){
    searchBar.style.display = "none"
    searchInput.value = ""
    render(myLeads)
})

// Search functionality
searchInput.addEventListener("input", function(){
    const query = searchInput.value.toLowerCase()
    
    if (query === "") {
        render(myLeads)
    } else {
        const filtered = myLeads.filter(lead => lead.toLowerCase().includes(query))
        render(filtered)
    }
})

function saveAndRender() {
    localStorage.setItem("myLeads", JSON.stringify(myLeads))
    render(myLeads)
}

function render(leads) {
    // Update count
    countEl.textContent = myLeads.length
    
    // Show/hide empty state
    if (leads.length === 0) {
        ulEl.innerHTML = ""
        emptyState.style.display = "flex"
        return
    } else {
        emptyState.style.display = "none"
    }
    
    let listItems = ""
    
    for (let i = 0; i < myLeads.length; i++) {
        // Only show if in current filtered view
        if (!leads.includes(myLeads[i])) continue
        
        listItems += `
            <li data-index="${i}">
                <div class="lead-content">
                    <a href='${myLeads[i]}' target='_blank' class="lead-link">
                        ${myLeads[i]}
                    </a>
                    <div class="lead-actions">
                        <button class="lead-action-btn copy" title="Copy to clipboard">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                        <button class="lead-action-btn delete" title="Delete this lead">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </li>
        `
    }

    ulEl.innerHTML = listItems
}

// Event Delegation - Much more reliable
ulEl.addEventListener('click', function(e) {
    const li = e.target.closest('li')
    if (!li) return
    
    const index = parseInt(li.dataset.index)
    
    // Copy button
    if (e.target.closest('.copy')) {
        copyLead(index)
    }
    
    // Delete button
    if (e.target.closest('.delete')) {
        deleteLead(index)
    }
})

function deleteLead(index) {
    if (confirm("Delete this lead?")) {
        myLeads.splice(index, 1)
        saveAndRender()
        showToast("Lead deleted", "danger")
    }
}

function copyLead(index) {
    const lead = myLeads[index]
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lead).then(() => {
            showToast("Copied to clipboard!")
        }).catch(() => {
            fallbackCopy(lead)
        })
    } else {
        fallbackCopy(lead)
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    document.body.appendChild(textArea)
    textArea.select()
    
    try {
        document.execCommand('copy')
        showToast("Copied to clipboard!")
    } catch (err) {
        showToast("Failed to copy", "danger")
    }
    
    document.body.removeChild(textArea)
}