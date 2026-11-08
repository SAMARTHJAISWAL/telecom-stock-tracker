const db = require('../config/db');

const getAllProducts = async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.category_name, s.s_name as supplier_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.s_id = s.s_id
        `);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

const addProduct = async (req, res) => {
    try {
        // mysql2 rejects `undefined` bind values, so optional fields default to null
        const {
            p_name,
            description = null,
            category_id = null,
            model_number = null,
            stock_level = 0,
            reorder_point = 0,
            s_id = null,
            order_date = null,
            order_status = null
        } = req.body;

        const [result] = await db.execute(
            `INSERT INTO products (p_name, description, category_id, model_number, 
            stock_level, reorder_point, s_id, order_date, order_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p_name, description, category_id, model_number, stock_level, 
            reorder_point, s_id, order_date, order_status]
        );

        res.status(201).json({ 
            message: 'Product added successfully', 
            p_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        // mysql2 rejects `undefined` bind values, so optional fields default to null
        const {
            p_name,
            description = null,
            category_id = null,
            model_number = null,
            stock_level = 0,
            reorder_point = 0,
            s_id = null,
            order_date = null,
            order_status = null
        } = req.body;
        const { id } = req.params;

        const [result] = await db.execute(
            `UPDATE products SET 
                p_name = ?, description = ?, category_id = ?, model_number = ?,
                stock_level = ?, reorder_point = ?, s_id = ?, order_date = ?,
                order_status = ?
            WHERE p_id = ?`,
            [p_name, description, category_id, model_number, stock_level,
            reorder_point, s_id, order_date, order_status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute('DELETE FROM products WHERE p_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

const searchProducts = async (req, res) => {
    try {
        const { query = '' } = req.query;
        const [products] = await db.query(
            `SELECT p.*, c.category_name, s.s_name as supplier_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.s_id = s.s_id
            WHERE p.p_name LIKE ? OR p.description LIKE ? OR c.category_name LIKE ?`,
            [`%${query}%`, `%${query}%`, `%${query}%`]
        );
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error searching products', error: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await db.execute(`
            SELECT p.*, 
                   c.category_name, 
                   s.s_name as supplier_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.s_id = s.s_id
            WHERE p.p_id = ?
        `, [id]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(products[0]);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching product details', 
            error: error.message 
        });
    }
};


const stockIn = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    try {
        if (!(Number(quantity) > 0)) {
            return res.status(400).json({ message: 'Quantity must be greater than zero' });
        }

        const [product] = await db.execute('SELECT stock_level FROM products WHERE p_id = ?', [id]);

        if (product.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const newStockLevel = product[0].stock_level + Number(quantity);

        await db.execute('UPDATE products SET stock_level = ? WHERE p_id = ?', [newStockLevel, id]);

        res.json({ message: 'Stock added successfully', newStockLevel });
    } catch (error) {
        res.status(500).json({ message: 'Error adding stock', error: error.message });
    }
};
const stockOut = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    try {
        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than zero' });
        }

        const [product] = await db.execute('SELECT stock_level FROM products WHERE p_id = ?', [id]);

        if (product.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product[0].stock_level < quantity) {
            return res.status(400).json({ message: 'Insufficient stock level' });
        }

        // decrease 
        const newStockLevel = product[0].stock_level - quantity;

        // Update stock level 
        await db.execute('UPDATE products SET stock_level = ? WHERE p_id = ?', [newStockLevel, id]);

        res.json({ message: 'Stock reduced successfully', newStockLevel });
    } catch (error) {
        res.status(500).json({ message: 'Error reducing stock', error: error.message });
    }
};

module.exports = {
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    stockIn,
    stockOut,
    getProductById
};