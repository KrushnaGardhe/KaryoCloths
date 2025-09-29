const express = require('express');
const router = express.Router();
// NOTE: Assuming your Product and Order models are correctly defined.
// const Product = require('../models/Product');
// const Order = require('../models/Order');

// --- Helper Functions (Replicated from EJS) ---
function calculateCartTotal(cart) {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateCartCount(cart) {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// -------------------------------------------------------------------
// 1. ADD TO CART (AJAX Endpoint)
// -------------------------------------------------------------------
router.post('/add', async (req, res) => {
    try {
        const { productId, size, color, quantity = 1 } = req.body;

        // --- MOCK PRODUCT RETRIEVAL ---
        // In a real app, this finds the product in the database:
        // const product = await Product.findById(productId);
        // if (!product) return res.status(404).json({ error: 'Product not found' });
        
        // Mock data for immediate testing (remove in production):
        const product = { name: 'Item', price: 100, images: ['/img/default.jpg'] };
        // ------------------------------
        
        if (!req.session.cart) {
            req.session.cart = [];
        }
        
        // Find item by unique identifiers (productId, size, color)
        const existingItem = req.session.cart.find(item => 
            item.productId === productId && item.size === size && item.color === color
        );
        
        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            req.session.cart.push({
                productId,
                name: product.name,
                price: product.price,
                image: product.images[0],
                size,
                color,
                quantity: parseInt(quantity)
            });
        }
        
        req.session.cartCount = calculateCartCount(req.session.cart);
        
        // Success response for AJAX update
        res.json({ success: true, cart: req.session.cart, cartCount: req.session.cartCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to add to cart' });
    }
});

// -------------------------------------------------------------------
// 2. VIEW CART (Page Render)
// -------------------------------------------------------------------
router.get('/', (req, res) => {
    const cart = req.session.cart || [];
    const total = calculateCartTotal(cart);
    
    // Pass cart, calculated total, and count to the EJS template
    res.render('cart', { 
        cart, 
        total,
        cartCount: req.session.cartCount || 0,
        pagePath: '/cart' // For active navbar link
    });
});

// -------------------------------------------------------------------
// 3. UPDATE CART ITEM (AJAX Endpoint for +/- buttons)
// FIXED: Returns JSON for instant client-side update
// -------------------------------------------------------------------
router.post('/update', (req, res) => {
    const { index, quantity } = req.body; // Expects item index and new quantity
    const itemIndex = parseInt(index);
    const newQuantity = parseInt(quantity);
    
    if (req.session.cart && req.session.cart[itemIndex] && newQuantity >= 1 && newQuantity <= 5) {
        req.session.cart[itemIndex].quantity = newQuantity;
        req.session.cartCount = calculateCartCount(req.session.cart);
        
        // Success response with updated cart data
        return res.json({ success: true, cart: req.session.cart, cartCount: req.session.cartCount });
    }
    
    // Fallback if index or quantity is invalid
    return res.json({ success: false, error: 'Invalid quantity or item index.' });
});

// -------------------------------------------------------------------
// 4. REMOVE FROM CART (AJAX Endpoint for removal)
// FIXED: Returns JSON for client-side processing before reload
// -------------------------------------------------------------------
router.post('/remove/:index', (req, res) => {
    const index = parseInt(req.params.index);
    
    if (req.session.cart && req.session.cart[index] !== undefined) {
        // Remove item at the specified index
        req.session.cart.splice(index, 1);
        req.session.cartCount = calculateCartCount(req.session.cart);
        
        // Success response with updated cart data
        return res.json({ success: true, cart: req.session.cart, cartCount: req.session.cartCount });
    }
    
    // Fallback if index is invalid
    return res.json({ success: false, error: 'Item not found or already removed.' });
});

// -------------------------------------------------------------------
// 5. CHECKOUT PAGE (Render)
// -------------------------------------------------------------------
router.get('/checkout', (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.redirect('/cart');
    }
    
    const cart = req.session.cart;
    const total = calculateCartTotal(cart);
    
    res.render('checkout', { 
        cart, 
        total,
        cartCount: req.session.cartCount || 0,
        pagePath: '/checkout' // For active navbar link
    });
});

// -------------------------------------------------------------------
// 6. PROCESS ORDER (Final Submission)
// FIXED: Passes all necessary variables to order-success page
// -------------------------------------------------------------------
router.post('/order', async (req, res) => {
    try {
        if (!req.session.cart || req.session.cart.length === 0) {
            return res.redirect('/cart');
        }
        
        const { name, email, phone, street, city, state, pincode, payment: paymentMethod } = req.body;
        const cart = req.session.cart;
        
        // Recalculate total/grandTotal logic (or use values from session)
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // --- Database Logic (Uncomment in real app) ---
        /*
        const order = new Order({
            // ... other fields
            items: cart,
            total,
            paymentMethod: paymentMethod // Store payment method
        });
        await order.save();
        const orderId = order._id;
        */
        
        // --- Mock Data for Rendering Success Page ---
        const orderId = 'MOCKID' + Date.now();
        // --------------------------------------------

        // Clear cart after successful order creation
        req.session.cart = [];
        req.session.cartCount = 0;
        
        // Render success page with ALL REQUIRED VARIABLES
        res.render('order-success', { 
            orderId: orderId,
            total: total,                          // <-- FIXED: Pass calculated total
            paymentMethod: paymentMethod || 'COD', // <-- FIXED: Pass payment method from req.body
            cartCount: 0,
            pagePath: '/order-confirmation'
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error: 'Unable to process order', cartCount: 0 });
    }
});


module.exports = router;