//const Folder = require("../models/folder.model");
const File = require("../models/file.model");
const Activity = require("../models/activity.model");

async function logActivity(userId, action, folderId, folderName, metadata = {}) {
    try {
        await Activity.create({ user: userId, action, targetType: "folder", targetId: folderId, targetName: folderName, metadata });
    } catch (e) { }
}

async function createFolder(req, res) {
    try {
        const { name, parent, color } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Folder name is required" });

        // Validate parent exists and belongs to user
        if (parent) {
            const parentFolder = await Folder.findOne({ _id: parent, user: req.user.id });
            if (!parentFolder) return res.status(404).json({ success: false, message: "Parent folder not found" });
        }

        const folder = await Folder.create({
            name: name.trim(),
            user: req.user.id,
            parent: parent || null,
            color: color || "#4285F4"
        });

        await logActivity(req.user.id, "create_folder", folder._id, folder.name, { parent });
        res.status(201).json({ success: true, folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

async function getFolders(req, res) {
    try {
        const { parent = null } = req.query;
        const folders = await Folder.find({
            user: req.user.id,
            parent: parent || null,
            isTrash: false
        }).sort({ name: 1 });

        res.json({ success: true, folders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get folder tree (recursive)
async function getFolderTree(req, res) {
    try {
        const allFolders = await Folder.find({ user: req.user.id, isTrash: false }).sort({ name: 1 });

        // Build tree
        function buildTree(parentId = null) {
            return allFolders
                .filter(f => {
                    const fParent = f.parent ? f.parent.toString() : null;
                    const tParent = parentId ? parentId.toString() : null;
                    return fParent === tParent;
                })
                .map(f => ({ ...f.toJSON(), children: buildTree(f._id) }));
        }

        res.json({ success: true, tree: buildTree(null) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

async function renameFolder(req, res) {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Name is required" });

        const folder = await Folder.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { name: name.trim() },
            { new: true }
        );
        if (!folder) return res.status(404).json({ success: false, message: "Folder not found" });
        res.json({ success: true, folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

async function updateFolderColor(req, res) {
    try {
        const { color } = req.body;
        const folder = await Folder.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { color },
            { new: true }
        );
        res.json({ success: true, folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Move folder to trash (and all contents)
async function moveFolderToTrash(req, res) {
    try {
        const folder = await Folder.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isTrash: true, trashedAt: new Date() },
            { new: true }
        );
        if (!folder) return res.status(404).json({ success: false, message: "Folder not found" });

        // Also trash all files inside
        await File.updateMany({ folder: req.params.id, user: req.user.id }, { isTrash: true, trashedAt: new Date() });

        await logActivity(req.user.id, "delete_folder", folder._id, folder.name, {});
        res.json({ success: true, message: "Folder moved to trash", folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

async function deleteFolder(req, res) {
    try {
        await Folder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        // Orphan files go to root
        await File.updateMany({ folder: req.params.id, user: req.user.id }, { folder: null });
        res.json({ success: true, message: "Folder deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get folder breadcrumb path
async function getFolderBreadcrumb(req, res) {
    try {
        const path = [];
        let current = await Folder.findOne({ _id: req.params.id, user: req.user.id });
        if (!current) return res.status(404).json({ success: false, message: "Folder not found" });

        path.unshift({ id: current._id, name: current.name });

        // Walk up the tree (max 10 levels)
        let depth = 0;
        while (current.parent && depth < 10) {
            current = await Folder.findOne({ _id: current.parent, user: req.user.id });
            if (!current) break;
            path.unshift({ id: current._id, name: current.name });
            depth++;
        }

        res.json({ success: true, breadcrumb: path });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    createFolder, getFolders, getFolderTree, renameFolder,
    updateFolderColor, moveFolderToTrash, deleteFolder, getFolderBreadcrumb
};
