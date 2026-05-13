const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./content.db', (err) => {
  if (err) {
    console.error('❌ Ошибка подключения к SQLite:', err.message);
  } else {
    console.log('✅ Подключен к SQLite базе данных');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      email TEXT,
      address TEXT,
      work_hours TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS about (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      version TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Исправленная проверка для contacts
  db.get("SELECT COUNT(*) as count FROM contacts", (err, row) => {
    if (err) {
      console.error('Ошибка проверки contacts:', err.message);
      return;
    }
    if (!row || row.count === 0) {
      db.run(`
        INSERT INTO contacts (phone, email, address, work_hours) VALUES 
        ('+7 (999) 123-45-67', 'support@music-manager.ru', 'г. Москва, пр. Вернадского, 78', 'Пн-Пт: 10:00 - 19:00')
      `, (err) => {
        if (err) console.error('Ошибка вставки contacts:', err.message);
        else console.log('✅ Добавлены начальные контакты');
      });
    }
  });

  // Исправленная проверка для about
  db.get("SELECT COUNT(*) as count FROM about", (err, row) => {
    if (err) {
      console.error('Ошибка проверки about:', err.message);
      return;
    }
    if (!row || row.count === 0) {
      db.run(`
        INSERT INTO about (title, content, version) VALUES 
        ('Music Manager', 'Система для управления музыкальными группами. Позволяет управлять группами, их репертуаром и гастрольной деятельностью.', '1.0.0')
      `, (err) => {
        if (err) console.error('Ошибка вставки about:', err.message);
        else console.log('✅ Добавлена начальная информация о проекте');
      });
    }
  });
}

// ============ API Endpoints ============

app.get('/api/contacts', (req, res) => {
  db.get("SELECT * FROM contacts WHERE id = 1", (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(row || {});
    }
  });
});

app.put('/api/contacts', (req, res) => {
  const { phone, email, address, work_hours } = req.body;
  db.run(
    `UPDATE contacts SET phone = ?, email = ?, address = ?, work_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
    [phone, email, address, work_hours],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        // Если нет записей, вставляем новую
        db.run(
          `INSERT INTO contacts (id, phone, email, address, work_hours) VALUES (1, ?, ?, ?, ?)`,
          [phone, email, address, work_hours],
          (err2) => {
            if (err2) res.status(500).json({ error: err2.message });
            else res.json({ message: 'Контакты созданы' });
          }
        );
      } else {
        res.json({ message: 'Контакты обновлены', changes: this.changes });
      }
    }
  );
});

app.get('/api/about', (req, res) => {
  db.get("SELECT * FROM about WHERE id = 1", (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(row || {});
    }
  });
});

app.put('/api/about', (req, res) => {
  const { title, content, version } = req.body;
  db.run(
    `UPDATE about SET title = ?, content = ?, version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
    [title, content, version],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        db.run(
          `INSERT INTO about (id, title, content, version) VALUES (1, ?, ?, ?)`,
          [title, content, version],
          (err2) => {
            if (err2) res.status(500).json({ error: err2.message });
            else res.json({ message: 'Информация создана' });
          }
        );
      } else {
        res.json({ message: 'Информация обновлена', changes: this.changes });
      }
    }
  );
});

app.get('/api/announcements', (req, res) => {
  db.all("SELECT * FROM announcements ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

app.post('/api/announcements', (req, res) => {
  const { title, content } = req.body;
  db.run(
    `INSERT INTO announcements (title, content) VALUES (?, ?)`,
    [title, content],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, message: 'Объявление добавлено' });
      }
    }
  );
});

app.delete('/api/announcements/:id', (req, res) => {
  db.run(`DELETE FROM announcements WHERE id = ?`, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Объявление удалено', changes: this.changes });
    }
  });
});

app.listen(PORT, () => {
  console.log(`📦 SQLite API сервер запущен на порту ${PORT}`);
});