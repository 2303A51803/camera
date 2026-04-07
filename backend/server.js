require('dotenv').config();
// ...existing code...
// Move route definitions after app is initialized
// (Paste these after 'const app = express();' and before app.listen)

// Remove a cart item by id
// (Moved below)

// Get cart items for a user
// (Moved below)
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { initDb } = require('./db');
const { initMySql, getMySqlPool } = require('./mysql');


const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'camera-store-dev-secret-change-me';

const reminderTimers = new Map();

function createAuthToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);

    if (!match) {
        return res.status(401).json({ message: 'Authorization token is required.' });
    }

    try {
        const payload = jwt.verify(match[1], JWT_SECRET);
        req.user = {
            id: payload.userId,
            email: payload.email
        };
        return next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(401).json({ message: 'Invalid or expired authorization token.' });
    }
}

function createMailerTransport() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user,
            pass
        }
    });
}


const mailer = createMailerTransport();

// --- Moved route definitions here ---
// Remove a cart item by id
app.delete('/api/cart/:itemId', authenticateToken, async (req, res) => {
    try {
        const mysqlPool = getMySqlPool();
        if (!mysqlPool) {
            return res.status(503).json({ message: 'Cart service is not available. Please configure MySQL.' });
        }

        const itemId = Number(req.params.itemId);
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.status(400).json({ message: 'Valid itemId is required.' });
        }

        const [rows] = await mysqlPool.execute('SELECT user_id FROM cart_items WHERE id = ?', [itemId]);
        if (!rows.length) {
            return res.status(404).json({ message: 'Cart item not found.' });
        }

        if (Number(rows[0].user_id) !== Number(req.user.id)) {
            return res.status(403).json({ message: 'You are not allowed to modify this cart item.' });
        }

        await mysqlPool.execute('DELETE FROM cart_items WHERE id = ?', [itemId]);
        return res.status(200).json({ message: 'Cart item removed.' });
    } catch (error) {
        console.error('Remove cart item error:', error);
        return res.status(500).json({ message: 'Server error while removing cart item.' });
    }
});
// Get cart items for a user
app.get('/api/cart/:userId', authenticateToken, async (req, res) => {
    try {
        const mysqlPool = getMySqlPool();
        if (!mysqlPool) {
            return res.status(503).json({ message: 'Cart service is not available. Please configure MySQL.' });
        }
        const userId = Number(req.params.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ message: 'Valid userId is required.' });
        }
        if (userId !== Number(req.user.id)) {
            return res.status(403).json({ message: 'You can only view your own cart.' });
        }
        const [rows] = await mysqlPool.execute(
            'SELECT id, item_name, price, quantity, created_at FROM cart_items WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return res.status(200).json({ cart: rows });
    } catch (error) {
        console.error('Fetch cart error:', error);
        return res.status(500).json({ message: 'Server error while fetching cart.' });
    }
});

async function sendEmail({ to, subject, text, html }) {
    if (!mailer) {
        console.log('Email not sent: SMTP is not configured.');
        return { sent: false, reason: 'smtp_not_configured' };
    }

    try {
        await mailer.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to,
            subject,
            text,
            html
        });
        return { sent: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { sent: false, reason: 'send_failed' };
    }
}

