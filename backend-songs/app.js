const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'music_manager',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

// Проверка подключения при старте
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
    } else {
        console.log('✅ Подключение к PostgreSQL успешно');
        release();
    }
});

// GET /songs - все песни
app.get('/songs', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
            FROM songs s 
            LEFT JOIN groups g ON s.group_id = g.id 
            ORDER BY s.id DESC
        `);
        console.log(`📀 Отдано ${result.rows.length} песен`);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Ошибка GET /songs:', err.message);
        res.status(500).json({ error: err.message, details: err.toString() });
    }
});

// GET /songs/:id
app.get('/songs/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
             FROM songs s 
             LEFT JOIN groups g ON s.group_id = g.id 
             WHERE s.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Song not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка GET /songs/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /songs/composer/:composerName
app.get('/songs/composer/:composerName', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
             FROM songs s 
             LEFT JOIN groups g ON s.group_id = g.id 
             WHERE s.composer ILIKE $1
             ORDER BY s.creation_year DESC`,
            [`%${req.params.composerName}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Ошибка GET /songs/composer:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /songs/singer/:singerName
app.get('/songs/singer/:singerName', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, COALESCE(g.name, 'Без группы') as group_name 
             FROM songs s 
             LEFT JOIN groups g ON s.group_id = g.id 
             WHERE s.singer ILIKE $1
             ORDER BY s.creation_year DESC`,
            [`%${req.params.singerName}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Ошибка GET /songs/singer:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /songs
app.post('/songs', async (req, res) => {
    const { title, composer, lyricist, creation_year, singer, group_id } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO songs (title, composer, lyricist, creation_year, singer, group_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, composer, lyricist, creation_year, singer, group_id || null]
        );
        console.log(`✅ Добавлена песня: ${title}`);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка POST /songs:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /songs/:id
app.put('/songs/:id', async (req, res) => {
    const { title, composer, lyricist, creation_year, singer, group_id } = req.body;
    try {
        const result = await pool.query(
            `UPDATE songs SET title=$1, composer=$2, lyricist=$3, creation_year=$4, singer=$5, group_id=$6 
             WHERE id=$7 RETURNING *`,
            [title, composer, lyricist, creation_year, singer, group_id || null, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Song not found' });
        }
        console.log(`✏️ Обновлена песня ID: ${req.params.id}`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка PUT /songs/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /songs/:id
app.delete('/songs/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM songs WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Song not found' });
        }
        console.log(`🗑️ Удалена песня ID: ${req.params.id}`);
        res.status(204).send();
    } catch (err) {
        console.error('❌ Ошибка DELETE /songs/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🎵 Songs microservice running on port ${PORT}`);
});