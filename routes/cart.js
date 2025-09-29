const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ====================================================================
// MODEL DEFINITIONS (Adjust these if your models are complex)
// ====================================================================
// Use .lean() in queries for performance, but stick to direct Mongoose interaction here.
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, images: [mongoose.Schema.Types.Mixed] }));
const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({ total: Number, items: [Object] }));

// --- Helper Functions ---
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

        // 1. Fetch the product for price/image verification
        const product = await Product.findById(productId); 
        
        if (!product) { 
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }
        
        if (!req.session.cart) {
            req.session.cart = [];
        }
        console.log("Current Cart:", req.session.cart);
        // 2. Find existing item
        const existingItem = req.session.cart.find(item => 
            item.productId === productId && item.size === size && item.color === color
        );
        
        // 3. Prepare Safe Data (FIX for images/price)
        const imageUrl = (product.images && product.images.length > 0) 
                         ? (product.images[0].url || product.images[0]) // Assumes image is URL string OR object with 'url'
                         : '/images/default_fallback.jpg';
        const itemPrice = Number(product.price);
        
        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            req.session.cart.push({
                productId,
                name: product.name,
                price: itemPrice, // Use verified price
                image: imageUrl,   // Use verified image
                size,
                color,
                quantity: parseInt(quantity)
            });
        }
        
        req.session.cartCount = calculateCartCount(req.session.cart);
       
        
        res.json({ success: true, cart: req.session.cart, cartCount: req.session.cartCount });
    } catch (error) {
        console.error("CRITICAL ERROR IN ADD ROUTE:", error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
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
        
        // Redirect ensures full page reload and state synchronization
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
    try {
        if (!req.session.cart || req.session.cart.length === 0) {
            return res.redirect('/cart');
        }
        
        const { name, email, phone, street, city, state, pincode, payment: paymentMethod } = req.body;
        const cart = req.session.cart;
        const total = calculateCartTotal(cart);
        
        // --- MOCK/REAL DATABASE LOGIC (Saves to DB) ---
        const newOrder = new Order({
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            shippingAddress: { street, city, state, pincode },
            items: cart,
            total: total,
            paymentMethod: paymentMethod || 'COD'
        });
        const savedOrder = await newOrder.save();
        const orderId = savedOrder._id;
        // --------------------------------------------

        req.session.cart = [];
        req.session.cartCount = 0;
        
        res.render('order-success', { 
            orderId: orderId,
            total: total,
            paymentMethod: paymentMethod || 'COD',
            cartCount: 0,
            pagePath: '/order-confirmation'
        });
    } catch (error) {
        console.error("MONGO DB ERROR in /order:", error);
        res.status(500).render('error', { error: 'Unable to process order due to a database error.', cartCount: 0 });
    }
});


module.exports = router;