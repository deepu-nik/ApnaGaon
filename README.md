# Digital Gram Panchayat Laxmipur Kaithwaliya

## Project Structure

```
gram-panchayat/
├── index.html              # Main shell with navigation & modal
├── css/
│   ├── main.css            # Shared styles (header, nav, forms, modal, footer)
│   ├── home.css            # Home section styles (gallery, emergency, info)
│   ├── notices.css         # Notices section styles
│   └── complaint.css       # Complaint section styles (cards, status tags)
├── js/
│   ├── main.js             # Firebase init, shared utilities, navigation, language, auth
│   ├── home.js             # Home section: gallery upload/fetch/delete
│   ├── notices.js          # Notices section: post/fetch notices
│   └── complaint.js        # Complaint section: submit/check status/admin view
├── pages/
│   ├── home.html           # Home section HTML template
│   ├── notices.html        # Notices section HTML template
│   └── complaint.html      # Complaint section HTML template
└── README.md
```

## How It Works

1. **index.html** loads the main shell with navigation and login modal
2. **main.js** dynamically loads HTML templates from `pages/` into section containers
3. Each section module (`home.js`, `notices.js`, `complaint.js`) handles its own functionality
4. **Shared utilities** (Firebase, image compression, XSS helper, auth state) are exported from `main.js`

## Admin Login
- Passcode: `pradhan123`
- Allows adding notices/photos and viewing/managing complaints

## Firebase Collections
- `gallery` - Village photos with captions
- `notices` - Village announcements
- `complaints` - Submitted complaints with status