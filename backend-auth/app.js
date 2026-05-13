const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8004;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5175'],
    credentials: true
}));
app.use(express.json());

// Настройка подключения к БД
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'music_manager',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2025-music-manager';

// Проверка подключения
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
    } else {
        console.log('✅ Auth сервер подключен к PostgreSQL');
        release();
        initTables();
    }
});

async function initTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'manager',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(100),
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                token VARCHAR(500),
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Проверяем и создаём пользователей
        const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (adminCheck.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'INSERT INTO users (username, password_hash, role, is_active) VALUES ($1, $2, $3, $4)',
                ['admin', hashedPassword, 'admin', true]
            );
            console.log('✅ Создан пользователь admin');
        } else {
            console.log('✅ Пользователь admin уже существует');
        }
        
        const managerCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['manager']);
        if (managerCheck.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('manager123', 10);
            await pool.query(
                'INSERT INTO users (username, password_hash, role, is_active) VALUES ($1, $2, $3, $4)',
                ['manager', hashedPassword, 'manager', true]
            );
            console.log('✅ Создан пользователь manager');
        } else {
            console.log('✅ Пользователь manager уже существует');
        }
        
        // Выводим всех пользователей для проверки
        const users = await pool.query('SELECT id, username, role FROM users');
        console.log('📋 Пользователи в БД:', users.rows);
        
    } catch (err) {
        console.error('❌ Ошибка инициализации:', err.message);
    }
}

// ТЕСТОВЫЕ ЭНДПОИНТЫ
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ message: 'Database connected!', time: result.rows[0].time });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/test-users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role FROM users');
        res.json({ count: result.rows.length, users: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ЛОГИН
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log(`🔐 Login attempt: ${username}`);
    
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        
        console.log(`📊 Query result: ${result.rows.length} row(s)`);
        
        if (result.rows.length === 0) {
            console.log(`❌ User not found: ${username}`);
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
        
        const user = result.rows[0];
        console.log(`✅ User found: ${user.username}, role: ${user.role}`);
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log(`🔑 Password valid: ${validPassword}`);
        
        if (!validPassword) {
            console.log(`❌ Invalid password for: ${username}`);
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
        
        if (!user.is_active) {
            console.log(`❌ User blocked: ${username}`);
            return res.status(401).json({ error: 'Пользователь заблокирован' });
        }
        
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [user.id]);
        await pool.query(
            'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 day\')',
            [user.id, token]
        );
        
        console.log(`✅ User logged in: ${username} (${user.role})`);
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
        
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await pool.query(
            'SELECT * FROM user_sessions WHERE token = $1 AND expires_at > NOW()',
            [token]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid session' });
        }
        res.json({ valid: true, user: decoded });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        await pool.query('DELETE FROM user_sessions WHERE token = $1', [token]);
    }
    res.json({ message: 'Logged out' });
});

const requireAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

app.get('/api/users', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, role, is_active, created_at, last_login FROM users ORDER BY id'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', requireAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role, created_by) VALUES ($1, $2, $3, $4) RETURNING id, username, role',
            [username, hashedPassword, role || 'manager', req.user.id]
        );
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'CREATE_USER', `Created user ${username}`]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

app.put('/api/users/:id', requireAdmin, async (req, res) => {
    const { is_active, role } = req.body;
    const userId = req.params.id;
    try {
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot modify yourself' });
        }
        await pool.query(
            'UPDATE users SET is_active = $1, role = $2 WHERE id = $3',
            [is_active, role, userId]
        );
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'UPDATE_USER', `Updated user ID ${userId}`]
        );
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    const userId = req.params.id;
    try {
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'DELETE_USER', `Deleted user ID ${userId}`]
        );
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/logs', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT l.*, u.username 
            FROM user_logs l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🔐 Auth microservice running on port ${PORT}`);
});