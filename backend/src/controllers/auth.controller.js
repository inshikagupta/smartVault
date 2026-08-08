const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  secure: process.env.NODE_ENV === "production",
};

async function register(req, res) {
  try {
    let { name, email, password } = req.body;
    name = name?.trim() || "";
    email = email?.trim().toLowerCase() || "";

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nameRegex.test(name))
      return res.status(400).json({ success: false, message: "Name is not valid. Use letters and spaces only, 3-50 characters." });
    if (!emailRegex.test(email))
      return res.status(400).json({ success: false, message: "Email is not valid." });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, COOKIE_OPTS);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("[register]", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function login(req, res) {
  try {
    let { email, password } = req.body;
    if (!email?.trim() || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, COOKIE_OPTS);

    res.json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("[login]", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function logout(req, res) {
  res.clearCookie("token", COOKIE_OPTS);
  res.json({ success: true, message: "Logged out" });
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function forgotPassword(req, res) {
  try {
    let { email } = req.body;
    if (!email?.trim())
      return res.status(400).json({ success: false, message: "Email is required" });

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
          success: true,
          message: "If that email is registered, a password reset link has been sent."
      });
}
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
                        .createHash("sha256")
                        .update(resetToken)
                        .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    const subject = "SmartVault Password Reset";
    const text = `You requested a password reset. Use the link below to set a new password (expires in 15 minutes):\n\n${resetUrl}`;

    const response = {
      success: true,
      message: "If that email is registered, a password reset link has been sent.",
      resetLink: resetUrl,
      emailSent: false,
    };

    void sendEmail(user.email, subject, text)
      .then(() => {
        console.log("[forgotPassword] email sent");
      })
      .catch((emailErr) => {
        console.error("[forgotPassword] email send failed", emailErr);
      });

    return res.status(200).json(response);
  } catch (error) {
    console.error("[forgotPassword]", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function resetPassword(req, res) {
  try {
    const token = req.params.token;
    const { password } = req.body;

    if (!token || !password) 
      return res.status(400).json({ message: "Password is required" });

    if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({
            success: true,
            message: "Password updated successfully"
    });

  } catch (error) {
    console.error("[resetPassword]", error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = { register, login, logout, getMe, forgotPassword, resetPassword };
