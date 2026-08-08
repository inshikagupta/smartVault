function getFileIcon(type) {
    if (!type) return { icon: "📄", bg: "#f1f3f4" };

    if (type.startsWith("image/"))
        return { icon: "🖼️", bg: "#e6f4ea" };

    if (type.startsWith("video/"))
        return { icon: "🎬", bg: "#fce8e6" };

    if (type.startsWith("audio/"))
        return { icon: "🎵", bg: "#f3e8fd" };

    if (type === "application/pdf")
        return { icon: "📕", bg: "#fce8e6" };

    return { icon: "📄", bg: "#f1f3f4" };
}

function formatDate(d) {
    return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function FileCard({
    file,
    onContextMenu,
    onStar,
    onClick,
    selected,
}) {
    const { icon, bg } = getFileIcon(file.fileType);

    const renderPreview = () => {

        // IMAGE
        if (file.fileType?.startsWith("image/")) {
            return (
                <img
                    src={file.fileUrl}
                    alt={file.fileName}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            );
        }

        // VIDEO
        if (file.fileType?.startsWith("video/")) {
            return (
                <video
                    src={file.fileUrl}
                    muted
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            );
        }

        // AUDIO
        if (file.fileType?.startsWith("audio/")) {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                    }}
                >
                    <span style={{ fontSize: 42 }}>🎵</span>

                    <audio controls style={{ width: "90%" }}>
                        <source src={file.fileUrl} type={file.fileType} />
                    </audio>
                </div>
            );
        }

        // PDF
        if (file.fileType === "application/pdf") {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                    }}
                >
                    <span style={{ fontSize: 48 }}>📕</span>

                    <span style={{ fontSize: 12 }}>
                        PDF File
                    </span>
                </div>
            );
        }

        return <span style={{ fontSize: 48 }}>{icon}</span>;
    };

    return (
        <div
            onClick={() => onClick(file)}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(e, file);
            }}
            style={{
                background: selected ? "#e8f0fe" : "#fff",
                border: selected
                    ? "1px solid #1a73e8"
                    : "1px solid #e0e0e0",
                borderRadius: 12,
                padding: 16,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* PREVIEW */}
            <div
                style={{
                    height: 180,
                    borderRadius: 10,
                    background: bg,
                    overflow: "hidden",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {renderPreview()}
            </div>

            {/* FILE NAME */}
            <div
                style={{
                    fontSize: 14,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 6,
                }}
            >
                {file.fileName}
            </div>

            {/* DATE */}
            <div
                style={{
                    fontSize: 12,
                    color: "#5f6368",
                }}
            >
                {formatDate(file.createdAt)}
            </div>

            {/* STAR */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onStar(file._id);
                }}
                style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    border: "none",
                    background: "white",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                    fontSize: 18,
                    color: "#fbbc04",
                }}
            >
                {file.isStarred ? "★" : "☆"}
            </button>
        </div>
    );
}