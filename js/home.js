import { db, addDoc, getDocs, query, orderBy, collection, doc, deleteDoc, serverTimestamp, compressImageToBase64, isAdminLoggedIn } from './main.js';

// ==========================================
// GALLERY: UPLOAD & FETCH
// ==========================================
function initHome() {
    // Gallery upload button event (delegated)
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'submit-photo-btn') {
            handlePhotoUpload();
        }
    });
}

async function handlePhotoUpload() {
    const caption = document.getElementById('photo-caption').value;
    const photoFile = document.getElementById('gallery-upload').files[0];
    const statusText = document.getElementById('gallery-status');

    if (!photoFile || !caption) {
        alert("Please provide both a photo and a caption.");
        return;
    }

    try {
        statusText.style.display = 'block';
        const imageTextString = await compressImageToBase64(photoFile);

        statusText.textContent = "Saving to database...";

        await addDoc(collection(db, "gallery"), {
            caption: caption,
            imageUrl: imageTextString,
            timestamp: serverTimestamp()
        });

        alert("Photo added to Gallery successfully!");
        document.getElementById('photo-caption').value = '';
        document.getElementById('gallery-upload').value = '';
        statusText.style.display = 'none';

        loadGallery();
    } catch (error) {
        console.error("Error uploading photo:", error);
        alert(error.message || "Failed to upload photo.");
        statusText.style.display = 'none';
    }
}

async function loadGallery() {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    try {
        const q = query(collection(db, "gallery"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        container.innerHTML = "";

        if (querySnapshot.empty) {
            container.innerHTML = "<p>No photos in the gallery yet.</p>";
            return;
        }

        const isAdmin = isAdminLoggedIn();

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const displayStyle = isAdmin ? "block" : "none";

            const div = document.createElement('div');
            div.className = "gallery-item";

            const img = document.createElement('img');
            img.src = data.imageUrl;
            img.alt = data.caption || "Village photo";
            img.loading = "lazy";

            const captionP = document.createElement('p');
            captionP.textContent = data.caption || "";

            const delBtn = document.createElement('button');
            delBtn.className = "admin-only delete-btn submit-btn";
            delBtn.style.display = displayStyle;
            delBtn.style.width = "90%";
            delBtn.style.margin = "5px auto";
            delBtn.textContent = "Delete Photo";
            delBtn.addEventListener('click', () => deleteGalleryPhoto(id));

            div.appendChild(img);
            div.appendChild(captionP);
            div.appendChild(delBtn);
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading gallery:", error);
        container.innerHTML = "<p>Could not load gallery.</p>";
    }
}

async function deleteGalleryPhoto(id) {
    if (confirm("Are you sure you want to delete this photo from the gallery?")) {
        try {
            await deleteDoc(doc(db, "gallery", id));
            alert("Photo deleted successfully.");
            loadGallery();
        } catch (error) {
            console.error("Error deleting photo:", error);
            alert("Failed to delete photo.");
        }
    }
}

export { initHome, loadGallery };