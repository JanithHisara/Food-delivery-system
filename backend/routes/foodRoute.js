import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { addFood, listFood, removeFood } from "../controllers/foodController.js";

const foodRouter = express.Router();

// Ensure uploads folder exists
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Image storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Routes
foodRouter.post("/add", upload.single("image"), addFood);  // with optional file
foodRouter.get("/list", listFood);
foodRouter.post("/remove", removeFood);

export default foodRouter;
