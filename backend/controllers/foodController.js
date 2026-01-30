import foodModel from "../models/foodmodel.js";
import fs from "fs";

// Add food (expects filename from req.file OR req.body.image)
const addFood = async (req, res) => {
    try {
        const image_filename = req.file?.filename || req.body.image;

        if (!image_filename) {
            return res.status(400).json({ success: false, message: "Image is required." });
        }

        const food = new foodModel({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: image_filename
        });

        await food.save();
        res.status(201).json({ success: true, message: "Food added.", data: food });

    } catch (error) {
        console.error("Add food error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

// List all foods
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods });
    } catch (error) {
        console.error("List food error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Remove food
const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        if (!food) return res.status(404).json({ success: false, message: "Food not found" });

        // Delete image from uploads
        fs.unlink(`uploads/${food.image}`, () => {});

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Food removed" });

    } catch (error) {
        console.error("Remove food error:", error);
        res.json({ success: false, message: "Error deleting food" });
    }
};

export { addFood, listFood, removeFood };
