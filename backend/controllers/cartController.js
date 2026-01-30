import userModel from "../models/userModel.js";

// Add items to user cart
const addToCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        let cartData = userData.cartData || {};

        if (!cartData[req.body.itemId]) {
            cartData[req.body.itemId] = 1;
        } else {
            cartData[req.body.itemId] += 1;
        }

        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: "Added to cart." });
    } catch (error) {
        res.json({ success: false, message: "Error." });
    }
};

// Remove items from user cart
const removeFromCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        let cartData = userData.cartData || {};

        const itemId = req.body.itemId;
        
        if (cartData[itemId] && cartData[itemId] > 0) {
            cartData[itemId] -= 1;
            if (cartData[itemId] === 0) {
                delete cartData[itemId]; // Optional: remove item if count is 0
            }
        }

        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: "Removed from cart." }); // ✅ Fixed typo: "fron" → "from"
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error." });
    }
};

// Fetching user cart data
const getCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        let cartData = userData.cartData || {};
        res.json({ success: true, cartData }); // ✅ Fixed typo: res,json → res.json
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error." });
    }
};

export { addToCart, removeFromCart, getCart };
