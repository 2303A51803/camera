require('dotenv').config();
const mysql = require('mysql2/promise');

let mysqlPool = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isMySqlConfigured() {
    return Boolean(
        process.env.MYSQL_USER &&
        process.env.MYSQL_PASSWORD &&
        process.env.MYSQL_DATABASE
    );
}

async function waitForMySqlReady(pool) {
    // Retry connection checks so the app can wait for MySQL startup in Docker.
    const attempts = Number(process.env.MYSQL_RETRY_ATTEMPTS || 10);
    const delayMs = Number(process.env.MYSQL_RETRY_DELAY_MS || 3000);
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            await pool.query('SELECT 1');
            return;
        } catch (error) {
            lastError = error;
            if (attempt < attempts) {
                console.warn(`MySQL is not ready yet (attempt ${attempt}/${attempts}). Retrying in ${delayMs}ms...`);
                await sleep(delayMs);
            }
        }
    }

    const finalError = new Error(`Unable to connect to MySQL after ${attempts} attempts.`);
    finalError.cause = lastError;
    throw finalError;
}

async function initMySql() {
    if (!isMySqlConfigured()) {
        console.warn('MySQL is not configured. Purchase storage is disabled until MYSQL_* variables are set.');
        return null;
    }

    mysqlPool = mysql.createPool({
        // In Docker Compose, MySQL is reachable by service name "db".
        host: process.env.MYSQL_HOST || 'db',
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000
    });

    await waitForMySqlReady(mysqlPool);

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS purchases (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            user_id INTEGER NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            total_amount DECIMAL(12, 2) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
            delivery_date DATETIME NULL,
            admin_message VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `);

    await mysqlPool.query(`
        ALTER TABLE purchases
        ADD COLUMN IF NOT EXISTS delivery_date DATETIME NULL;
    `);

    await mysqlPool.query(`
        ALTER TABLE purchases
        ADD COLUMN IF NOT EXISTS admin_message VARCHAR(500) NULL;
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
