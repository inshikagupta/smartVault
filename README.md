# SmartVault

SmartVault is a **Google Drive–style file storage app** built on the MERN stack. Users can register/login, upload files to the cloud, organize and search them, share them (privately or via public expiring links), and get automatic AI tags on uploaded images.

---

## ✨ Features

- 🔐 **Authentication** — register/login/logout with JWT stored in an `httpOnly` cookie, plus forgot/reset password via email
- ☁️ **Cloud file storage** — uploads go straight to Cloudinary (images, videos, PDFs, docs, zips, etc.), up to 100MB per file
- 🏷️ **AI image tagging** — automatic tag generation on uploaded images via Cloudinary's AI add-on
- ⭐ **Star / 🗑️ Trash / ♻️ Restore** — soft-delete workflow, nothing is lost until permanently deleted
- ✏️ **Rename** files
- 🔍 **Search** across filename, tags, and file type
- 🔗 **Sharing** — share a file with another registered user by email, or generate a public, expiring share link
- 📊 **Storage usage stats** — see how much of your quota you've used
- 📥 **Download tracking** — tracks download count and last-accessed time

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Axios

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) + bcrypt for auth
- Multer for file upload handling
- Cloudinary for cloud storage + AI tagging
- Nodemailer for transactional emails
- Helmet, CORS, Morgan, cookie-parser

---

## 📁 Project Structure

```
smartVault MERN project/
├── backend/
│   ├── server.js               # entry point
│   ├── src/
│   │   ├── app.js              # Express app + middleware
│   │   ├── config/              # DB + Cloudinary config
│   │   ├── controllers/         # route handlers
│   │   ├── middleware/          # auth + upload middleware
│   │   ├── models/               # Mongoose schemas
│   │   ├── routes/               # API routes
│   │   ├── services/             # storage + AI tagging logic
│   │   └── utils/                # email helper
│   └── uploads/                 # temp storage before Cloudinary upload
│
└── frontend/
    └── src/
        ├── components/           # FileCard, etc.
        ├── pages/                 # Login, Register, Dashboard, Password reset
        ├── services/              # axios API wrappers
        ├── App.jsx
        └── main.jsx
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- A MongoDB database (local or Atlas)
- A Cloudinary account (free tier works)
- A Gmail account with an **App Password** (for sending reset emails)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd "smartVault MERN project"

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

Create a `.env` file inside `backend/`:

```env
PORT=3000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FRONTEND_URL=http://localhost:5173

EMAIL=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password
```

> ⚠️ Never commit your `.env` file. Add it to `.gitignore`.

### 3. Run the app

```bash
# Terminal 1 — backend (http://localhost:3000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## 🔌 API Overview

**Auth** — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a new account |
| POST | `/login` | Log in |
| POST | `/logout` | Log out |
| GET | `/me` | Get current logged-in user |
| POST | `/forgot-password` | Request a password reset email |
| POST | `/reset-password/:token` | Reset password with token |

**Files** — `/api/files` (all routes below require auth, except `/public/:token`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload a file |
| GET | `/` | Get all files |
| GET | `/starred` | Get starred files |
| GET | `/trash` | Get trashed files |
| GET | `/shared` | Get files shared with you |
| GET | `/search?query=` | Search files |
| GET | `/storage-stats` | Get storage usage |
| GET | `/download/:id` | Download a file |
| PUT | `/trash/:id` | Move file to trash |
| PUT | `/restore/:id` | Restore from trash |
| PUT | `/rename/:id` | Rename a file |
| PUT | `/star/:id` | Star / unstar a file |
| DELETE | `/delete/:id` | Permanently delete a file |
| POST | `/share/:id` | Share with a user by email |
| POST | `/share-link/:id` | Generate a public share link |
| GET | `/public/:token` | Access a file via public share link (no auth) |

---

## 🚧 Known Limitations / Roadmap

- **Folders** — the frontend already has a `folder.service.js` calling `/api/folders`, but the backend `Folder` model and routes aren't implemented yet
- **PDF/DOCX text extraction** — `pdf-parse` and `mammoth` are referenced in the AI service for extracting searchable text but aren't yet installed as dependencies
- **Full-text search** — a MongoDB text index exists on the `File` model but search currently uses regex matching instead
- File versioning schema exists (`versions[]`) but isn't populated yet — re-uploading a file with the same name currently overwrites the previous version instead of keeping history

---

## 📄 License

This project is for personal/educational use.
