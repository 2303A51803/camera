require('dotenv').config();
const mysql = require('mysql2/promise');

let mysqlPool = null;

function isMySqlConfigured() {
    return Boolean(
        process.env.MYSQL_HOST &&
        process.env.MYSQL_USER &&
        process.env.MYSQL_PASSWORD &&
        process.env.MYSQL_DATABASE
    );
}

async function initMySql() {
    if (!isMySqlConfigured()) {
        console.warn('MySQL is not configured. Purchase storage is disabled until MYSQL_* variables are set.');
        return null;
    }

    mysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS purchases (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            user_id INTEGER NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            total_amount DECIMAL(12, 2) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `);

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS purchase_items (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            purchase_id BIGINT NOT NULL,
            item_name VARCHAR(255) NOT NULL,
            price DECIMAL(12, 2) NOT NULL,
            quantity INTEGER NOT NULL,
            line_total DECIMAL(12, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_purchase_items_purchase
                FOREIGN KEY (purchase_id) REFERENCES purchases(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB;
    `);

    return mysqlPool;
}

function getMySqlPool() {
    return mysqlPool;
}

module.exports = {
    initMySql,
    getMySqlPool,
    isMySqlConfigured
};
