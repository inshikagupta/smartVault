import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth.service";
import FileCard from "../components/FileCard";

import {
    getAllFiles, getStarredFiles, getTrashFiles, getSharedFiles,
    uploadFile, moveToTrash, deleteFilePermanently, restoreFile,
    toggleStar, renameFile, shareFile, getStorageStats, searchFiles,
    downloadFile, generateShareLink
    } from "../services/file.service";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function formatSize(bytes) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getFileIcon(type) {
    if (!type) return { icon: "📄", color: "#5f6368" };
    if (type.startsWith("image/")) return { icon: "🖼️", color: "#34a853", bg: "#e6f4ea" };
    if (type.startsWith("video/")) return { icon: "🎬", color: "#ea4335", bg: "#fce8e6" };
    if (type.startsWith("audio/")) return { icon: "🎵", color: "#9334e6", bg: "#f3e8fd" };
    if (type === "application/pdf") return { icon: "📕", color: "#ea4335", bg: "#fce8e6" };
    if (type.includes("word") || type.includes("document")) return { icon: "📘", color: "#1a73e8", bg: "#e8f0fe" };
    if (type.includes("excel") || type.includes("spreadsheet")) return { icon: "📗", color: "#34a853", bg: "#e6f4ea" };
    if (type.includes("powerpoint") || type.includes("presentation")) return { icon: "📙", color: "#fa7b17", bg: "#fce8d0" };
    if (type.includes("zip") || type.includes("rar")) return { icon: "🗜️", color: "#fbbc04", bg: "#fef7e0" };
    if (type.includes("json") || type.includes("javascript") || type.includes("text")) return { icon: "📝", color: "#5f6368", bg: "#f1f3f4" };
    return { icon: "📄", color: "#5f6368", bg: "#f1f3f4" };
}

function Avatar({ name, size = 32 }) {
    const colors = ["#1a73e8", "#34a853", "#ea4335", "#9334e6", "#fa7b17"];
    const idx = name ? name.charCodeAt(0) % colors.length : 0;
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: colors[idx], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 600, flexShrink: 0, fontFamily: "'Google Sans', sans-serif" }}>
            {name ? name[0].toUpperCase() : "?"}
        </div>
    );
}

// StorageBar removed — storage UI not used in this build

// ──────────────────────────────────────────────────────────────────────────────
// Modal Component
// ──────────────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 480 }) {
    if (!open) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={onClose}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width, maxWidth: "calc(100vw - 32px)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,.2)" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: "#202124" }}>{title}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#5f6368", padding: 4 }}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const bg = type === "error" ? "#ea4335" : type === "warning" ? "#fbbc04" : "#34a853";
    return (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: bg, color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 10000, boxShadow: "0 4px 12px rgba(0,0,0,.2)", maxWidth: "90vw", textAlign: "center" }}>
            {message}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Context Menu