function formatDateDisplay(dateIso) {
    return new Date(dateIso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getDamagePolicyHtml() {
    return `
        <ul>
            <li>The equipment must be returned in the same condition as provided (normal wear is acceptable).</li>
            <li>In case of physical damage, repair cost will be charged based on an authorized service center estimate.</li>
            <li>In case of severe damage or loss, replacement charges up to the full product value may apply.</li>
            <li>Late returns may attract additional rental charges as per store policy.</li>
            <li>Please report any issue immediately to support for assistance and record keeping.</li>
        </ul>
    `;
}

function getDamagePolicyText() {
    return [
        '- The equipment must be returned in the same condition as provided (normal wear is acceptable).',
        '- In case of physical damage, repair cost will be charged based on an authorized service center estimate.',
        '- In case of severe damage or loss, replacement charges up to the full product value may apply.',
        '- Late returns may attract additional rental charges as per store policy.',
        '- Please report any issue immediately to support for assistance and record keeping.'
    ].join('\n');
}

function buildRentalConfirmationEmail({ customerName, items, grandTotal }) {
    const rowsHtml = items
        .map((item) => `<li>${item.name} — ${item.days} day(s), Return by ${formatDateDisplay(item.dueDate)} (Total: ₹${item.totalPrice.toFixed(2)})</li>`)
        .join('');

    const subject = 'Camera Rental Confirmation and Return Policy';
    const html = `
        <p>Dear ${customerName},</p>
        <p>Thank you for confirming your camera rental with us. Your booking has been successfully recorded.</p>
        <p><strong>Important Return Reminder:</strong> Please submit the camera(s) on or before your deadline to avoid late charges.</p>
        <p><strong>Your Rental Summary:</strong></p>
        <ul>${rowsHtml}</ul>
        <p><strong>Total Amount:</strong> ₹${grandTotal.toFixed(2)}</p>
        <p><strong>Damage and Liability Policy:</strong></p>
        ${getDamagePolicyHtml()}
        <p>We will also send a reminder email before your rental period ends.</p>
        <p>Regards,<br/>Camera Store Team</p>
    `;

    const textLines = [
        `Dear ${customerName},`,
        '',
        'Thank you for confirming your camera rental with us. Your booking has been successfully recorded.',
        'Important Return Reminder: Please submit the camera(s) on or before your deadline to avoid late charges.',
        '',
        'Your Rental Summary:',
        ...items.map((item) => `- ${item.name} — ${item.days} day(s), Return by ${formatDateDisplay(item.dueDate)} (Total: ₹${item.totalPrice.toFixed(2)})`),
        '',
        `Total Amount: ₹${grandTotal.toFixed(2)}`,
        '',
        'Damage and Liability Policy:',
        getDamagePolicyText(),
        '',
        'We will also send a reminder email before your rental period ends.',
        '',
        'Regards,',
        'Camera Store Team'
    ];

    return { subject, html, text: textLines.join('\n') };
}

function buildRentalEndingSoonEmail({ customerName, rental }) {
    const subject = 'Reminder: Your Camera Rental Ends Soon';
    const html = `
        <p>Dear ${customerName},</p>
        <p>This is a friendly reminder that your rental period is ending soon.</p>
        <p><strong>Item:</strong> ${rental.item_name}<br/>
        <strong>Return Deadline:</strong> ${formatDateDisplay(rental.due_date)}</p>
        <p>Please return the camera before the deadline to avoid additional charges.</p>
        <p>Regards,<br/>Camera Store Team</p>
    `;

    const text = [
        `Dear ${customerName},`,
        '',
        'This is a friendly reminder that your rental period is ending soon.',
        `Item: ${rental.item_name}`,
        `Return Deadline: ${formatDateDisplay(rental.due_date)}`,
        'Please return the camera before the deadline to avoid additional charges.',
        '',
        'Regards,',
        'Camera Store Team'
    ].join('\n');

    return { subject, html, text };
}

function scheduleReminder(db, rental) {
    if (!rental || rental.reminder_sent === 1 || rental.status !== 'active') {
        return;
    }

    if (reminderTimers.has(rental.id)) {
        clearTimeout(reminderTimers.get(rental.id));
    }

    const dueDateMs = new Date(rental.due_date).getTime();
    if (Number.isNaN(dueDateMs)) {
        return;
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let delay = dueDateMs - oneDayMs - now;
    if (delay < 0) {
        delay = 60 * 1000;
    }

    const maxDelay = 2147483647;
    delay = Math.min(delay, maxDelay);

    const timerId = setTimeout(async () => {
        try {
            const rentalRecord = await db.get(
                `SELECT r.id, r.item_name, r.due_date, r.reminder_sent, r.status, u.name, u.email
                 FROM rentals r
                 JOIN users u ON u.id = r.user_id
                 WHERE r.id = ?`,
                rental.id
            );

            if (!rentalRecord || rentalRecord.status !== 'active' || rentalRecord.reminder_sent === 1) {
                reminderTimers.delete(rental.id);
                return;
            }

            const reminderEmail = buildRentalEndingSoonEmail({
                customerName: rentalRecord.name,
                rental: rentalRecord
            });

            const emailResult = await sendEmail({
                to: rentalRecord.email,
                ...reminderEmail
            });

            if (emailResult.sent) {
                await db.run('UPDATE rentals SET reminder_sent = 1 WHERE id = ?', rental.id);
            }
        } catch (error) {
            console.error('Rental reminder scheduling error:', error);
        } finally {
            reminderTimers.delete(rental.id);
        }
    }, delay);

    reminderTimers.set(rental.id, timerId);
}

(async () => {
    const db = await initDb();
    await initMySql();

    const activeRentals = await db.all('SELECT id, due_date, reminder_sent, status FROM rentals WHERE status = ?', 'active');
    activeRentals.forEach((rental) => scheduleReminder(db, rental));

    app.post('/api/auth/register', async (req, res) => {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ message: 'Name, email, and password are required.' });
            }

            const normalizedEmail = email.trim().toLowerCase();
            const existing = await db.get('SELECT id FROM users WHERE email = ?', normalizedEmail);
            if (existing) {
                return res.status(409).json({ message: 'Email already registered.' });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            await db.run(
                'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
                name.trim(),
                normalizedEmail,
                passwordHash
            );

            return res.status(201).json({ message: 'Registration successful.' });
        } catch (error) {
            console.error('Register error:', error);
            return res.status(500).json({ message: 'Server error during registration.' });
        }
    });

    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required.' });
            }

            const normalizedEmail = email.trim().toLowerCase();
            const user = await db.get('SELECT id, name, email, password_hash FROM users WHERE email = ?', normalizedEmail);

            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }

            const token = createAuthToken(user);

            return res.status(200).json({
                message: 'Login successful.',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ message: 'Server error during login.' });
        }
    });

    app.post('/api/rentals/confirm', authenticateToken, async (req, res) => {
        try {
            const { userId, items } = req.body;

            if (!userId || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'User and rental items are required.' });
            }

            if (Number(userId) !== Number(req.user.id)) {
                return res.status(403).json({ message: 'You can only confirm rentals for your own account.' });
            }

            const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', req.user.id);
            if (!user) {
                return res.status(401).json({ message: 'Invalid user. Please login again.' });
            }

            const now = Date.now();
            const createdItems = [];
            let grandTotal = 0;

            for (const item of items) {
                const name = typeof item.name === 'string' ? item.name.trim() : '';
                const days = Number(item.days);
                const pricePerDay = Number(item.pricePerDay);

                if (!name || !Number.isInteger(days) || days <= 0 || !Number.isFinite(pricePerDay) || pricePerDay <= 0) {
                    return res.status(400).json({ message: 'Invalid rental item data detected.' });
                }

                const totalPrice = Number((pricePerDay * days).toFixed(2));
                grandTotal += totalPrice;

                const dueDate = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();

                const result = await db.run(
                    `INSERT INTO rentals (user_id, item_name, price_per_day, days, total_price, due_date, status, reminder_sent)
                     VALUES (?, ?, ?, ?, ?, ?, 'active', 0)`,
                    user.id,
                    name,
                    pricePerDay,
                    days,
                    totalPrice,
                    dueDate
                );

                const rental = {
                    id: result.lastID,
                    item_name: name,
                    due_date: dueDate,
                    reminder_sent: 0,
                    status: 'active'
                };

                scheduleReminder(db, rental);

                createdItems.push({
                    id: result.lastID,
                    name,
                    days,
                    totalPrice,
                    dueDate
                });
            }

            const confirmationEmail = buildRentalConfirmationEmail({
                customerName: user.name,
                items: createdItems,
                grandTotal
            });

            const emailResult = await sendEmail({
                to: user.email,
                ...confirmationEmail
            });

            const message = emailResult.sent
                ? 'Rental confirmed. A confirmation email with return reminder and damage policy has been sent to your registered email.'
                : 'Rental confirmed. Email notification could not be sent because SMTP is not configured yet.';

            return res.status(201).json({
                message,
                emailSent: emailResult.sent,
                rentals: createdItems
            });
        } catch (error) {
            console.error('Rental confirmation error:', error);
            return res.status(500).json({ message: 'Server error while confirming rental.' });
        }
    });

    app.post('/api/purchases/confirm', authenticateToken, async (req, res) => {
        try {
            const mysqlPool = getMySqlPool();
            if (!mysqlPool) {
                return res.status(503).json({
                    message: 'Purchase service is not available. Please configure MySQL settings on the server.'
                });
            }

            const { userId, items } = req.body;

            if (!userId || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'User and purchase items are required.' });
            }

            if (Number(userId) !== Number(req.user.id)) {
                return res.status(403).json({ message: 'You can only confirm purchases for your own account.' });
            }

            const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', req.user.id);
            if (!user) {
                return res.status(401).json({ message: 'Invalid user. Please login again.' });
            }

            const groupedMap = new Map();
            for (const item of items) {
                const name = typeof item.name === 'string' ? item.name.trim() : '';
                const price = Number(item.price);
                const quantity = Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0
                    ? Number(item.quantity)
                    : 1;

                if (!name || !Number.isFinite(price) || price <= 0) {
                    return res.status(400).json({ message: 'Invalid purchase item data detected.' });
                }

                if (!groupedMap.has(name)) {
                    groupedMap.set(name, {
                        name,
                        price: Number(price.toFixed(2)),
                        quantity: 0
                    });
                }

                const groupedItem = groupedMap.get(name);
                groupedItem.quantity += quantity;
            }

            const groupedItems = Array.from(groupedMap.values()).map((item) => ({
                ...item,
                lineTotal: Number((item.price * item.quantity).toFixed(2))
            }));

            const totalAmount = Number(
                groupedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
            );

            const connection = await mysqlPool.getConnection();

            try {
                await connection.beginTransaction();

                const [purchaseResult] = await connection.execute(
                    `INSERT INTO purchases (user_id, customer_name, customer_email, total_amount, status)
                     VALUES (?, ?, ?, ?, 'confirmed')`,
                    [user.id, user.name, user.email, totalAmount]
                );

                const purchaseId = purchaseResult.insertId;

                for (const item of groupedItems) {
                    await connection.execute(
                        `INSERT INTO purchase_items (purchase_id, item_name, price, quantity, line_total)
                         VALUES (?, ?, ?, ?, ?)`,
                        [purchaseId, item.name, item.price, item.quantity, item.lineTotal]
                    );
                }

                await connection.commit();

                return res.status(201).json({
                    message: 'Purchase confirmed and stored successfully.',
                    purchaseId,
                    totalAmount,
                    items: groupedItems
                });
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Purchase confirmation error:', error);
            return res.status(500).json({ message: 'Server error while saving purchase details.' });
        }
    });

    // Add to cart API: stores a cart item in MySQL
    app.post('/api/cart', authenticateToken, async (req, res) => {
        try {
            const mysqlPool = getMySqlPool();
            if (!mysqlPool) {
                return res.status(503).json({ message: 'Cart service is not available. Please configure MySQL.' });
            }
            const { userId, name, price, quantity } = req.body;
            if (!userId || !name || !price) {
                return res.status(400).json({ message: 'userId, name, and price are required.' });
            }
            if (Number(userId) !== Number(req.user.id)) {
                return res.status(403).json({ message: 'You can only modify your own cart.' });
            }
            const qty = quantity && Number.isInteger(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;
            // Create cart_items table if not exists
            await mysqlPool.query(`
                CREATE TABLE IF NOT EXISTS cart_items (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    user_id INTEGER NOT NULL,
                    item_name VARCHAR(255) NOT NULL,
                    price DECIMAL(12,2) NOT NULL,
                    quantity INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB;
            `);
            await mysqlPool.execute(
                'INSERT INTO cart_items (user_id, item_name, price, quantity) VALUES (?, ?, ?, ?)',
                [req.user.id, name, price, qty]
            );
            return res.status(201).json({ message: 'Item added to cart in database.' });
        } catch (error) {
            console.error('Add to cart error:', error);
            return res.status(500).json({ message: 'Server error while adding to cart.' });
        }
    });

    app.get('/api/purchases/history/:userId', authenticateToken, async (req, res) => {
        try {
            const mysqlPool = getMySqlPool();
            if (!mysqlPool) {
                return res.status(503).json({
                    message: 'Purchase history is not available. Please configure MySQL settings on the server.'
                });
            }

            const userId = Number(req.params.userId);
            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({ message: 'Valid userId is required.' });
            }

            if (userId !== Number(req.user.id)) {
                return res.status(403).json({ message: 'You can only view your own purchase history.' });
            }

            const user = await db.get('SELECT id FROM users WHERE id = ?', req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const [rows] = await mysqlPool.execute(
                `SELECT p.id AS purchase_id,
                        p.total_amount,
                        p.status,
                        p.created_at,
                        pi.item_name,
                        pi.price,
                        pi.quantity,
                        pi.line_total
                 FROM purchases p
                 LEFT JOIN purchase_items pi ON pi.purchase_id = p.id
                 WHERE p.user_id = ?
                 ORDER BY p.created_at DESC, pi.id ASC`,
                [userId]
            );

            const purchaseMap = new Map();

            for (const row of rows) {
                if (!purchaseMap.has(row.purchase_id)) {
                    purchaseMap.set(row.purchase_id, {
                        purchaseId: row.purchase_id,
                        totalAmount: Number(row.total_amount),
                        status: row.status,
                        createdAt: row.created_at,
                        items: []
                    });
                }

                if (row.item_name) {
                    purchaseMap.get(row.purchase_id).items.push({
                        name: row.item_name,
                        price: Number(row.price),
                        quantity: Number(row.quantity),
                        lineTotal: Number(row.line_total)
                    });
                }
            }

            return res.status(200).json({
                purchases: Array.from(purchaseMap.values())
            });
        } catch (error) {
            console.error('Purchase history error:', error);
            return res.status(500).json({ message: 'Server error while fetching purchase history.' });
        }
    });

    const projectRoot = path.join(__dirname, '..');
    app.use(express.static(projectRoot));

    app.get('/', (req, res) => {
        res.sendFile(path.join(projectRoot, 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
})();
