const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Mongoose model definitions (Placeholder structure for context)
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, images: [String] }));
const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({ total: Number, items: [Object] }));


// Helper functions (Simplified for stateless server)
function calculateTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    return { subtotal, count };
}

// -------------------------------------------------------------------
// 1. ADD TO CART (Stateless API - Client must send final data after fetching product details)
// -------------------------------------------------------------------
router.post('/add', async (req, res) => {
    try {
        const { productId, size, color, quantity = 1 } = req.body;

        // In a real app, you would fetch the product here to validate price/name
        const product = await Product.findById(productId); 
        if (!product) { 
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }
        
        // Server confirms product exists but does NOT manage the session state.
        // Client side will handle adding it to localStorage.
        res.json({ success: true, message: 'Item ready to be added locally.' });
    } catch (error) {
        console.error("Error adding item:", error);
        res.status(500).json({ error: 'Server error during validation.' });
    }
});

// -------------------------------------------------------------------
// 2. VIEW CART (Passes minimum data; client JS loads the rest)
// -------------------------------------------------------------------
router.get('/', (req, res) => {
    // Pass minimal data. The EJS will render an empty shell and JavaScript will fill it.
    res.render('cart', { 
        cart: [], // Empty array, to be filled by JS from localStorage
        total: 0, // Mock total, will be overwritten
        cartCount: 0, // Mock count
        pagePath: '/cart'
    });
});

// -------------------------------------------------------------------
// 3. UPDATE/REMOVE (Stateless Endpoints for simple redirect/API call)
// NOTE: Client JS will now handle the logic and simply refreshes the page.
// -------------------------------------------------------------------
router.post('/update', (req, res) => {
    // Server acknowledges update attempt and forces a redirect to refresh the client-side state.
    res.redirect('/cart'); 
});

router.post('/remove/:index', (req, res) => {
    // Server acknowledges removal attempt and forces a redirect.
    res.redirect('/cart');
});

// -------------------------------------------------------------------
// 4. CHECKOUT (Stateless Render - Client manages totals)
// -------------------------------------------------------------------
router.get('/checkout', (req, res) => {
    // NOTE: In a real stateless app, checkout data is POSTed from client form.
    // For rendering the page, we pass mocks.
    res.render('checkout', { 
        cart: [], 
        total: 0,
        cartCount: 0,
        pagePath: '/checkout'
    });
});

// -------------------------------------------------------------------
// 5. PROCESS ORDER (Saves final client payload to MongoDB)
// -------------------------------------------------------------------
router.post('/order', async (req, res) => {
    try {
        // The client must POST the entire cart data in the request body
        const { name, email, phone, street, city, state, pincode, payment: paymentMethod, clientCart: cart } = req.body;
        
        if (!cart || cart.length === 0) {
            return res.redirect('/cart');
        }
        
        // Recalculate total on the server using the client-provided data for verification
        const subtotal = calculateTotals(cart).subtotal;
        
        // --- SAVE TO MONGODB ATLAS ---
        const newOrder = new Order({
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            shippingAddress: { street, city, state, pincode },
            items: cart,
            total: subtotal,
            paymentMethod: paymentMethod || 'COD'
        });
        const savedOrder = await newOrder.save();
        
        // Success: Render confirmation page
        res.render('order-success', { 
            orderId: savedOrder._id,
            total: subtotal,
            paymentMethod: paymentMethod || 'COD',
            cartCount: 0, // Cart is now empty
            pagePath: '/order-confirmation'
        });
    } catch (error) {
        console.error("MONGO DB ERROR:", error);
        res.status(500).render('error', { error: 'Unable to process order.', cartCount: 0 });
    }
});

module.exports = router;