// ──────────────────────────────────────────────────────────────────────────────
function ContextMenu({ x, y, items, onClose }) {
    useEffect(() => {
        const handler = () => onClose();
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, [onClose]);

    return (
        <div style={{ position: "fixed", top: y, left: x, background: "#fff", borderRadius: 8, boxShadow: "0 2px 20px rgba(0,0,0,.2)", zIndex: 9998, minWidth: 180, padding: "4px 0", border: "1px solid #e0e0e0" }} onClick={e => e.stopPropagation()}>
            {items.map((item, i) =>
                item === "divider" ? <div key={i} style={{ height: 1, background: "#e0e0e0", margin: "4px 0" }} /> :
                <div key={i} onClick={() => { item.onClick(); onClose(); }} style={{ padding: "10px 20px", fontSize: 14, color: item.danger ? "#ea4335" : "#202124", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "'Google Sans', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span>{item.icon}</span>{item.label}
                </div>
            )}
        </div>
    );
}


// ──────────────────────────────────────────────────────────────────────────────
// File Row (List View)
// ──────────────────────────────────────────────────────────────────────────────
function FileRow({ file, onContextMenu, onStar, onClick, selected }) {
    const { icon } = getFileIcon(file.fileType);
    return (
        <div
            className="dashboard-file-row"
            onClick={() => onClick(file)}
            onContextMenu={e => { e.preventDefault(); onContextMenu(e, file); }}
            style={{ background: selected ? "#e8f0fe" : "#fff", borderRadius: 8, cursor: "pointer", border: selected ? "1px solid #1a73e8" : "1px solid transparent", marginBottom: 2 }}
            onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#f8f9fa"; }}
            onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "#fff"; }}>
            <span style={{ fontSize: 20, textAlign: "center" }}>{icon}</span>
            <div style={{ fontSize: 14, color: "#202124", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>{formatDate(file.createdAt)}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>{formatSize(file.size)}</div>
            <div style={{ fontSize: 12, color: "#80868b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileType?.split("/")[1] || "file"}</div>
            <button onClick={e => { e.stopPropagation(); onStar(file._id); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: file.isStarred ? 1 : 0.3, color: "#fbbc04" }}>★</button>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Upload Progress Bar
// ──────────────────────────────────────────────────────────────────────────────
function UploadProgress({ uploads }) {
    if (!uploads.length) return null;
    return (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,.2)", padding: "16px 20px", minWidth: 280, zIndex: 9990 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Uploading {uploads.length} file{uploads.length > 1 ? "s" : ""}</div>
            {uploads.map(u => (
                <div key={u.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5f6368", marginBottom: 4 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{u.name}</span>
                        <span>{u.progress}%</span>
                    </div>
                    <div style={{ height: 3, background: "#e0e0e0", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${u.progress}%`, background: "#1a73e8", borderRadius: 2, transition: "width .2s" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem("user"));

    const setUser = (data) => {
        if (data) {
            localStorage.setItem("user", JSON.stringify(data));
        } else {
            localStorage.removeItem("user");
        }
    };
    const navigate = useNavigate();
    const fileInputRef = useRef();

    // View state
    const [view, setView] = useState("my-drive"); // my-drive | starred | trash | shared
    const [viewMode, setViewMode] = useState("grid"); // grid | list

    // Data
    const [files, setFiles] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // UI state
    const [selectedFile, setSelectedFile] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [toast, setToast] = useState(null);
    const [uploads, setUploads] = useState([]);

    // Modals
    const [renameModal, setRenameModal] = useState(null);
    const [shareModal, setShareModal] = useState(null);
    const [shareLinkModal, setShareLinkModal] = useState(null);
    const [previewModal, setPreviewModal] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [shareEmail, setShareEmail] = useState("");
    const [sharePermission, setSharePermission] = useState("view");
    const [dragOver, setDragOver] = useState(false);

    const showToast = (message, type = "success") => setToast({ message, type });

    // ── Fetch data ─────────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (view === "my-drive") {
                const fData = await getAllFiles();
                setFiles(fData.files || []);
            } else if (view === "starred") {
                const data = await getStarredFiles();
                setFiles(data.files || []);
            } else if (view === "trash") {
                const data = await getTrashFiles();
                setFiles(data.files || []);
            } else if (view === "shared") {
                const data = await getSharedFiles();
                setFiles(data.files || []);
            }
        } catch (e) {
            const msg = e.response?.data?.message || "Failed to load files";
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [view]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        getStorageStats().then(d => setStats(d)).catch(() => {});
    }, [files]);

    // ── Search ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!searchQuery) { fetchData(); return; }
        const t = setTimeout(async () => {
            try {
                const data = await searchFiles(searchQuery);
                setFiles(data.files || []);
            } catch (e) {}
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // ── Upload ─────────────────────────────────────────────────────────────────
    const handleFileUpload = async (fileList) => {
        const files = Array.from(fileList);
        for (const file of files) {
            const uploadId = file.name + Date.now();
            setUploads(u => [...u, { name: file.name, progress: 0, id: uploadId }]);
            const formData = new FormData();
            formData.append("file", file);
            try {
                await uploadFile(formData, (pct) => {
                    setUploads(u => u.map(x => x.id === uploadId ? { ...x, progress: pct } : x));
                });
                setUploads(u => u.filter(x => x.id !== uploadId));
                showToast(`"${file.name}" uploaded successfully`);
                fetchData();
            } catch (e) {
                setUploads(u => u.filter(x => x.id !== uploadId));
                showToast(`Failed to upload "${file.name}"`, "error");
            }
        }
    };

    // ── Drag & Drop ────────────────────────────────────────────────────────────
    const handleDrop = e => {
        e.preventDefault();
        setDragOver(false);
        handleFileUpload(e.dataTransfer.files);
    };

    // ── Actions ────────────────────────────────────────────────────────────────
    const handleStar = async (id) => {
        try {
            await toggleStar(id);
            setFiles(f => f.map(x => x._id === id ? { ...x, isStarred: !x.isStarred } : x));
        } catch (e) { showToast("Failed", "error"); }
    };

    const handleDelete = async (file) => {
        if (!confirm(`Move "${file.fileName}" to trash?`)) return;
        try {
            await moveToTrash(file._id);
            setFiles(f => f.filter(x => x._id !== file._id));
            showToast(`"${file.fileName}" moved to trash`);
        } catch (e) { showToast("Failed to delete", "error"); }
    };

    const handlePermanentDelete = async (file) => {
        if (!confirm(`Permanently delete "${file.fileName}"? This cannot be undone.`)) return;
        try {
            await deleteFilePermanently(file._id);
            setFiles(f => f.filter(x => x._id !== file._id));
            showToast(`"${file.fileName}" permanently deleted`);
        } catch (e) { showToast("Failed", "error"); }
    };

    const handleRestore = async (file) => {
        try {
            await restoreFile(file._id);
            setFiles(f => f.filter(x => x._id !== file._id));
            showToast(`"${file.fileName}" restored`);
        } catch (e) { showToast("Failed", "error"); }
    };

    const handleRename = async () => {
        if (!renameValue.trim()) return;
        try {
            await renameFile(renameModal._id, renameValue.trim());
            setFiles(f => f.map(x => x._id === renameModal._id ? { ...x, fileName: renameValue.trim() } : x));
            setRenameModal(null);
            showToast("File renamed");
        } catch (e) { showToast("Failed to rename", "error"); }
    };

    const handleShare = async () => {
        if (!shareEmail.trim()) return;
        try {
            await shareFile(shareModal._id, shareEmail, sharePermission);
            setShareModal(null);
            setShareEmail("");
            showToast(`File shared with ${shareEmail}`);
        } catch (e) { showToast(e.response?.data?.message || "Failed to share", "error"); }
    };

    const handleShareLink = async (file) => {
        try {
            const data = await generateShareLink(file._id, 48);
            setShareLinkModal(data);
        } catch (e) { showToast("Failed to generate link", "error"); }
    };

    const handleDownload = async (file) => {
        try {
            const data = await downloadFile(file._id);
            window.open(data.fileUrl, "_blank");
        } catch (e) { showToast("Failed to download", "error"); }
    };



    // ── Context Menu Items ─────────────────────────────────────────────────────
    const getFileContextItems = (file) => {
        if (view === "trash") return [
            { icon: "↩️", label: "Restore", onClick: () => handleRestore(file) },
            { icon: "🗑️", label: "Delete permanently", onClick: () => handlePermanentDelete(file), danger: true }
        ];
        return [
            { icon: "👁️", label: "Preview", onClick: () => setPreviewModal(file) },
            { icon: "⬇️", label: "Download", onClick: () => handleDownload(file) },
            "divider",
            { icon: "✏️", label: "Rename", onClick: () => { setRenameModal(file); setRenameValue(file.fileName); } },
            { icon: file.isStarred ? "☆" : "★", label: file.isStarred ? "Remove star" : "Add to starred", onClick: () => handleStar(file._id) },
            "divider",
            { icon: "🔗", label: "Get link", onClick: () => handleShareLink(file) },
            { icon: "👥", label: "Share with people", onClick: () => setShareModal(file) },
            "divider",
            { icon: "🗑️", label: "Move to trash", onClick: () => handleDelete(file), danger: true }
        ];
    };

    const handleLogout = async () => {
        await logoutUser();
        setUser(null);
        navigate("/");
    };

    const sidebarItems = [
        { id: "my-drive", icon: "🏠", label: "My Drive" },
        { id: "shared", icon: "👥", label: "Shared with me" },
        { id: "starred", icon: "⭐", label: "Starred" },
        { id: "trash", icon: "🗑️", label: "Trash" },
    ];

    const viewTitle = { "my-drive": "My Drive", starred: "Starred", trash: "Trash", shared: "Shared with me" };

    return (
        <div className="dashboard-root" style={{ display: "flex", height: "100vh", background: "#f8f9fa", fontFamily: "'Google Sans', Roboto, sans-serif" }}
            onDragOver={e => { e.preventDefault(); if (view === "my-drive") setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}>

            {/* Drag overlay */}
            {dragOver && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(26,115,232,.1)", border: "3px dashed #1a73e8", zIndex: 9997, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: "32px 48px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.2)" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📤</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a73e8" }}>Drop files to upload</div>
                    </div>
                </div>
            )}

            {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
            <div className="dashboard-sidebar" style={{ background: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                {/* Logo */}
                <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="36" height="36" viewBox="0 0 48 48">
                        <path fill="#4285F4" d="M6 30l6-10.4 6 10.4z"/>
                        <path fill="#EA4335" d="M18 30l6-10.4L30 30z"/>
                        <path fill="#FBBC04" d="M30 30l6-10.4L42 30z"/>
                    </svg>
                    <span style={{ fontSize: 18, fontWeight: 600, color: "#202124", letterSpacing: "-0.2px" }}>SmartVault</span>
                </div>

                {/* New button */}
                <div style={{ padding: "12px 16px" }}>
                    <button
                        onClick={() => document.getElementById("file-upload-input").click()}
                        style={{ background: "#fff", border: "1px solid #dadce0", borderRadius: 24, padding: "12px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,.08)", width: "100%", fontFamily: "inherit" }}>
                        <span style={{ fontSize: 20 }}>＋</span>
                        <span>New</span>
                    </button>
                    <input id="file-upload-input" type="file" multiple style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files)} />
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: "8px 8px" }}>
                    {sidebarItems.map(item => (
                        <div key={item.id}
                            onClick={() => { setView(item.id); }}
                            style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 24, cursor: "pointer", fontSize: 14, fontWeight: view === item.id ? 600 : 400, color: view === item.id ? "#1a73e8" : "#202124", background: view === item.id ? "#e8f0fe" : "transparent" }}
                            onMouseEnter={e => { if (view !== item.id) e.currentTarget.style.background = "#f1f3f4"; }}
                            onMouseLeave={e => { if (view !== item.id) e.currentTarget.style.background = "transparent"; }}>
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            {item.label}
                        </div>
                    ))}

                </nav>


                {/* User */}
                <div style={{ padding: "12px 16px", borderTop: "1px solid #e0e0e0", display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={user?.name} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
                        <div style={{ fontSize: 11, color: "#5f6368", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                    </div>
                    <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#5f6368", padding: 4 }} title="Sign out">⇒</button>
                </div>
            </div>

            {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
            <div className="dashboard-main" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                {/* Top bar */}
                <div className="dashboard-topbar" style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Search */}
                    <div className="dashboard-search" style={{ flex: 1, maxWidth: 720, position: "relative" }}>
                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#5f6368" }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search in Drive"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: "100%", background: "#f1f3f4", border: "none", borderRadius: 24, padding: "12px 20px 12px 44px", fontSize: 15, color: "#202124", outline: "none", fontFamily: "inherit" }}
                            onFocus={e => { e.target.style.background = "#fff"; e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,.15)"; }}
                            onBlur={e => { e.target.style.background = "#f1f3f4"; e.target.style.boxShadow = "none"; }}
                        />
                        {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#5f6368" }}>×</button>}
                    </div>

                    {/* View toggle */}
                    <div style={{ display: "flex", gap: 4, background: "#f1f3f4", borderRadius: 8, padding: 4 }}>
                        {[["grid", "⊞"], ["list", "☰"]].map(([mode, icon]) => (
                            <button key={mode} onClick={() => setViewMode(mode)}
                                style={{ background: viewMode === mode ? "#fff" : "none", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 16, color: viewMode === mode ? "#1a73e8" : "#5f6368", boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>
                                {icon}
                            </button>
                        ))}
                    </div>

                    {/* Upload button */}
                    <button className="dashboard-upload-btn" onClick={() => document.getElementById("file-upload-input").click()}
                        style={{ background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        ↑ Upload
                    </button>
                </div>

                {/* Content area */}
                <div className="dashboard-content" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                    {/* Title + breadcrumb */}
                    <div style={{ marginBottom: 20 }}>
                        {searchQuery ? (
                            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#202124" }}>Search results for "{searchQuery}"</h2>
                        ) : (
                            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#202124" }}>{viewTitle[view]}</h2>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
                            <div style={{ textAlign: "center", color: "#5f6368" }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>⟳</div>
                                Loading…
                            </div>
                        </div>
                    ) : files.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, color: "#5f6368" }}>
                            <div style={{ fontSize: 64, marginBottom: 16 }}>
                                {view === "trash" ? "🗑️" : view === "starred" ? "⭐" : "📁"}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                                {view === "trash" ? "Trash is empty" : view === "starred" ? "No starred files" : searchQuery ? "No results found" : "No files found"}
                            </div>
                            {view === "my-drive" && !searchQuery && (
                                <div style={{ fontSize: 14 }}>Drop files here or click Upload to get started</div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Files section */}
                            {files.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Files</div>

                                    {/* List header */}
                                    {viewMode === "list" && (
                                        <div className="dashboard-file-header">
                                            <div />
                                            <div>Name</div>
                                            <div>Modified</div>
                                            <div>Size</div>
                                            <div>Type</div>
                                            <div />
                                        </div>
                                    )}

                                    {viewMode === "grid" ? (
                                        <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                                            {files.map(f => (
                                                <FileCard key={f._id} file={f}
                                                    selected={selectedFile?._id === f._id}
                                                    onClick={setSelectedFile}
                                                    onStar={handleStar}
                                                    onContextMenu={(e, file) => setContextMenu({ x: e.clientX, y: e.clientY, items: getFileContextItems(file) })} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div>
                                            {files.map(f => (
                                                <FileRow key={f._id} file={f}
                                                    selected={selectedFile?._id === f._id}
                                                    onClick={setSelectedFile}
                                                    onStar={handleStar}
                                                    onContextMenu={(e, file) => setContextMenu({ x: e.clientX, y: e.clientY, items: getFileContextItems(file) })} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── FILE DETAIL PANEL ─────────────────────────────────────────── */}
            {selectedFile && (
                <div className="dashboard-detail-panel" style={{ background: "#fff", padding: 24, overflowY: "auto", flexShrink: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{selectedFile.fileName}</div>
                        <button onClick={() => setSelectedFile(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#5f6368", marginLeft: 8, padding: 4 }}>×</button>
                    </div>

                    {/* Preview */}
                    {selectedFile.thumbnailUrl && (
                        <img src={selectedFile.thumbnailUrl} alt="" style={{ width: "100%", borderRadius: 8, marginBottom: 20, objectFit: "cover", maxHeight: 160 }} />
                    )}
                    {!selectedFile.thumbnailUrl && (
                        <div style={{ height: 100, background: "#f1f3f4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, marginBottom: 20 }}>
                            {getFileIcon(selectedFile.fileType).icon}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                        <button onClick={() => handleDownload(selectedFile)} style={{ flex: 1, background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>⬇️ Download</button>
                        {view !== "trash" && <button onClick={() => setShareModal(selectedFile)} style={{ flex: 1, background: "#fff", color: "#1a73e8", border: "1px solid #dadce0", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>👥 Share</button>}
                    </div>


                    {/* More actions */}
                    {view !== "trash" && (
                        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                            <button onClick={() => { setRenameModal(selectedFile); setRenameValue(selectedFile.fileName); }}
                                style={actionBtnStyle}>✏️ Rename</button>
                            <button onClick={() => handleStar(selectedFile._id)}
                                style={actionBtnStyle}>{selectedFile.isStarred ? "☆ Remove star" : "★ Add to starred"}</button>
                            <button onClick={() => handleShareLink(selectedFile)}
                                style={actionBtnStyle}>🔗 Copy link</button>
                            <button onClick={() => handleDelete(selectedFile)}
                                style={{ ...actionBtnStyle, color: "#ea4335" }}>🗑️ Move to trash</button>
                        </div>
                    )}
                    {view === "trash" && (
                        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                            <button onClick={() => { handleRestore(selectedFile); setSelectedFile(null); }} style={actionBtnStyle}>↩️ Restore</button>
                            <button onClick={() => { handlePermanentDelete(selectedFile); setSelectedFile(null); }} style={{ ...actionBtnStyle, color: "#ea4335" }}>🗑️ Delete permanently</button>
                        </div>
                    )}
                </div>
            )}

            {/* ── CONTEXT MENU ──────────────────────────────────────────────── */}
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />}

            {/* ── MODALS ────────────────────────────────────────────────────── */}

            {/* Rename Modal */}
            <Modal open={!!renameModal} onClose={() => setRenameModal(null)} title="Rename file">
                <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRename()}
                    style={{ width: "100%", border: "1px solid #dadce0", borderRadius: 8, padding: "12px 16px", fontSize: 15, outline: "none", fontFamily: "inherit", marginBottom: 20 }}
                    autoFocus />
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button onClick={() => setRenameModal(null)} style={cancelBtnStyle}>Cancel</button>
                    <button onClick={handleRename} style={primaryBtnStyle}>Rename</button>
                </div>
            </Modal>

            {/* Share Modal */}
            <Modal open={!!shareModal} onClose={() => { setShareModal(null); setShareEmail(""); }} title="Share with people">
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#3c4043", display: "block", marginBottom: 6 }}>Email address</label>
                    <input value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="Add people by email"
                        style={{ width: "100%", border: "1px solid #dadce0", borderRadius: 8, padding: "12px 16px", fontSize: 15, outline: "none", fontFamily: "inherit" }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#3c4043", display: "block", marginBottom: 6 }}>Permission</label>
                    <select value={sharePermission} onChange={e => setSharePermission(e.target.value)}
                        style={{ width: "100%", border: "1px solid #dadce0", borderRadius: 8, padding: "12px 16px", fontSize: 15, fontFamily: "inherit", outline: "none" }}>
                        <option value="view">Viewer</option>
                        <option value="edit">Editor</option>
                    </select>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button onClick={() => { setShareModal(null); setShareEmail(""); }} style={cancelBtnStyle}>Cancel</button>
                    <button onClick={handleShare} style={primaryBtnStyle}>Share</button>
                </div>
            </Modal>

            {/* New folder feature removed */}

            {/* Share Link Modal */}
            <Modal open={!!shareLinkModal} onClose={() => setShareLinkModal(null)} title="Share link">
                {shareLinkModal && (
                    <>
                        <div style={{ background: "#f8f9fa", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#202124", wordBreak: "break-all", fontFamily: "monospace" }}>
                            {shareLinkModal.shareUrl}
                        </div>
                        <div style={{ fontSize: 13, color: "#5f6368", marginBottom: 20 }}>
                            Expires: {formatDate(shareLinkModal.expiresAt)}
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(shareLinkModal.shareUrl); showToast("Link copied!"); setShareLinkModal(null); }}
                            style={{ ...primaryBtnStyle, width: "100%" }}>📋 Copy link</button>
                    </>
                )}
            </Modal>

            {/* Preview Modal */}
            <Modal open={!!previewModal} onClose={() => setPreviewModal(null)} title={previewModal?.fileName || ""} width={720}>
                {previewModal && (
                    <div style={{ textAlign: "center" }}>
                        {previewModal.fileType?.startsWith("image/") ? (
                            <img src={previewModal.fileUrl} alt={previewModal.fileName} style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8, objectFit: "contain" }} />
                        ) : previewModal.fileType === "application/pdf" ? (
                            <iframe src={previewModal.fileUrl} style={{ width: "100%", height: "60vh", border: "none", borderRadius: 8 }} title="PDF Preview" />
                        ) : previewModal.fileType?.startsWith("video/") ? (
                            <video controls style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8 }}>
                                <source src={previewModal.fileUrl} type={previewModal.fileType} />
                            </video>
                        ) : previewModal.fileType?.startsWith("audio/") ? (
                            <audio controls style={{ width: "100%", marginTop: 20 }}>
                                <source src={previewModal.fileUrl} type={previewModal.fileType} />
                            </audio>
                        ) : (
                            <div style={{ padding: 40, color: "#5f6368" }}>
                                <div style={{ fontSize: 64, marginBottom: 16 }}>{getFileIcon(previewModal.fileType).icon}</div>
                                <div>Preview not available for this file type.</div>
                                <button onClick={() => handleDownload(previewModal)} style={{ ...primaryBtnStyle, marginTop: 16 }}>Download instead</button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── UPLOAD PROGRESS ───────────────────────────────────────────── */}
            <UploadProgress uploads={uploads} />

            {/* ── TOAST ─────────────────────────────────────────────────────── */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

const actionBtnStyle = {
    background: "none", border: "none", borderRadius: 8, padding: "10px 14px",
    fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
    color: "#202124", width: "100%"
};

const primaryBtnStyle = {
    background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
};

const cancelBtnStyle = {
    background: "#fff", color: "#1a73e8", border: "1px solid #dadce0", borderRadius: 8,
    padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
};
