const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    category: { type: String, required: true },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    images: [{ type: String }],
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 100 },
    featured: { type: Boolean, default: false },
    discount: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    reviews: { type: Number, default: 0 },
    tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);