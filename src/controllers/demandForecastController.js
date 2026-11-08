// File: src/controllers/demandForecastController.js
const db = require('../config/db');
const _ = require('lodash');

const calculateDemandForecast = async (req, res) => {
    try {
        const [transactions] = await db.execute(`
            SELECT 
                p_id, 
                MONTH(transaction_date) as month, 
                YEAR(transaction_date) as year,
                SUM(CASE WHEN transaction_type = 'Stock Out' THEN quantity ELSE 0 END) as total_sold
            FROM transactions
            WHERE transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
            GROUP BY p_id, month, year
            ORDER BY p_id, year, month
        `);

        const productDemand = _.groupBy(transactions, 'p_id');

        // Calculate forecast for each product
        const forecasts = [];
        for (const [p_id, productTransactions] of Object.entries(productDemand)) {
            // Simple moving average forecast
            const monthlyAverage = _.meanBy(productTransactions, 'total_sold');
            
            // Get product details
            const [productDetails] = await db.execute(
                'SELECT p_name FROM products WHERE p_id = ?', 
                [p_id]
            );

            if (productDetails.length === 0) continue; // product was deleted

            const forecast = {
                p_id: parseInt(p_id),
                p_name: productDetails[0].p_name,
                predicted_demand: Math.round(monthlyAverage),
                confidence_level: 75 
            };

            // Insert or update forecast
            await db.execute(
                `INSERT INTO demand_forecast 
                (p_id, forecast_date, predicted_demand, confidence_level) 
                VALUES (?, CURRENT_DATE, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                predicted_demand = ?, 
                confidence_level = ?`,
                [
                    forecast.p_id, 
                    forecast.predicted_demand, 
                    forecast.confidence_level,
                    forecast.predicted_demand,
                    forecast.confidence_level
                ]
            );

            forecasts.push(forecast);
        }

        res.json(forecasts);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error calculating demand forecast', 
            error: error.message 
        });
    }
};

const getDemandForecasts = async (req, res) => {
    try {
        const { p_id } = req.query;
        let query = `
            SELECT df.*, p.p_name 
            FROM demand_forecast df
            JOIN products p ON df.p_id = p.p_id
            WHERE 1=1
        `;
        const queryParams = [];

        if (p_id) {
            query += ' AND df.p_id = ?';
            queryParams.push(p_id);
        }

        query += ' ORDER BY df.created_at DESC';

        const [forecasts] = await db.execute(query, queryParams);
        res.json(forecasts);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching demand forecasts', 
            error: error.message 
        });
    }
};

module.exports = {
    calculateDemandForecast,
    getDemandForecasts
};