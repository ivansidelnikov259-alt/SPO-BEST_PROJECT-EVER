const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2026-music-manager';

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'music_manager',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Токен не предоставлен' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Невалидный токен' });
    }
};

// GET /songs
app.get('/songs', verifyToken, async (req, res) => {
    try {
        let query;
        let params = [];
        
        if (req.user.role === 'admin') {
            query = `SELECT s.*, g.name as group_name FROM songs s LEFT JOIN groups g ON s.group_id = g.id ORDER BY s.id DESC`;
        } else {
            query = `
                SELECT DISTINCT s.*, (SELECT g2.name FROM groups g2 WHERE g2.id = s.group_id) as group_name
                FROM songs s
                LEFT JOIN song_collaborations sc ON s.id = sc.song_id
                WHERE s.created_by = $1 OR sc.group_id IN (SELECT id FROM groups WHERE created_by = $1)
                ORDER BY s.id DESC
            `;
            params = [req.user.id];
        }
        
        const result = await pool.query(query, params);
        const songsWithGroups = [];
        
        for (const song of result.rows) {
            const groupsRes = await pool.query(
                `SELECT g.id, g.name FROM song_collaborations sc JOIN groups g ON sc.group_id = g.id WHERE sc.song_id = $1`,
                [song.id]
            );
            let groups = groupsRes.rows;
            if (groups.length === 0 && song.group_id) {
                groups = [{ id: song.group_id, name: song.group_name }];
            }
            songsWithGroups.push({ ...song, groups, is_collaboration: groups.length > 1 });
        }
        res.json(songsWithGroups);
    } catch (err) {
        console.error('Error in /songs:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /songs/composer/:composerName
app.get('/songs/composer/:composerName', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, g.name as group_name FROM songs s LEFT JOIN groups g ON s.group_id = g.id WHERE s.composer ILIKE $1 ORDER BY s.creation_year DESC`,
            [`%${req.params.composerName}%`]
        );
        const songsWithGroups = [];
        for (const song of result.rows) {
            const groupsRes = await pool.query(`SELECT g.id, g.name FROM song_collaborations sc JOIN groups g ON sc.group_id = g.id WHERE sc.song_id = $1`, [song.id]);
            let groups = groupsRes.rows;
            if (groups.length === 0 && song.group_id) groups = [{ id: song.group_id, name: song.group_name }];
            songsWithGroups.push({ ...song, groups, is_collaboration: groups.length > 1 });
        }
        res.json(songsWithGroups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /songs/singer/:singerName
app.get('/songs/singer/:singerName', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, g.name as group_name FROM songs s LEFT JOIN groups g ON s.group_id = g.id WHERE s.singer ILIKE $1 ORDER BY s.creation_year DESC`,
            [`%${req.params.singerName}%`]
        );
        const songsWithGroups = [];
        for (const song of result.rows) {
            const groupsRes = await pool.query(`SELECT g.id, g.name FROM song_collaborations sc JOIN groups g ON sc.group_id = g.id WHERE sc.song_id = $1`, [song.id]);
            let groups = groupsRes.rows;
            if (groups.length === 0 && song.group_id) groups = [{ id: song.group_id, name: song.group_name }];
            songsWithGroups.push({ ...song, groups, is_collaboration: groups.length > 1 });
        }
        res.json(songsWithGroups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /songs/group/:groupId
app.get('/songs/group/:groupId', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, g.name as group_name FROM songs s LEFT JOIN groups g ON s.group_id = g.id WHERE s.group_id = $1 ORDER BY s.creation_year DESC`,
            [req.params.groupId]
        );
        const songsWithGroups = [];
        for (const song of result.rows) {
            const groupsRes = await pool.query(`SELECT g.id, g.name FROM song_collaborations sc JOIN groups g ON sc.group_id = g.id WHERE sc.song_id = $1`, [song.id]);
            let groups = groupsRes.rows;
            if (groups.length === 0 && song.group_id) groups = [{ id: song.group_id, name: song.group_name }];
            songsWithGroups.push({ ...song, groups, is_collaboration: groups.length > 1 });
        }
        res.json(songsWithGroups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /songs/:id
app.get('/songs/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`SELECT s.*, g.name as group_name FROM songs s LEFT JOIN groups g ON s.group_id = g.id WHERE s.id = $1`, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Song not found' });
        const song = result.rows[0];
        const groupsRes = await pool.query(`SELECT g.id, g.name FROM song_collaborations sc JOIN groups g ON sc.group_id = g.id WHERE sc.song_id = $1`, [req.params.id]);
        let groups = groupsRes.rows;
        if (groups.length === 0 && song.group_id) groups = [{ id: song.group_id, name: song.group_name }];
        res.json({ ...song, groups, is_collaboration: groups.length > 1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /songs
app.post('/songs', verifyToken, async (req, res) => {
    const { title, composer, lyricist, creation_year, singer, group_ids } = req.body;
    const groupIds = group_ids || [];
    if (groupIds.length === 0) return res.status(400).json({ error: 'Выберите хотя бы одну группу' });
    
    try {
        const primaryGroupId = groupIds[0];
        const result = await pool.query(
            `INSERT INTO songs (title, composer, lyricist, creation_year, singer, group_id, is_collaboration, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [title, composer, lyricist, creation_year, singer, primaryGroupId, groupIds.length > 1, req.user.id]
        );
        const newSong = result.rows[0];
        for (const gid of groupIds) {
            await pool.query(`INSERT INTO song_collaborations (song_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [newSong.id, gid]);
        }
        res.status(201).json(newSong);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /songs/:id
app.put('/songs/:id', verifyToken, async (req, res) => {
    const { title, composer, lyricist, creation_year, singer, group_ids } = req.body;
    const groupIds = group_ids || [];
    if (groupIds.length === 0) return res.status(400).json({ error: 'Выберите хотя бы одну группу' });
    
    try {
        const songCheck = await pool.query('SELECT created_by, group_id FROM songs WHERE id = $1', [req.params.id]);
        if (songCheck.rows.length === 0) return res.status(404).json({ error: 'Песня не найдена' });
        
        if (req.user.role !== 'admin') {
            // Получаем группы менеджера
            const userGroups = await pool.query('SELECT id FROM groups WHERE created_by = $1', [req.user.id]);
            const userGroupIds = userGroups.rows.map(g => g.id);
            
            // Получаем текущие группы песни
            const currentGroupsRes = await pool.query('SELECT group_id FROM song_collaborations WHERE song_id = $1', [req.params.id]);
            let currentGroupIds = currentGroupsRes.rows.map(r => r.group_id);
            if (currentGroupIds.length === 0 && songCheck.rows[0].group_id) {
                currentGroupIds = [songCheck.rows[0].group_id];
            }
            
            // Проверяем доступ: менеджер может редактировать, если он создатель ИЛИ его группа уже есть в песне
            const hasAccess = currentGroupIds.some(id => userGroupIds.includes(id)) || songCheck.rows[0].created_by === req.user.id;
            if (!hasAccess) {
                return res.status(403).json({ error: 'Нет доступа к этой песне' });
            }
            
            // Менеджер может добавлять ЛЮБЫЕ группы (свои и чужие) - НЕТ ДОПОЛНИТЕЛЬНЫХ ПРОВЕРОК!
        }
        
        const primaryGroupId = groupIds[0];
        await pool.query(
            `UPDATE songs SET title=$1, composer=$2, lyricist=$3, creation_year=$4, singer=$5, group_id=$6, is_collaboration=$7 WHERE id=$8`,
            [title, composer, lyricist, creation_year, singer, primaryGroupId, groupIds.length > 1, req.params.id]
        );
        await pool.query(`DELETE FROM song_collaborations WHERE song_id = $1`, [req.params.id]);
        for (const gid of groupIds) {
            await pool.query(`INSERT INTO song_collaborations (song_id, group_id) VALUES ($1, $2)`, [req.params.id, gid]);
        }
        res.json({ message: 'Песня обновлена' });
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /songs/:id
app.delete('/songs/:id', verifyToken, async (req, res) => {
    try {
        const songCheck = await pool.query('SELECT created_by FROM songs WHERE id = $1', [req.params.id]);
        if (songCheck.rows.length === 0) return res.status(404).json({ error: 'Песня не найдена' });
        
        if (req.user.role !== 'admin') {
            const userGroups = await pool.query('SELECT id FROM groups WHERE created_by = $1', [req.user.id]);
            const userGroupIds = userGroups.rows.map(g => g.id);
            
            const currentGroupsRes = await pool.query('SELECT group_id FROM song_collaborations WHERE song_id = $1', [req.params.id]);
            let currentGroupIds = currentGroupsRes.rows.map(r => r.group_id);
            if (currentGroupIds.length === 0 && songCheck.rows[0].group_id) {
                currentGroupIds = [songCheck.rows[0].group_id];
            }
            
            const hasAccess = currentGroupIds.some(id => userGroupIds.includes(id)) || songCheck.rows[0].created_by === req.user.id;
            if (!hasAccess) {
                return res.status(403).json({ error: 'Нет доступа' });
            }
        }
        
        await pool.query('DELETE FROM song_collaborations WHERE song_id = $1', [req.params.id]);
        await pool.query('DELETE FROM songs WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🎵 Songs microservice running on port ${PORT}`);
});