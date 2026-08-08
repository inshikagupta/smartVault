const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/auth.middleware");
const c = require("../controllers/file.controller");

router.get("/public/:token", c.getPublicFileByToken);
router.use(auth);

router.post("/upload", upload.single("file"), c.uploadFile);
router.get("/", c.getAllFiles);
router.get("/starred", c.getStarredFiles);
router.get("/trash", c.getTrashFiles);
router.get("/shared", c.getSharedFiles);
router.get("/search", c.searchFiles);
router.get("/storage-stats", c.getStorageStats);
router.get("/download/:id", c.downloadFile);
router.put("/trash/:id", c.moveToTrash);
router.put("/restore/:id", c.restoreFile);
router.put("/rename/:id", c.renameFile);
router.put("/star/:id", c.toggleStar);
router.delete("/delete/:id", c.deleteFilePermanently);
router.post("/share/:id", c.shareFile);
router.post("/share-link/:id", c.generateShareLink);

module.exports = router;
