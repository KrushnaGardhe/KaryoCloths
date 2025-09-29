const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const ejsMate = require('ejs-mate');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'karyo-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/karyo_clothing';
console.log('Using MongoDB URI:', mongodbUri);
// MongoDB Connection
mongoose.connect(mongodbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Routes
const indexRoutes = require('./routes/index');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');



app.use('/', indexRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: 'Something went wrong!' });
});


// 404 handler
app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(PORT, () => {
    console.log(`Karyo Clothing Shop running on port ${PORT}`);
});