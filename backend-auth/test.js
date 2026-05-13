const bcrypt = require('bcrypt');

const adminHash = '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mqr7Kp9FqoaC7rUq.LkKZf5XkFqZzWG';

async function test() {
    const result = await bcrypt.compare('admin123', adminHash);
    console.log('Result:', result);
}

test();