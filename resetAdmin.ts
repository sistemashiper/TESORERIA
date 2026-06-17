import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN || ''
});

async function resetAdmin() {
    // Delete existing admin user if present
    await db.execute({ sql: "DELETE FROM users WHERE email = 'admin@corporativo.com'" });
    // Insert fresh admin user with default credentials
    await db.execute({
        sql: `INSERT INTO users (email, name, role, permissions, password) VALUES (?, ?, ?, ?, ?)`,
        args: ['admin@corporativo.com', 'Administrador', 'admin', 'all', 'admin']
    });
    console.log('Admin user has been reset');
}

resetAdmin().catch((err) => {
    console.error('Error resetting admin user:', err);
});

