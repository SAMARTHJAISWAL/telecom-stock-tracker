-- MySQL schema for the Telecom Inventory Management backend.
-- Reconstructed from the queries in src/controllers. Run with:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS telecom_inventory;
USE telecom_inventory;

CREATE TABLE IF NOT EXISTS users (
    u_id       INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,           -- bcrypt hash
    f_name     VARCHAR(50),
    l_name     VARCHAR(50),
    type       ENUM('Admin', 'Manager', 'Staff') NOT NULL DEFAULT 'Staff',
    phone      VARCHAR(20),
    email      VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
    s_id          INT AUTO_INCREMENT PRIMARY KEY,
    s_name        VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS products (
    p_id          INT AUTO_INCREMENT PRIMARY KEY,
    p_name        VARCHAR(100) NOT NULL,
    description   TEXT,
    category_id   INT,
    model_number  VARCHAR(50),
    stock_level   INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 0,
    s_id          INT,
    order_date    DATE,
    order_status  VARCHAR(30),
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (s_id) REFERENCES suppliers(s_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    t_id             INT AUTO_INCREMENT PRIMARY KEY,
    p_id             INT NOT NULL,
    u_id             INT NOT NULL,
    transaction_type ENUM('Stock In', 'Stock Out') NOT NULL,
    quantity         INT NOT NULL,
    notes            TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (p_id) REFERENCES products(p_id) ON DELETE CASCADE,
    FOREIGN KEY (u_id) REFERENCES users(u_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    n_id       INT AUTO_INCREMENT PRIMARY KEY,
    type       VARCHAR(30) NOT NULL,             -- e.g. 'Low Stock'
    p_id       INT,
    message    TEXT NOT NULL,
    priority   ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (p_id) REFERENCES products(p_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS demand_forecast (
    df_id            INT AUTO_INCREMENT PRIMARY KEY,
    p_id             INT NOT NULL,
    forecast_date    DATE NOT NULL,
    predicted_demand INT NOT NULL,
    confidence_level INT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_product_day (p_id, forecast_date),  -- needed by ON DUPLICATE KEY UPDATE
    FOREIGN KEY (p_id) REFERENCES products(p_id) ON DELETE CASCADE
);
