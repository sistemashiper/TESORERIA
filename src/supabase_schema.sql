-- ==========================================
-- SCRIPT DE CREACIÓN DE ESQUEMA EN SUPABASE
-- Contabilidad Pro / Sistema TESORERIA
-- ==========================================

-- 1. Tabla de usuarios (users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    permissions TEXT NOT NULL, -- Almacenará array JSON stringificado
    password TEXT NOT NULL DEFAULT ''
);

-- 2. Tabla de clientes (clients)
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    cedula TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    saldo_pendiente NUMERIC(15, 2) DEFAULT 0.0,
    estado_saldo TEXT DEFAULT 'Al Corriente',
    created_at TEXT NOT NULL
);

-- 3. Tabla de facturas (invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'PENDIENTE',
    description TEXT,
    is_urgente INTEGER DEFAULT 0
);

-- 4. Tabla de anticipos (advances)
CREATE TABLE IF NOT EXISTS advances (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    payment_type TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    rate_bcv NUMERIC(10, 4) NOT NULL,
    amount_bss NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'PENDIENTE_VALIDACION',
    registered_by TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 5. Tabla de imágenes de anticipos (advance_images)
CREATE TABLE IF NOT EXISTS advance_images (
    advance_id TEXT PRIMARY KEY REFERENCES advances(id) ON DELETE CASCADE,
    photo_base64 TEXT NOT NULL
);

-- 6. Tabla de conciliaciones aplicadas (applications)
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
    advance_id TEXT REFERENCES advances(id) ON DELETE SET NULL,
    amount_applied NUMERIC(15, 2) NOT NULL,
    amount_applied_bss NUMERIC(15, 2) NOT NULL,
    rate_bcv NUMERIC(10, 4) NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'PENDIENTE_AUDITORIA',
    audit_notes TEXT,
    created_at TEXT NOT NULL
);

-- 7. Tabla de sesiones de caja (caja_sessions)
CREATE TABLE IF NOT EXISTS caja_sessions (
    id SERIAL PRIMARY KEY,
    opened_by TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    initial_balance NUMERIC(15, 2) NOT NULL,
    status TEXT DEFAULT 'ABIERTA'
);

-- 8. Tabla de transacciones de caja (caja_transactions)
CREATE TABLE IF NOT EXISTS caja_transactions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES caja_sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    rate_bcv NUMERIC(10, 4) NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
);

-- 9. Tabla de cierres de caja (caja_closures)
CREATE TABLE IF NOT EXISTS caja_closures (
    id SERIAL PRIMARY KEY,
    session_id INTEGER UNIQUE REFERENCES caja_sessions(id) ON DELETE CASCADE,
    calculated_balance_bss NUMERIC(15, 2) NOT NULL,
    real_balance_bss NUMERIC(15, 2) NOT NULL,
    discrepancy_bss NUMERIC(15, 2) NOT NULL,
    closure_date TEXT NOT NULL,
    notes TEXT
);

-- ==========================================
-- SEED DE USUARIOS INICIALES (OPCIONAL SI SE INICIA DESDE CERO)
-- ==========================================
-- INSERT INTO users (email, name, role, permissions, password) VALUES 
-- ('admin@corporativo.com', 'Administrador Demo', 'Administrador', '["canRegisterClients", "canRegisterAdvances", "canVerifyAdvances", "canApplyAdvances", "canAuditApplications", "canManageCaja", "canAuditCaja", "canManageUsers"]', 'admin'),
-- ('ventas@corporativo.com', 'Vendedor Demo', 'Ventas', '["canRegisterClients", "canRegisterAdvances"]', 'admin'),
-- ('tesoreria@corporativo.com', 'Tesorero Demo', 'Tesoreria', '["canRegisterClients", "canRegisterAdvances", "canVerifyAdvances", "canApplyAdvances", "canManageCaja"]', 'admin'),
-- ('gerencia@corporativo.com', 'Gerente Demo', 'Gerencia', '["canRegisterClients", "canRegisterAdvances", "canVerifyAdvances", "canApplyAdvances", "canAuditApplications", "canManageCaja", "canAuditCaja", "canManageUsers"]', 'admin');
