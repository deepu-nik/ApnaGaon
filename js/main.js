import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBRZ6tOF6_aI96sfa_wqB4ok-nD52RQvo0",
    authDomain: "apnagaon-10271.firebaseapp.com",
    projectId: "apnagaon-10271",
    storageBucket: "apnagaon-10271.firebasestorage.app",
    messagingSenderId: "983900405039",
    appId: "1:983900405039:web:54b49ebf111eaf9edcf5da",
    measurementId: "G-RH0NMKKSNT"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// ==========================================
// EXPORTS for section modules
// ==========================================
export { db, app, analytics, serverTimestamp, collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc };

// ==========================================
// XSS-SAFE TEXT HELPER
// ==========================================
function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
export { escapeHTML };

// ==========================================
// UNIVERSAL IMAGE COMPRESSOR
// ==========================================
const compressImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        if (!file.type || !file.type.startsWith('image/')) {
            reject(new Error("Selected file is not an image."));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read the file."));
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.onerror = () => reject(new Error("Could not load the image."));
            img.src = event.target.result;
            img.onload = () => {
                if (!img.width || !img.height) {
                    reject(new Error("Image has no size."));
                    return;
                }
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const base64String = canvas.toDataURL('image/jpeg', 0.6);
                resolve(base64String);
            };
        };
    });
};
export { compressImageToBase64 };

// ==========================================
// NAVIGATION (Home / Notices / Complain)
// ==========================================
function showSection(sectionId, btn) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active-section'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active-section');
    if (btn) btn.classList.add('active');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showSection(btn.dataset.section, btn);
    });
});

window.addEventListener('load', () => {
    if (window.location.hash === "#complaint") {
        const btn = document.querySelector('.nav-btn[data-section="complaint"]');
        showSection('complaint', btn);
    }
});

// ==========================================
// LANGUAGE TOGGLE (English / Hindi)
// ==========================================
const langToggleBtn = document.getElementById('lang-toggle-btn');
const htmlRoot = document.getElementById('html-root');

function applyLanguage(lang) {
    document.querySelectorAll('[data-en]').forEach(el => {
        el.textContent = lang === 'hi' ? el.dataset.hi : el.dataset.en;
    });
    htmlRoot.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
    langToggleBtn.textContent = lang === 'hi' ? 'English' : 'हिंदी';
    localStorage.setItem('preferredLang', lang);
}

langToggleBtn.addEventListener('click', () => {
    const current = localStorage.getItem('preferredLang') || 'en';
    applyLanguage(current === 'hi' ? 'en' : 'hi');
});

// Apply saved language preference on load
applyLanguage(localStorage.getItem('preferredLang') || 'en');

// ==========================================
// SIMPLE MODAL & PASSCODE LOGIC
// ==========================================
const modal = document.getElementById('login-modal');
const topAuthBtn = document.getElementById('top-auth-btn');
const closeBtn = document.querySelector('.close-modal');

function isAdminLoggedIn() {
    return topAuthBtn.dataset.loggedIn === "true";
}
export { isAdminLoggedIn };

topAuthBtn.addEventListener('click', () => {
    if (isAdminLoggedIn()) {
        topAuthBtn.dataset.loggedIn = "false";
        topAuthBtn.dataset.en = "Admin Login";
        topAuthBtn.dataset.hi = "एडमिन लॉगिन";
        topAuthBtn.textContent = (localStorage.getItem('preferredLang') === 'hi') ? "एडमिन लॉगिन" : "Admin Login";
        document.querySelectorAll('.admin-only').forEach(panel => panel.style.display = 'none');
        // Reload all sections to update admin views
        import('./home.js').then(m => m.loadGallery());
        import('./complaint.js').then(m => m.loadComplaints());
        alert("Logged out successfully.");
    } else {
        modal.style.display = 'block';
    }
});

closeBtn.onclick = () => { modal.style.display = "none"; }
window.addEventListener('click', (event) => {
    if (event.target === modal) { modal.style.display = "none"; }
});

document.getElementById('modal-login-btn').addEventListener('click', () => {
    const password = document.getElementById('auth-password').value;

    if (password === "pradhan123") {
        modal.style.display = 'none';
        document.getElementById('auth-password').value = '';

        topAuthBtn.dataset.loggedIn = "true";
        topAuthBtn.dataset.en = "Logout";
        topAuthBtn.dataset.hi = "लॉगआउट";
        topAuthBtn.textContent = (localStorage.getItem('preferredLang') === 'hi') ? "लॉगआउट" : "Logout";
        document.querySelectorAll('.admin-only').forEach(panel => panel.style.display = 'block');

        // Load admin data for all sections
        import('./complaint.js').then(m => m.loadComplaints());
        import('./home.js').then(m => m.loadGallery());

        alert("Access Granted. You can now manage the portal.");
    } else {
        alert("Incorrect Passcode. Access Denied.");
    }
});

// ==========================================
// SECTION LOADER: Load HTML templates dynamically
// ==========================================
async function loadSectionContent(sectionId, htmlPath) {
    const container = document.getElementById(sectionId + '-content');
    try {
        const response = await fetch(htmlPath);
        const html = await response.text();
        container.innerHTML = html;
        // Re-apply language after loading content
        applyLanguage(localStorage.getItem('preferredLang') || 'en');
        return true;
    } catch (error) {
        console.error(`Error loading ${sectionId}:`, error);
        container.innerHTML = `<p>Error loading ${sectionId} content.</p>`;
        return false;
    }
}

// ==========================================
// INITIALIZE ALL SECTIONS
// ==========================================
async function init() {
    // Load all section templates
    await loadSectionContent('home', 'pages/home.html');
    await loadSectionContent('notices', 'pages/notices.html');
    await loadSectionContent('complaint', 'pages/complaint.html');

    // Initialize section modules
    const { initHome, loadGallery } = await import('./home.js');
    const { initNotices, loadNotices } = await import('./notices.js');
    const { initComplaint, loadComplaints } = await import('./complaint.js');

    initHome();
    initNotices();
    initComplaint();

    // Load initial data
    loadNotices();
    loadGallery();
}

// Start the app
init();