import { db, addDoc, getDocs, query, orderBy, collection, doc, deleteDoc, updateDoc, serverTimestamp, compressImageToBase64, isAdminLoggedIn } from './main.js';

// ==========================================
// COMPLAINT SUBMISSION
// ==========================================
function initComplaint() {
    // Form submission (delegated)
    document.addEventListener('submit', (e) => {
        if (e.target && e.target.id === 'complaint-form') {
            e.preventDefault();
            handleComplaintSubmit();
        }
    });

    // Check status button (delegated)
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'check-status-btn') {
            handleCheckStatus();
        }
    });
}

async function handleComplaintSubmit() {
    const submitBtn = document.getElementById('submit-complaint-btn');
    const statusText = document.getElementById('upload-status');
    submitBtn.disabled = true;

    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const photoFile = document.getElementById('photo').files[0];

    let imageTextString = "";

    try {
        if (photoFile) {
            statusText.style.display = 'block';
            imageTextString = await compressImageToBase64(photoFile);
        }

        statusText.textContent = "Saving complaint...";

        await addDoc(collection(db, "complaints"), {
            name: name,
            category: category,
            description: description,
            imageUrl: imageTextString,
            status: "pending",
            timestamp: serverTimestamp()
        });

        statusText.style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        document.getElementById('complaint-form').reset();

        setTimeout(() => {
            document.getElementById('success-message').style.display = 'none';
            submitBtn.disabled = false;
        }, 4000);

    } catch (error) {
        if (error.message && error.message.includes("exceeds the maximum")) {
            alert("The selected image is too large. Please try a different photo.");
        } else {
            alert(error.message || "Something went wrong. Please check your internet connection.");
        }
        submitBtn.disabled = false;
        statusText.style.display = 'none';
    }
}

// ==========================================
// VILLAGER: CHECK OWN COMPLAINT STATUS
// ==========================================
async function handleCheckStatus() {
    const nameInput = document.getElementById('check-name').value.trim();
    const resultsDiv = document.getElementById('status-results');

    if (!nameInput) {
        alert("Please enter the name you used when submitting your complaint.");
        return;
    }

    resultsDiv.innerHTML = "<p>Searching...</p>";

    try {
        const q = query(collection(db, "complaints"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        const matches = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.name && data.name.trim().toLowerCase() === nameInput.toLowerCase()) {
                matches.push(data);
            }
        });

        if (matches.length === 0) {
            resultsDiv.innerHTML = "<p>No complaints found under that name.</p>";
            return;
        }

        resultsDiv.innerHTML = "";
        matches.forEach((data) => {
            const status = data.status || "pending";
            const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : "Just now";

            const div = document.createElement('div');
            div.className = `complaint-card ${status === 'resolved' ? 'resolved' : ''}`;
            div.innerHTML = `
                <h4>${escapeHTML(data.category)} <span class="status-tag ${status}">${status}</span></h4>
                <div class="complaint-meta">Date: ${dateStr}</div>
                <p>${escapeHTML(data.description)}</p>
            `;
            resultsDiv.appendChild(div);
        });
    } catch (error) {
        console.error("Error checking status:", error);
        resultsDiv.innerHTML = "<p>Could not check status. Please check your connection.</p>";
    }
}

// ==========================================
// ADMIN: FETCH AND DISPLAY COMPLAINTS
// ==========================================
function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadComplaints() {
    const container = document.getElementById('complaints-list');
    if (!container) return;

    try {
        const q = query(collection(db, "complaints"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        container.innerHTML = "";

        if (querySnapshot.empty) {
            container.innerHTML = "<p>No complaints received yet.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleString() : "Just now";
            const status = data.status || "pending";

            let imgTag = "";
            if (data.imageUrl && data.imageUrl.length > 10) {
                imgTag = `<img src="${data.imageUrl}" alt="Complaint Evidence">`;
            }

            const div = document.createElement('div');
            div.className = `complaint-card ${status === 'resolved' ? 'resolved' : ''}`;
            div.innerHTML = `
                <h4>From: ${escapeHTML(data.name)} <span class="status-tag ${status}">${status}</span></h4>
                <div class="complaint-meta">
                    <span class="complaint-category">${escapeHTML(data.category)}</span> | Date: ${dateStr}
                </div>
                <p><b>Description:</b> ${escapeHTML(data.description)}</p>
                ${imgTag}
            `;

            const actionsDiv = document.createElement('div');

            if (status !== 'resolved') {
                const resolveBtn = document.createElement('button');
                resolveBtn.className = "submit-btn resolve-btn";
                resolveBtn.textContent = "✅ Mark as Resolved";
                resolveBtn.addEventListener('click', () => markComplaintResolved(id));
                actionsDiv.appendChild(resolveBtn);
            }

            const delBtn = document.createElement('button');
            delBtn.className = "submit-btn delete-btn";
            delBtn.textContent = "🗑️ Delete";
            delBtn.addEventListener('click', () => deleteComplaint(id));
            actionsDiv.appendChild(delBtn);

            div.appendChild(actionsDiv);
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading complaints:", error);
        container.innerHTML = "<p>Error loading complaints. Please check your connection.</p>";
    }
}

// ==========================================
// ADMIN: RESOLVE & DELETE FUNCTIONS
// ==========================================
async function markComplaintResolved(id) {
    try {
        await updateDoc(doc(db, "complaints", id), { status: "resolved" });
        loadComplaints();
    } catch (error) {
        console.error("Error updating complaint:", error);
        alert("Failed to update. Please check your connection.");
    }
}

async function deleteComplaint(id) {
    if (confirm("Are you sure you want to permanently delete this complaint? This cannot be undone.")) {
        try {
            await deleteDoc(doc(db, "complaints", id));
            alert("Complaint deleted successfully.");
            loadComplaints();
        } catch (error) {
            console.error("Error deleting complaint:", error);
            alert("Failed to delete. Please check your connection.");
        }
    }
}

export { initComplaint, loadComplaints };