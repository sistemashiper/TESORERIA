// import { createClient } from '@libsql/client'; // Turso client disabled
import * as dotenv from 'dotenv';

dotenv.config();

// Turso client disabled. Supabase client can be used here if needed.
const db: any = null;

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

