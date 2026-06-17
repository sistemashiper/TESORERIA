import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN || ''
});

async function run() {
    try {
        // Add password column if it does not exist. SQLite will throw if column exists, so we catch and ignore.
        try {
            await db.execute({ sql: "ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT ''" });
            console.log('Columna password añadida.');
        } catch (e: any) {
            if (e.message && e.message.includes('duplicate column name')) {
                console.log('La columna password ya existe, continuando...');
            } else {
                throw e;
            }
        }

        // Remove any existing admin user
        await db.execute({ sql: "DELETE FROM users WHERE email = 'admin@corporativo.com'" });
        console.log('Usuario admin eliminado (si existía).');

        // Insert fresh admin user with default credentials
        await db.execute({
            sql: `INSERT INTO users (email, name, role, permissions, password) VALUES (?, ?, ?, ?, ?)`,
            args: ['admin@corporativo.com', 'Administrador', 'admin', 'all', 'admin']
        });
        console.log('Usuario admin creado con contraseña "admin".');
    } catch (err) {
        console.error('Error al ejecutar script de corrección:', err);
    } finally {
        // Close the client if needed (Turso client does not require explicit close)
        process.exit();
    }
}

run();

