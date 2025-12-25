const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for attachments

// Database Configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password', // CHANGE THIS
    database: 'gig_portal',
    timezone: 'Z'
};

let pool;

async function initDB() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

initDB();

// --- ROUTES ---

// 1. Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            // Update last login
            await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [rows[0].id]);
            res.json(rows[0]);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Create/Update User
app.post('/api/users', async (req, res) => {
    const user = req.body;
    try {
        await pool.query(
            `INSERT INTO users (id, username, password, full_name, role, last_login) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password = VALUES(password), role = VALUES(role)`,
            [user.id, user.username, user.password, user.fullName, user.role, user.lastLogin]
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get QRFs
app.get('/api/qrfs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM qrfs');
        // Parse JSON columns
        const parsedRows = rows.map(row => ({
            ...row,
            types: row.types, // mysql2 automatically parses JSON columns if configured, ensuring here
            data: row.data,
            history: row.history,
            // Map snake_case DB columns to camelCase JS props
            referenceNumber: row.reference_number,
            agentId: row.agent_id,
            agentName: row.agent_name,
            submittedAt: row.submitted_at,
            createdAt: row.created_at,
            assignedToId: row.assigned_to_id,
            assignedToName: row.assigned_to_name,
            assignedAt: row.assigned_at,
            decidedAt: row.decided_at,
            isLocked: Boolean(row.is_locked),
            rejectionReason: row.rejection_reason,
            rejectionNote: row.rejection_note
        }));
        res.json(parsedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Save QRF
app.post('/api/qrfs', async (req, res) => {
    const q = req.body;
    try {
        const query = `
            INSERT INTO qrfs 
            (id, reference_number, name, types, agent_id, agent_name, status, created_at, submitted_at, assigned_to_id, assigned_to_name, assigned_at, decided_at, is_locked, rejection_reason, rejection_note, data, history)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            name=VALUES(name), status=VALUES(status), submitted_at=VALUES(submitted_at), assigned_to_id=VALUES(assigned_to_id), 
            assigned_to_name=VALUES(assigned_to_name), assigned_at=VALUES(assigned_at), decided_at=VALUES(decided_at), 
            is_locked=VALUES(is_locked), rejection_reason=VALUES(rejection_reason), rejection_note=VALUES(rejection_note), 
            data=VALUES(data), history=VALUES(history)
        `;
        
        const params = [
            q.id, q.referenceNumber, q.name, JSON.stringify(q.types), q.agentId, q.agentName, q.status, 
            q.createdAt || new Date(), q.submittedAt, q.assignedToId, q.assignedToName, q.assignedAt, q.decidedAt, 
            q.isLocked, q.rejectionReason, q.rejectionNote, JSON.stringify(q.data), JSON.stringify(q.history || [])
        ];

        await pool.query(query, params);
        res.json(q);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 6. Logs
app.get('/api/logs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 200');
        const parsed = rows.map(r => ({
            ...r,
            userId: r.user_id,
            userName: r.user_name,
            userRole: r.user_role,
            ipAddress: r.ip_address
        }));
        res.json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/logs', async (req, res) => {
    const l = req.body;
    try {
        await pool.query(
            'INSERT INTO system_logs (id, timestamp, user_id, user_name, user_role, action, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [l.id, l.timestamp, l.userId, l.userName, l.userRole, l.action, l.details, l.ipAddress]
        );
        res.sendStatus(201);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
