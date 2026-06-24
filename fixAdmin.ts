import { supabase } from './src/supabaseClient';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
    try {
        console.log('Restableciendo usuario administrador en Supabase...');

        // Eliminar usuario administrador existente
        const { error: deleteErr } = await supabase
            .from('users')
            .delete()
            .eq('email', 'admin@corporativo.com');

        if (deleteErr) {
            console.error('Error al eliminar admin existente:', deleteErr);
        } else {
            console.log('Usuario admin anterior eliminado (si existía).');
        }

        // Insertar usuario administrador con permisos totales
        const { error: insertErr } = await supabase
            .from('users')
            .insert([
                {
                    email: 'admin@corporativo.com',
                    name: 'Administrador',
                    role: 'admin',
                    permissions: JSON.stringify([
                        'canRegisterClients',
                        'canRegisterAdvances',
                        'canVerifyAdvances',
                        'canApplyAdvances',
                        'canAuditApplications',
                        'canManageCaja',
                        'canAuditCaja',
                        'canManageUsers'
                    ]),
                    password: 'admin'
                }
            ]);

        if (insertErr) {
            console.error('Error al crear usuario admin:', insertErr);
        } else {
            console.log('Usuario admin creado con éxito (Contraseña: admin).');
        }
    } catch (err) {
        console.error('Error inesperado al ejecutar script de corrección:', err);
    } finally {
        process.exit();
    }
}

run();

