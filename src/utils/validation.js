const validateUser = (req, res, next) => {
    const { username, password, email, type } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ 
            message: 'Please provide username, password and email' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            message: 'Password must be at least 6 characters long' 
        });
    }

    if (!['Admin', 'Manager', 'Staff'].includes(type)) {
        return res.status(400).json({ 
            message: 'Invalid user type' 
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            message: 'Please provide a valid email address' 
        });
    }

    next();
};

const validateProduct = (req, res, next) => {
    const { p_name, stock_level, reorder_point } = req.body;

    if (!p_name) {
        return res.status(400).json({ 
            message: 'Product name is required' 
        });
    }

    if (stock_level < 0) {
        return res.status(400).json({ 
            message: 'Stock level cannot be negative' 
        });
    }

    if (reorder_point < 0) {
        return res.status(400).json({ 
            message: 'Reorder point cannot be negative' 
        });
    }

    next();
};

const validateTransaction = (req, res, next) => {
    const { p_id, transaction_type, quantity } = req.body;

    if (!p_id) {
        return res.status(400).json({ 
            message: 'Product ID is required' 
        });
    }

    if (!['Stock In', 'Stock Out'].includes(transaction_type)) {
        return res.status(400).json({ 
            message: 'Invalid transaction type' 
        });
    }

    if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
        return res.status(400).json({ 
            message: 'Quantity must be a positive number' 
        });
    }

    next();
};

module.exports = {
    validateUser,
    validateProduct,
    validateTransaction
};