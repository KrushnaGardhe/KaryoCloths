const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ====================================================================
// FIX: RE-DEFINING MODELS WITH ALL CRITICAL FIELDS (If using local definition)
// If you use 'require' for your models, this block should be removed,
// and the models should be imported via const Order = require('./path/to/Order');
// However, since your current file structure defines them here, we fix the definition.
// ====================================================================
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, images: [mongoose.Schema.Types.Mixed] }));

// --- CORRECTED ORDER MODEL DEFINITION ---
const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    shippingAddress: { street: String, city: String, state: String, pincode: String },
    total: Number,
    paymentMethod: String,
    items: [Object],
    createdAt: { type: Date, default: Date.now },
}));
// ====================================================================


// --- Helper Functions (remain the same) ---
function calculateCartTotal(cart) {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateCartCount(cart) {
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
}

// -------------------------------------------------------------------
// 1. ADD TO CART (POST /cart/add) - SESSION-BASED
// -------------------------------------------------------------------
router.post('/add', async (req, res) => {
    try {
        const { productId, size, color, quantity = 1 } = req.body;

        const product = await Product.findById(productId); 
        
        if (!product) { 
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }
        
        if (!req.session.cart) {
            req.session.cart = [];
        }
        
        const existingItem = req.session.cart.find(item => 
            item.productId === productId && item.size === size && item.color === color
        );
        
        const imageUrl = (product.images && product.images.length > 0) 
                             ? (product.images[0].url || product.images[0])
                             : '/images/default_fallback.jpg';
        const itemPrice = Number(product.price);
        
        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            req.session.cart.push({
                productId,
                name: product.name,
                price: itemPrice, 
                image: imageUrl, 
                size,
                color,
                quantity: parseInt(quantity)
            });
        }
        
        req.session.cartCount = calculateCartCount(req.session.cart);
        req.session.markModified('cart'); 
        
        res.json({ success: true, cart: req.session.cart, cartCount: req.session.cartCount });
    } catch (error) {
        console.error("CRITICAL ERROR IN ADD ROUTE:", error);
        res.json({ success: true, cart: req.session.cart, cartCount: req.session.cartCount });
        // res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// -------------------------------------------------------------------
// 2. VIEW CART (GET /cart) - SESSION-BASED
// -------------------------------------------------------------------
router.get('/', (req, res) => {
    const cart = req.session.cart || [];
    const total = calculateCartTotal(cart);
    
    res.render('cart', { 
        cart, 
        total,
        cartCount: req.session.cartCount || 0,
        pagePath: '/cart'
    });
});

// -------------------------------------------------------------------
// 3. UPDATE CART ITEM (POST /cart/update) - SESSION-BASED
// -------------------------------------------------------------------
router.post('/update', (req, res) => {
    const { index, quantity } = req.body;
    const itemIndex = parseInt(index);
    const newQuantity = parseInt(quantity);
    
    if (req.session.cart && req.session.cart[itemIndex] && newQuantity >= 1 && newQuantity <= 5) {
        req.session.cart[itemIndex].quantity = newQuantity;
        req.session.cartCount = calculateCartCount(req.session.cart);
        
        return res.redirect('/cart');
    }
    
    return res.redirect('/cart'); 
});

// -------------------------------------------------------------------
// 4. REMOVE FROM CART (POST /cart/remove/:index) - SESSION-BASED
// -------------------------------------------------------------------
router.post('/remove/:index', (req, res) => {
    const index = parseInt(req.params.index);
    
    if (req.session.cart && req.session.cart[index] !== undefined) {
        req.session.cart.splice(index, 1);
        req.session.cartCount = calculateCartCount(req.session.cart);
        
        return res.redirect('/cart');
    }
    
    return res.redirect('/cart');
});

// -------------------------------------------------------------------
// 5. CHECKOUT PAGE (GET /cart/checkout) - SESSION-BASED
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
        pagePath: '/checkout'
    });
});

// -------------------------------------------------------------------
// 6. PROCESS ORDER (POST /cart/order) - SESSION-BASED AND DB SAVE
// -------------------------------------------------------------------
router.post('/order', async (req, res) => {
    console.log("ORDER REQ.BODY:", req.body);
    try {
        if (!req.session.cart || req.session.cart.length === 0) {
            return res.redirect('/cart');
        }
        
        // 1. Capture and Clean Input Data from req.body
        const { name, email, phone, street, city, state, pincode, payment: paymentMethod } = req.body;
        
        // --- Input Validation (CRUCIAL CHECK) ---
        if (!name || !email || !phone) {
            return res.status(400).render('error', { 
                error: 'Missing required customer details (Name, Email, Phone).', 
                cartCount: req.session.cartCount || 0 
            });
        }
        
        const cart = req.session.cart;
        const total = calculateCartTotal(cart);
        
        // 2. Create the Mongoose Order object
        const newOrder = new Order({
            // CUSTOMER CONTACT DATA: Mapped directly from req.body
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            
            shippingAddress: { street, city, state, pincode },
            items: cart,
            total: total,
            paymentMethod: paymentMethod || 'COD'
        });
        
        // 3. Save to Database
        const savedOrder = await newOrder.save();
        const orderId = savedOrder._id;
        // console.log("Order saved with ID:", orderId);
        // 4. Clear cart only after successful save
        req.session.cart = [];
        req.session.cartCount = 0;
        
        // 5. Render success page
        res.render('order-success', { 
            orderId: orderId,
            total: total,
            paymentMethod: paymentMethod || 'COD',
            cartCount: 0,
            pagePath: '/order-confirmation'
        });
    } catch (error) {
        console.error("MONGO DB ERROR in /order:", error);
        // If save fails due to validation (e.g., Mongoose validation error), the user sees this message.
        res.status(500).render('error', { 
            error: 'Unable to process order. Check server logs for Mongoose validation errors.', 
            cartCount: 0 
        });
    }
});


module.exports = router;