const express = require('express');
const cors = require('cors');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
}

const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const supplierRoutes = require('./src/routes/suppliers');
const transactionRoutes = require('./src/routes/transactions');
const notificationRoutes = require('./src/routes/notifications');
const demandForecastRoutes = require('./src/routes/demandForecast');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check (does not touch the database)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/demand-forecast', demandForecastRoutes);

// Unknown routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Malformed JSON bodies and other unhandled errors
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON body' });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});