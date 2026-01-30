import userModal from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";

// Helper: Create JWT Token
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '3d' }); // Token expires in 3 days
};

// Login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModal.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found." });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ success: false, message: "Incorrect password." });
        }

        const token = createToken(user._id);
        res.status(200).json({ success: true, token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Login failed. Server error." });
    }
};

// Register user
const registerUser = async (req, res) => {
    const { name, password, email } = req.body;

    try {
        const exists = await userModal.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "User already exists." });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email." });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModal({
            name,
            email,
            password: hashedPassword
        });

        const user = await newUser.save();
        const token = createToken(user._id);

        res.status(201).json({ success: true, token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Registration failed. Server error." });
    }
};

export { loginUser, registerUser };
