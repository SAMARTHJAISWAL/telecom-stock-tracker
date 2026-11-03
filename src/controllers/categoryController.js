const db = require('../config/db');

const getAllCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};

const addCategory = async (req, res) => {
    try {
        const { category_name } = req.body;
        if (!category_name) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const [result] = await db.execute(
            'INSERT INTO categories (category_name) VALUES (?)',
            [category_name]
        );
        res.status(201).json({ 
            message: 'Category added successfully', 
            category_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error adding category', error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { category_name } = req.body;
        const { id } = req.params;
        const [result] = await db.execute(
            'UPDATE categories SET category_name = ? WHERE category_id = ?',
            [category_name, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute('DELETE FROM categories WHERE category_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
};

module.exports = {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory
};