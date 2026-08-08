const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema({
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
    note: { type: String, default: "" }
});

const fileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    fileType: { type: String },
    size: { type: Number, default: 0 },

    // Organization
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
        default: null
    },

    // Sharing
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, default: null },
    shareExpiry: { type: Date, default: null },
    permission: {
        type: String,
        enum: ["view", "edit"],
        default: "view"
    },
    sharedWith: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        permission: { type: String, enum: ["view", "edit"], default: "view" },
        sharedAt: { type: Date, default: Date.now }
    }],

    // State
    isStarred: { type: Boolean, default: false },
    isTrash: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },

    // AI & Search
    extractedText: { type: String, default: "" },
    tags: { type: [String], default: [] },
    description: { type: String, default: "" },

    // Versioning
    versions: [versionSchema],

    // Thumbnail for images/videos
    thumbnailUrl: { type: String, default: null },

    // Download tracking
    downloadCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: null },

}, { timestamps: true });

// Text search index
fileSchema.index({ fileName: "text", extractedText: "text", tags: "text", description: "text" });
fileSchema.index({ user: 1, isTrash: 1, createdAt: -1 });
fileSchema.index({ user: 1, isStarred: 1 });
fileSchema.index({ folder: 1 });
fileSchema.index({ shareToken: 1 });

// Virtual: human-readable size
fileSchema.virtual("sizeFormatted").get(function () {
    const bytes = this.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
});

module.exports = mongoose.model("File", fileSchema);
