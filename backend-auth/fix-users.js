const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'music_manager',
    user: 'postgres',
    password: 'postgres',
});

async function fixUsers() {
    try {
        // Создаём новые хеши
        const adminHash = await bcrypt.hash('admin123', 10);
        const managerHash = await bcrypt.hash('manager123', 10);
        
        console.log('📝 Новые хеши:');
        console.log('admin hash:', adminHash);
        console.log('manager hash:', managerHash);
        
        // Очищаем таблицу users
        await pool.query('DELETE FROM users');
        console.log('✅ Старые пользователи удалены');
        
        // Создаём новых пользователей
        await pool.query(
            `INSERT INTO users (username, password_hash, role, is_active) 
             VALUES ($1, $2, $3, $4)`,
            ['admin', adminHash, 'admin', true]
        );
        
        await pool.query(
            `INSERT INTO users (username, password_hash, role, is_active) 
             VALUES ($1, $2, $3, $4)`,
            ['manager', managerHash, 'manager', true]
        );
        
        console.log('✅ Новые пользователи созданы');
        
        // Проверяем
        const result = await pool.query('SELECT id, username, role, is_active FROM users');
        console.log('📋 Пользователи в БД:', result.rows);
        
        // Тестируем вход
        const testAdmin = await bcrypt.compare('admin123', adminHash);
        const testManager = await bcrypt.compare('manager123', managerHash);
        
        console.log('✅ Тест admin123:', testAdmin);
        console.log('✅ Тест manager123:', testManager);
        
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
    } finally {
        await pool.end();
    }
}

fixUsers();