const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Product detail page
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('404');
        }
        
        // Get related products
        const relatedProducts = await Product.find({ 
            category: product.category, 
            _id: { $ne: product._id } 
        }).limit(4);
        
        res.render('product-detail', { 
            product, 
            relatedProducts,
            cartCount: req.session.cartCount || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error: 'Product not found' });
    }
});

module.exports = router;