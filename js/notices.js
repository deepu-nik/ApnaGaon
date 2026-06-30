import { db, addDoc, getDocs, query, orderBy, collection, serverTimestamp } from './main.js';

// ==========================================
// NOTICE FETCH AND UPLOAD
// ==========================================
function initNotices() {
    // Notice submit button event (delegated)
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'submit-notice-btn') {
            handleNoticeSubmit();
        }
    });
}

async function handleNoticeSubmit() {
    const title = document.getElementById('new-notice-title').value;
    const desc = document.getElementById('new-notice-desc').value;

    if (!title || !desc) {
        alert("Please fill in both the title and description.");
        return;
    }

    try {
        await addDoc(collection(db, "notices"), { 
            title: title, 
            description: desc, 
            timestamp: serverTimestamp() 
        });
        alert("Notice published successfully!");
        document.getElementById('new-notice-title').value = '';
        document.getElementById('new-notice-desc').value = '';
        loadNotices();
    } catch (error) {
        alert("Failed to post notice.");
    }
}

function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadNotices() {
    const container = document.getElementById('notice-container');
    if (!container) return;

    try {
        const q = query(collection(db, "notices"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        container.innerHTML = "";
        if (querySnapshot.empty) {
            container.innerHTML = "<p>No notices at the moment.</p>";
            return;
        }
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : "Just now";
            const card = document.createElement('div');
            card.className = "notice-card";
            card.innerHTML = `<h4>${escapeHTML(data.title)}</h4><small>Date: ${dateStr}</small><p>${escapeHTML(data.description)}</p>`;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = "<p>Could not load notices.</p>";
    }
}

export { initNotices, loadNotices };