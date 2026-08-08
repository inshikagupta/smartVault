const express = require("express");
const router = express.Router();
const { register, login, logout, getMe, forgotPassword,resetPassword} = require("../controllers/auth.controller");
const auth = require("../middleware/auth.middleware");

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", auth, getMe);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

module.exports = router;
