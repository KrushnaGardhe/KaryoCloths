const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Home page
router.get('/', async (req, res) => {
    try {
        const featuredProducts = await Product.find({ featured: true }).limit(6);
        const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(8);
        const bestSellers = await Product.find().sort({ reviews: -1 }).limit(4);
        
        res.render('index', { 
            featuredProducts, 
            newArrivals, 
            bestSellers,
            cartCount: req.session.cartCount || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error: 'Unable to load homepage' });
    }
});

// About page
router.get('/about', (req, res) => {
    res.render('about', { cartCount: req.session.cartCount || 0 });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('contact', { cartCount: req.session.cartCount || 0 });
});

// Contact form submission
router.post('/contact', (req, res) => {
    // Here you would typically send an email or save to database
    console.log('Contact form submission:', req.body);
    res.render('contact', { 
        success: 'Thank you for your message! We will get back to you soon.',
        cartCount: req.session.cartCount || 0
    });
});

// Shop page
router.get('/shop', async (req, res) => {
    try {
        const category = req.query.category;
        const sort = req.query.sort || 'newest';
        
        let query = {};
        if (category && category !== 'all') {
            query.category = category;
        }
        
        let sortQuery = {};
        switch (sort) {
            case 'price-low':
                sortQuery = { price: 1 };
                break;
            case 'price-high':
                sortQuery = { price: -1 };
                break;
            case 'rating':
                sortQuery = { rating: -1 };
                break;
            default:
                sortQuery = { createdAt: -1 };
        }
        
        const products = await Product.find(query).sort(sortQuery);
        const categories = await Product.distinct('category');
        
        res.render('shop', { 
            products, 
            categories, 
            currentCategory: category || 'all',
            currentSort: sort,
            cartCount: req.session.cartCount || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error: 'Unable to load shop' });
    }
});

module.exports = router;