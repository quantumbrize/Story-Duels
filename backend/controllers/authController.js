const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const { handleError } = require("../helpers/handleError.js");

const signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(handleError(409, "User already exists."));
        }

        // Hash password
        const hashedPassword = bcryptjs.hashSync(password);

        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "Signup successful."
        });

    } catch (error) {
        next(handleError(500, error.message));
    }
};

// Login Controller
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return next(handleError(404, "Invalid login credentials."));
        }

        const hashedPassword = user.password;
        const isPasswordValid = await bcryptjs.compare(password, hashedPassword);

        if (!isPasswordValid) {
            return next(handleError(404, "Invalid login credentials."));
        }

        // Generate JWT Token
        const token = jwt.sign(
            {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            },
            process.env.JWT_SECRET
        );

        // Set cookie with token
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            path: "/"
        });

        const newUser = user.toObject({ getters: true });
        delete newUser.password; // Remove password before sending user data

        res.status(200).json({
            success: true,
            user: newUser,
            message: "Login successful."
        });

    } catch (error) {
        next(handleError(500, error.message));
    }
};

// OTP Verification Controller
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.otp || user.otp !== otp) return res.status(400).json({ error: "Invalid or expired OTP" });

        // Mark user as verified and clear OTP
        user.isVerified = true;
        user.otp = null;
        await user.save();

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({
            message: "OTP Verified",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
            },
        });

    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// Export all functions using CommonJS
module.exports = {
    signup,
    login,
    verifyOTP
};
