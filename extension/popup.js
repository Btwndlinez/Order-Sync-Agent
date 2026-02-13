// popup.js - Logic Hook (Vanilla JS Version for direct loading)
console.log("Antigravity Popup Active");

const statusEl = document.getElementById('status');
const listEl = document.getElementById('message-list');
const syncBtn = document.getElementById('btn-sync');

let currentMessages = [];

// 1. Ask storage for what the Ghost-Reader already found
chrome.storage.session.get(['lastMessages'], (result) => {
    if (result.lastMessages) {
        currentMessages = result.lastMessages;
        statusEl.innerText = `Last ${currentMessages.length} messages synced.`;

        // Update list
        listEl.innerHTML = '';
        currentMessages.forEach(msg => {
            const li = document.createElement('li');
            li.innerText = msg.substring(0, 50) + (msg.length > 50 ? '...' : '');
            listEl.appendChild(li);
        });
    } else {
        statusEl.innerText = "No messages found. Ensure Messenger is open.";
    }
});

syncBtn.addEventListener('click', async () => {
    // 2. Send the 'messages' array to your Supabase Edge Function here!
    console.log("Sending to Supabase:", currentMessages);

    if (currentMessages.length === 0) {
        alert("No messages to sync!");
        return;
    }

    statusEl.innerText = "Analyzing...";

    // Note: Replace with your actual Supabase Function URL
    // const response = await fetch('YOUR_SUPABASE_URL/functions/v1/analyze-conversation', { ... });

    setTimeout(() => {
        statusEl.innerText = "Analysis Complete (Simulation)";
        console.log("Mock analysis complete for:", currentMessages);
    }, 1000);
});
