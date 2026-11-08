const db = require('../config/db');

const createTransaction = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { p_id, transaction_type, notes = null } = req.body;
        const quantity = Number(req.body.quantity);
        const u_id = req.user.u_id;

        //  product details before transaction
        // Lock the product row so concurrent transactions can't race on stock_level
        const [productsBefore] = await connection.execute(
            'SELECT stock_level, reorder_point, p_name FROM products WHERE p_id = ? FOR UPDATE', 
            [p_id]
        );
        const productBefore = productsBefore[0];

        if (!productBefore) {
            await connection.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }

        if (transaction_type === 'Stock Out' && productBefore.stock_level < quantity) {
            await connection.rollback();
            return res.status(400).json({ message: 'Insufficient stock level' });
        }


        //new stock value    
        const newStockLevel = transaction_type === 'Stock In' 
            ? productBefore.stock_level + quantity 
            : productBefore.stock_level - quantity;

        // Insert transaction
        const [transactionResult] = await connection.execute(
            'INSERT INTO transactions (p_id, u_id, transaction_type, quantity, notes) VALUES (?, ?, ?, ?, ?)',
            [p_id, u_id, transaction_type, quantity, notes]
        );

        await connection.execute(
            'UPDATE products SET stock_level = ? WHERE p_id = ?',
            [newStockLevel, p_id]
        );

        const [existingNotifications] = await connection.execute(
            'SELECT n_id FROM notifications WHERE p_id = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
            [p_id, 'Low Stock']
        );

        // Create notification  if no notification exists
        if (newStockLevel <= productBefore.reorder_point && existingNotifications.length === 0) {
            await connection.execute(
                'INSERT INTO notifications (type, p_id, message, priority) VALUES (?, ?, ?, ?)',
                [
                    'Low Stock', 
                    p_id, 
                    `Product ${productBefore.p_name} is below reorder point. Current stock: ${newStockLevel}. Reorder point: ${productBefore.reorder_point}`,
                    'High'
                ]
            );
        }

        await connection.commit();

        res.status(201).json({ 
            message: 'Transaction recorded successfully', 
            t_id: transactionResult.insertId 
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ 
            message: 'Error creating transaction', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
};

const getTransactions = async (req, res) => {
    try {
        const { productId } = req.query;
        let query = `
            SELECT t.*, 
                   p.p_name, 
                   u.username 
            FROM transactions t
            JOIN products p ON t.p_id = p.p_id
            JOIN users u ON t.u_id = u.u_id
            WHERE 1=1
        `;
        const queryParams = [];

        if (productId) {
            query += ' AND t.p_id = ?';
            queryParams.push(productId);
        }

        query += ' ORDER BY t.transaction_date DESC';

        const [transactions] = await db.execute(query, queryParams);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching transactions', 
            error: error.message 
        });
    }
};

module.exports = {
    createTransaction,
    getTransactions
};