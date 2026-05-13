const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('JWT_SECRET value:', process.env.JWT_SECRET);
const app = express();
const PORT = process.env.PORT || 8002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2025-music-manager';

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'music_manager',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

// Middleware для проверки токена
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Тестовый эндпоинт
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test endpoint works' });
});

// GET /songs - все песни
app.get('/songs', verifyToken, async (req, res) => {
    try {
        let query;
        let params = [];
        
        if (req.user.role === 'admin') {
            query = `
                SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
                FROM songs s 
                LEFT JOIN groups g ON s.group_id = g.id 
                ORDER BY s.id DESC
            `;
        } else {
            query = `
                SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
                FROM songs s 
                LEFT JOIN groups g ON s.group_id = g.id 
                WHERE s.created_by = $1
                ORDER BY s.id DESC
            `;
            params = [req.user.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /songs/group/:groupId
app.get('/songs/group/:groupId', verifyToken, async (req, res) => {
    try {
        const groupCheck = await pool.query(
            'SELECT created_by FROM groups WHERE id = $1',
            [req.params.groupId]
        );
        
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        if (req.user.role !== 'admin' && groupCheck.rows[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const result = await pool.query(
            `SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
             FROM songs s 
             LEFT JOIN groups g ON s.group_id = g.id 
             WHERE s.group_id = $1
             ORDER BY s.creation_year DESC`,
            [req.params.groupId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /songs/composer/:composerName
app.get('/songs/composer/:composerName', verifyToken, async (req, res) => {
    try {
        let query;
        let params;
        
        if (req.user.role === 'admin') {
            query = `
                SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
                FROM songs s 
                LEFT JOIN groups g ON s.group_id = g.id 
                WHERE s.composer ILIKE $1
                ORDER BY s.creation_year DESC
            `;
            params = [`%${req.params.composerName}%`];
        } else {
            query = `
                SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
                FROM songs s 
                LEFT JOIN groups g ON s.group_id = g.id 
                WHERE s.composer ILIKE $1 AND s.created_by = $2
                ORDER BY s.creation_year DESC
            `;
            params = [`%${req.params.composerName}%`, req.user.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /songs/singer/:singerName
app.get('/songs/singer/:singerName', verifyToken, async (req, res) => {
    try {
        let query;
        let params;
        
        if (req.user.role === 'admin') {
            query = `
                SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
                FROM songs s 
                LEFT JOIN groups g ON s.group_id = g.id 
                WHERE s.singer ILIKE $1
                ORDER BY s.creation_year DESC
            `;
            params = [`%${req.params.singerName}%`];
        } else {
            query = `
                SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
                FROM songs s 
                LEFT JOIN groups g ON s.group_id = g.id 
                WHERE s.singer ILIKE $1 AND s.created_by = $2
                ORDER BY s.creation_year DESC
            `;
            params = [`%${req.params.singerName}%`, req.user.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /songs
app.post('/songs', verifyToken, async (req, res) => {
    const { title, composer, lyricist, creation_year, singer, group_id } = req.body;
    
    try {
        if (group_id) {
            const groupCheck = await pool.query(
                'SELECT created_by FROM groups WHERE id = $1',
                [group_id]
            );
            
            if (groupCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Group not found' });
            }
            
            if (req.user.role !== 'admin' && groupCheck.rows[0].created_by !== req.user.id) {
                return res.status(403).json({ error: 'You can only add songs to your own groups' });
            }
        }
        
        const result = await pool.query(
            `INSERT INTO songs (title, composer, lyricist, creation_year, singer, group_id, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, composer, lyricist, creation_year, singer, group_id || null, req.user.id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /songs/:id
app.put('/songs/:id', verifyToken, async (req, res) => {
    const { title, composer, lyricist, creation_year, singer, group_id } = req.body;
    
    try {
        const songCheck = await pool.query(
            'SELECT created_by FROM songs WHERE id = $1',
            [req.params.id]
        );
        
        if (songCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Song not found' });
        }
        
        if (req.user.role !== 'admin' && songCheck.rows[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (group_id) {
            const groupCheck = await pool.query(
                'SELECT created_by FROM groups WHERE id = $1',
                [group_id]
            );
            
            if (groupCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Group not found' });
            }
            
            if (req.user.role !== 'admin' && groupCheck.rows[0].created_by !== req.user.id) {
                return res.status(403).json({ error: 'You can only assign songs to your own groups' });
            }
        }
        
        const result = await pool.query(
            `UPDATE songs SET title=$1, composer=$2, lyricist=$3, creation_year=$4, singer=$5, group_id=$6 
             WHERE id=$7 RETURNING *`,
            [title, composer, lyricist, creation_year, singer, group_id || null, req.params.id]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /songs/:id
app.delete('/songs/:id', verifyToken, async (req, res) => {
    try {
        const songCheck = await pool.query(
            'SELECT created_by FROM songs WHERE id = $1',
            [req.params.id]
        );
        
        if (songCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Song not found' });
        }
        
        if (req.user.role !== 'admin' && songCheck.rows[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await pool.query('DELETE FROM songs WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🎵 Songs microservice running on port ${PORT}`);
    console.log(`JWT_SECRET set: ${JWT_SECRET ? 'Yes' : 'No'}`);
});