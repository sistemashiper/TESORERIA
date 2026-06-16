import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import { Client, Invoice, Advance, Application, User, CajaSession, CajaTransaction, CajaClosure } from './src/types';
import { initialClients, initialInvoices, initialAdvances, initialApplications } from './src/initialData';

dotenv.config();

// Initialize Turso client (uses local file-based database for development, remote cloud DB in production)
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Exchange rates (kept in memory for live session simulation)
let exchangeRatesState = {
  BCV: 36.50,
  EUR: 39.20,
  Binance: 37.10,
  Peso: 0.0090, // COP a BSS
  Personal: 38.00,
  lastUpdated: new Date().toISOString().split('T')[0]
};

// Helper to simulate daily exchange rate updates
function updateRatesDaily() {
  const today = new Date().toISOString().split('T')[0];
  if (exchangeRatesState.lastUpdated !== today) {
    exchangeRatesState.BCV = +(36.00 + Math.random() * 1.5).toFixed(2);
    exchangeRatesState.EUR = +(exchangeRatesState.BCV * 1.08).toFixed(2);
    exchangeRatesState.Binance = +(exchangeRatesState.BCV + 0.5 + Math.random() * 0.4).toFixed(2);
    exchangeRatesState.Peso = +(0.0085 + Math.random() * 0.001).toFixed(4);
    exchangeRatesState.lastUpdated = today;
  }
}

async function initializeDatabase() {
  console.log('Inicializando base de datos SQLite / Turso...');
  
  // 1. Crear tabla users
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions TEXT NOT NULL
    )
  `);

  // 2. Crear tabla clients
  await db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      cedula TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      saldo_pendiente REAL DEFAULT 0.0,
      estado_saldo TEXT DEFAULT 'Al Corriente',
      created_at TEXT NOT NULL
    )
  `);

  // 3. Crear tabla invoices
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'PENDIENTE',
      description TEXT,
      is_urgente INTEGER DEFAULT 0
    )
  `);

  // 4. Crear tabla advances
  await db.execute(`
    CREATE TABLE IF NOT EXISTS advances (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
      reference TEXT NOT NULL,
      payment_type TEXT NOT NULL,
      amount REAL NOT NULL,
      rate_bcv REAL NOT NULL,
      amount_bss REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'PENDIENTE_VALIDACION',
      registered_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // 5. Crear tabla advance_images (Separada para rendimiento)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS advance_images (
      advance_id TEXT PRIMARY KEY REFERENCES advances(id) ON DELETE CASCADE,
      photo_base64 TEXT NOT NULL
    )
  `);

  // 6. Crear tabla applications
  await db.execute(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      invoice_id TEXT REFERENCES invoices(id),
      advance_id TEXT REFERENCES advances(id),
      amount_applied REAL NOT NULL,
      amount_applied_bss REAL NOT NULL,
      rate_bcv REAL NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'PENDIENTE_AUDITORIA',
      audit_notes TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // 7. Crear tabla caja_sessions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS caja_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opened_by TEXT NOT NULL,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      initial_balance REAL NOT NULL,
      status TEXT DEFAULT 'ABIERTA'
    )
  `);

  // 8. Crear tabla caja_transactions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS caja_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES caja_sessions(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      currency TEXT NOT NULL,
      amount REAL NOT NULL,
      rate_bcv REAL NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // 9. Crear tabla caja_closures
  await db.execute(`
    CREATE TABLE IF NOT EXISTS caja_closures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER UNIQUE REFERENCES caja_sessions(id),
      calculated_balance_bss REAL NOT NULL,
      real_balance_bss REAL NOT NULL,
      discrepancy_bss REAL NOT NULL,
      closure_date TEXT NOT NULL,
      notes TEXT
    )
  `);

  console.log('Tablas inicializadas en SQLite/Turso.');

  // Siembra de datos si la tabla users está vacía
  const userCheck = await db.execute('SELECT count(*) as count FROM users');
  const count = Number(userCheck.rows[0].count);

  if (count === 0) {
    console.log('Sembrando datos por defecto en base de datos vacía...');
    
    // Sembrar usuarios
    const usersSeed = [
      { email: 'ventas@corporativo.com', name: 'Vendedor Demo', role: 'Ventas', permissions: JSON.stringify(['canRegisterClients', 'canRegisterAdvances']) },
      { email: 'tesoreria@corporativo.com', name: 'Tesorero Demo', role: 'Tesoreria', permissions: JSON.stringify(['canRegisterClients', 'canRegisterAdvances', 'canVerifyAdvances', 'canApplyAdvances', 'canManageCaja']) },
      { email: 'gerencia@corporativo.com', name: 'Gerente Demo', role: 'Gerencia', permissions: JSON.stringify(['canRegisterClients', 'canRegisterAdvances', 'canVerifyAdvances', 'canApplyAdvances', 'canAuditApplications', 'canManageCaja', 'canAuditCaja', 'canManageUsers']) },
      { email: 'admin@corporativo.com', name: 'Administrador Demo', role: 'Administrador', permissions: JSON.stringify(['canRegisterClients', 'canRegisterAdvances', 'canVerifyAdvances', 'canApplyAdvances', 'canAuditApplications', 'canManageCaja', 'canAuditCaja', 'canManageUsers']) }
    ];

    for (const u of usersSeed) {
      await db.execute({
        sql: 'INSERT INTO users (email, name, role, permissions) VALUES (?, ?, ?, ?)',
        args: [u.email, u.name, u.role, u.permissions]
      });
    }

    // Sembrar clientes
    const initialClientsSeed = initialClients.map((c, i) => ({
      id: c.id,
      cedula: c.rfc || `V-20${123456 + i}`,
      name: c.name,
      category: c.category || 'Corporativo',
      address: c.address || '',
      phone: c.phone || '',
      email: c.email || '',
      saldo_pendiente: 0.0,
      estado_saldo: 'Al Corriente',
      created_at: new Date().toISOString().split('T')[0]
    }));

    for (const c of initialClientsSeed) {
      await db.execute({
        sql: 'INSERT INTO clients (id, cedula, name, category, address, phone, email, saldo_pendiente, estado_saldo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [c.id, c.cedula, c.name, c.category, c.address, c.phone, c.email, c.saldo_pendiente, c.estado_saldo, c.created_at]
      });
    }

    // Sembrar invoices
    for (const inv of initialInvoices) {
      await db.execute({
        sql: 'INSERT INTO invoices (id, client_id, amount, remaining_amount, date, status, description, is_urgente) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [inv.id, inv.clientId, inv.amount, inv.remainingAmount, inv.date, inv.status, inv.description || '', inv.isUrgente ? 1 : 0]
      });
    }

    // Sembrar advances
    const initialAdvancesSeed = initialAdvances.map(a => ({
      id: a.id,
      client_id: a.clientId,
      reference: a.reference,
      payment_type: 'Zelle',
      amount: a.amount,
      rate_bcv: 36.50,
      amount_bss: a.amount * 36.50,
      remaining_amount: a.amount,
      description: a.description || '',
      date: a.date,
      status: 'DISPONIBLE',
      registered_by: 'ventas@corporativo.com',
      created_at: new Date().toISOString()
    }));

    for (const adv of initialAdvancesSeed) {
      await db.execute({
        sql: 'INSERT INTO advances (id, client_id, reference, payment_type, amount, rate_bcv, amount_bss, remaining_amount, description, date, status, registered_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [adv.id, adv.client_id, adv.reference, adv.payment_type, adv.amount, adv.rate_bcv, adv.amount_bss, adv.remaining_amount, adv.description, adv.date, adv.status, adv.registered_by, adv.created_at]
      });
    }

    console.log('Siembra de datos completada.');
  }
}

// Initialize Turso database asynchronously in the background
initializeDatabase().catch(console.error);

export const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Rates API
  app.get('/api/rates/bcv', (req, res) => {
    updateRatesDaily();
    res.json(exchangeRatesState);
  });

  // Auth endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const userRes = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      });
      if (userRes.rows.length > 0 && password) {
        const row = userRes.rows[0];
        res.json({
          success: true,
          user: {
            email: row.email,
            name: row.name,
            role: row.role,
            permissions: JSON.parse(row.permissions as string)
          }
        });
      } else {
        res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // User management endpoints
  app.get('/api/auth/users', async (req, res) => {
    try {
      const usersRes = await db.execute('SELECT * FROM users');
      const users = usersRes.rows.map(r => ({
        email: r.email,
        name: r.name,
        role: r.role,
        permissions: JSON.parse(r.permissions as string)
      }));
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/register-user', async (req, res) => {
    try {
      const { email, name, role, permissions } = req.body;
      if (!email || !name || !role) {
        return res.status(400).json({ error: 'Correo, Nombre y Rol son obligatorios.' });
      }
      const exists = await db.execute({
        sql: 'SELECT email FROM users WHERE email = ?',
        args: [email]
      });
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: 'El usuario ya existe.' });
      }
      const perms = permissions || [];
      await db.execute({
        sql: 'INSERT INTO users (email, name, role, permissions) VALUES (?, ?, ?, ?)',
        args: [email, name, role, JSON.stringify(perms)]
      });
      res.status(201).json({ email, name, role, permissions: perms });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/update-user-permissions', async (req, res) => {
    try {
      const { email, permissions } = req.body;
      const userRes = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      });
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
      await db.execute({
        sql: 'UPDATE users SET permissions = ? WHERE email = ?',
        args: [JSON.stringify(permissions), email]
      });
      res.json({ email, permissions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Full database fetch
  app.get('/api/database', async (req, res) => {
    try {
      // 1. Fetch Clients
      const clientsRes = await db.execute('SELECT * FROM clients');
      const clients = clientsRes.rows.map(r => ({
        id: r.id as string,
        cedula: r.cedula as string,
        name: r.name as string,
        rfc: r.cedula as string,
        category: r.category as string,
        address: r.address as string || '',
        phone: r.phone as string || '',
        email: r.email as string || '',
        saldoPendiente: Number(r.saldo_pendiente),
        estadoSaldo: r.estado_saldo as string,
        ultimoPago: 'Hoy, Registro',
        createdAt: r.created_at as string
      }));

      // 2. Fetch Invoices
      const invoicesRes = await db.execute(`
        SELECT invoices.*, clients.name AS client_name 
        FROM invoices 
        LEFT JOIN clients ON invoices.client_id = clients.id
      `);
      const invoices = invoicesRes.rows.map(r => ({
        id: r.id as string,
        clientId: r.client_id as string,
        clientName: r.client_name as string,
        reference: r.id as string,
        amount: Number(r.amount),
        remainingAmount: Number(r.remaining_amount),
        date: r.date as string,
        status: r.status as string,
        description: r.description as string || '',
        isUrgente: r.is_urgente === 1
      }));

      // 3. Fetch Advances (with photoUrl joined from advance_images table)
      const advancesRes = await db.execute(`
        SELECT advances.*, clients.name AS client_name, advance_images.photo_base64 AS photo_url 
        FROM advances 
        LEFT JOIN clients ON advances.client_id = clients.id
        LEFT JOIN advance_images ON advances.id = advance_images.advance_id
      `);
      const advances = advancesRes.rows.map(r => ({
        id: r.id as string,
        clientId: r.client_id as string,
        clientName: r.client_name as string,
        reference: r.reference as string,
        paymentType: r.payment_type as string,
        rateType: 'BCV',
        amount: Number(r.amount),
        rateBCV: Number(r.rate_bcv),
        amountInBSS: Number(r.amount_bss),
        remainingAmount: Number(r.remaining_amount),
        date: r.date as string,
        status: r.status as string,
        description: r.description as string || '',
        photoUrl: r.photo_url as string || '',
        registeredBy: r.registered_by as string
      }));

      // 4. Fetch Applications
      const appsRes = await db.execute(`
        SELECT 
          applications.*, 
          invoices.id AS invoice_reference, 
          advances.reference AS advance_reference,
          clients.name AS client_name
        FROM applications
        LEFT JOIN invoices ON applications.invoice_id = invoices.id
        LEFT JOIN advances ON applications.advance_id = advances.id
        LEFT JOIN clients ON advances.client_id = clients.id
      `);
      const applications = appsRes.rows.map(r => ({
        id: r.id as string,
        invoiceId: r.invoice_id as string,
        invoiceReference: r.invoice_reference as string,
        advanceId: r.advance_id as string,
        advanceReference: r.advance_reference as string,
        clientName: r.client_name as string,
        amountApplied: Number(r.amount_applied),
        amountAppliedBSS: Number(r.amount_applied_bss),
        rateBCV: Number(r.rate_bcv),
        date: r.date as string,
        status: r.status as string,
        auditNotes: r.audit_notes as string || ''
      }));

      res.json({ clients, invoices, advances, applications });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create client (includes Cédula)
  app.post('/api/clients', async (req, res) => {
    try {
      const { name, rfc, category, address, phone, email, cedula } = req.body;
      if (!name || !cedula) {
        return res.status(400).json({ error: 'Nombre y Cédula son obligatorios.' });
      }

      // Check if client with this cedula already exists
      const exists = await db.execute({
        sql: 'SELECT id FROM clients WHERE cedula = ?',
        args: [cedula]
      });
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe un cliente registrado con esta Cédula.' });
      }

      const newId = `C-${Math.floor(10000 + Math.random() * 90000)}`;
      const createdAt = new Date().toISOString().split('T')[0];

      await db.execute({
        sql: `INSERT INTO clients (id, cedula, name, category, address, phone, email, saldo_pendiente, estado_saldo, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 0.0, 'Al Corriente', ?)`,
        args: [newId, cedula, name, category || 'Corporativo', address || '', phone || '', email || '', createdAt]
      });

      const newClient = {
        id: newId,
        cedula,
        name,
        rfc: rfc || cedula,
        category: category || 'Corporativo',
        address: address || '',
        phone: phone || '',
        email: email || '',
        saldoPendiente: 0,
        estadoSaldo: 'Al Corriente',
        ultimoPago: 'Hoy, Registro',
        createdAt
      };

      res.status(201).json(newClient);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create dynamic registers (Invoice or Advance)
  app.post('/api/transactions', async (req, res) => {
    try {
      const { type, clientId, amount, date, reference, description, isUrgente, paymentType, rateType, rateBCV, amountInBSS, photoUrl, registeredBy } = req.body;
      if (!clientId || !amount || !reference) {
        return res.status(400).json({ error: 'Cliente, Monto y Referencia son obligatorios.' });
      }

      const clientRes = await db.execute({
        sql: 'SELECT * FROM clients WHERE id = ?',
        args: [clientId]
      });
      if (clientRes.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado.' });
      }
      const clientRow = clientRes.rows[0];

      const numericAmount = parseFloat(amount);
      const txDate = date || new Date().toISOString().split('T')[0];

      if (type === 'factura') {
        const tx = await db.transaction('write');
        try {
          const invExists = await tx.execute({
            sql: 'SELECT id FROM invoices WHERE id = ?',
            args: [reference]
          });
          if (invExists.rows.length > 0) {
            throw new Error('Ya existe una factura con esta referencia/ID.');
          }

          await tx.execute({
            sql: 'INSERT INTO invoices (id, client_id, amount, remaining_amount, date, status, description, is_urgente) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            args: [reference, clientId, numericAmount, numericAmount, txDate, 'PENDIENTE', description || '', isUrgente ? 1 : 0]
          });

          const newPending = Number(clientRow.saldo_pendiente) + numericAmount;
          await tx.execute({
            sql: "UPDATE clients SET saldo_pendiente = ?, estado_saldo = 'En Revisión' WHERE id = ?",
            args: [newPending, clientId]
          });
          await tx.commit();
        } catch (err) {
          await tx.rollback();
          throw err;
        } finally {
          tx.close();
        }

        const newInvoice: Invoice = {
          id: reference,
          clientId,
          clientName: clientRow.name as string,
          reference,
          amount: numericAmount,
          remainingAmount: numericAmount,
          date: txDate,
          status: 'PENDIENTE',
          description: description || '',
          isUrgente: !!isUrgente
        };

        res.status(201).json({ type: 'factura', transaction: newInvoice });
      } else {
        const parsedRate = parseFloat(rateBCV) || 36.50;
        const calcBSS = parseFloat(amountInBSS) || (numericAmount * parsedRate);

        const tx = await db.transaction('write');
        try {
          const advExists = await tx.execute({
            sql: 'SELECT id FROM advances WHERE id = ?',
            args: [reference]
          });
          if (advExists.rows.length > 0) {
            throw new Error('Ya existe un anticipo con esta referencia/ID.');
          }

          await tx.execute({
            sql: `INSERT INTO advances (id, client_id, reference, payment_type, amount, rate_bcv, amount_bss, remaining_amount, description, date, status, registered_by, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_VALIDACION', ?, ?)`,
            args: [reference, clientId, reference, paymentType || 'Zelle', numericAmount, parsedRate, calcBSS, numericAmount, description || '', txDate, registeredBy || 'ventas@corporativo.com', new Date().toISOString()]
          });

          if (photoUrl) {
            await tx.execute({
              sql: 'INSERT INTO advance_images (advance_id, photo_base64) VALUES (?, ?)',
              args: [reference, photoUrl]
            });
          }
          await tx.commit();
        } catch (err) {
          await tx.rollback();
          throw err;
        } finally {
          tx.close();
        }

        const newAdvance: Advance = {
          id: reference,
          clientId,
          clientName: clientRow.name as string,
          reference,
          paymentType: paymentType || 'Zelle',
          rateType: rateType || 'BCV',
          amount: numericAmount,
          rateBCV: parsedRate,
          amountInBSS: calcBSS,
          remainingAmount: numericAmount,
          date: txDate,
          status: 'PENDIENTE_VALIDACION',
          description: description || '',
          photoUrl: photoUrl || '',
          registeredBy: registeredBy || 'ventas@corporativo.com'
        };

        res.status(201).json({ type: 'anticipo', transaction: newAdvance });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Verify and Approve Advance by Treasury
  app.post('/api/transactions/advances/:id/verify', async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, paymentType, rateBCV, amountInBSS, reference, description } = req.body;

      const advRes = await db.execute({
        sql: 'SELECT * FROM advances WHERE id = ?',
        args: [id]
      });
      if (advRes.rows.length === 0) {
        return res.status(404).json({ error: 'Anticipo no encontrado.' });
      }
      const advRow = advRes.rows[0];

      const newAmount = amount !== undefined ? parseFloat(amount) : Number(advRow.amount);
      const newRate = rateBCV !== undefined ? parseFloat(rateBCV) : Number(advRow.rate_bcv);
      const newBSS = amountInBSS !== undefined ? parseFloat(amountInBSS) : (newAmount * newRate);
      const newRef = reference || (advRow.reference as string);
      const newDesc = description !== undefined ? description : (advRow.description as string || '');
      const newPaymentType = paymentType || (advRow.payment_type as string);

      await db.execute({
        sql: `UPDATE advances 
              SET amount = ?, remaining_amount = ?, rate_bcv = ?, amount_bss = ?, reference = ?, description = ?, payment_type = ?, status = 'DISPONIBLE'
              WHERE id = ?`,
        args: [newAmount, newAmount, newRate, newBSS, newRef, newDesc, newPaymentType, id]
      });

      const clientRes = await db.execute({
        sql: 'SELECT name FROM clients WHERE id = ?',
        args: [advRow.client_id]
      });
      const clientName = clientRes.rows[0]?.name as string || '';

      const updatedAdvance = {
        id,
        clientId: advRow.client_id as string,
        clientName,
        reference: newRef,
        paymentType: newPaymentType,
        rateType: 'BCV',
        amount: newAmount,
        rateBCV: newRate,
        amountInBSS: newBSS,
        remainingAmount: newAmount,
        date: advRow.date as string,
        status: 'DISPONIBLE',
        description: newDesc,
        registeredBy: advRow.registered_by as string
      };

      res.json({ success: true, advance: updatedAdvance });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reject raw advance by Treasury
  app.post('/api/transactions/advances/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const advRes = await db.execute({
        sql: 'SELECT * FROM advances WHERE id = ?',
        args: [id]
      });
      if (advRes.rows.length === 0) {
        return res.status(404).json({ error: 'Anticipo no encontrado.' });
      }
      await db.execute({
        sql: "UPDATE advances SET status = 'RECHAZADO' WHERE id = ?",
        args: [id]
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manual applied reconciliation register by Treasury
  app.post('/api/reconciliation/apply-manual', async (req, res) => {
    try {
      const { clientId, invoiceId, advanceId, amountApplied, date, rateBCV } = req.body;
      if (!clientId || !invoiceId || !advanceId || !amountApplied) {
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }

      const clientRes = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [clientId] });
      const invoiceRes = await db.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [invoiceId] });
      const advanceRes = await db.execute({ sql: 'SELECT * FROM advances WHERE id = ?', args: [advanceId] });

      if (clientRes.rows.length === 0 || invoiceRes.rows.length === 0 || advanceRes.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente, factura o anticipo no encontrado.' });
      }

      const client = clientRes.rows[0];
      const invoice = invoiceRes.rows[0];
      const advance = advanceRes.rows[0];

      const numAmount = parseFloat(amountApplied);
      const numRate = parseFloat(rateBCV) || Number(advance.rate_bcv);
      const numBSS = numAmount * numRate;
      const appId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;
      const appDate = date || new Date().toISOString().split('T')[0];

      const tx = await db.transaction('write');
      try {
        await tx.execute({
          sql: `INSERT INTO applications (id, invoice_id, advance_id, amount_applied, amount_applied_bss, rate_bcv, date, status, audit_notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_AUDITORIA', '', ?)`,
          args: [appId, invoiceId, advanceId, numAmount, numBSS, numRate, appDate, new Date().toISOString()]
        });

        const invRemaining = Math.max(0, Number(invoice.remaining_amount) - numAmount);
        const invStatus = invRemaining <= 0 ? 'PAGADO' : 'PENDIENTE';
        await tx.execute({
          sql: 'UPDATE invoices SET remaining_amount = ?, status = ? WHERE id = ?',
          args: [invRemaining, invStatus, invoiceId]
        });

        const advRemaining = Math.max(0, Number(advance.remaining_amount) - numAmount);
        const advStatus = advRemaining <= 0 ? 'APLICADO' : 'DISPONIBLE';
        await tx.execute({
          sql: 'UPDATE advances SET remaining_amount = ?, status = ? WHERE id = ?',
          args: [advRemaining, advStatus, advanceId]
        });

        const cliPending = Math.max(0, Number(client.saldo_pendiente) - numAmount);
        const cliStatus = cliPending === 0 ? 'Al Corriente' : 'En Revisión';
        await tx.execute({
          sql: 'UPDATE clients SET saldo_pendiente = ?, estado_saldo = ? WHERE id = ?',
          args: [cliPending, cliStatus, clientId]
        });
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        throw err;
      } finally {
        tx.close();
      }

      const newApp: Application = {
        id: appId,
        invoiceId,
        invoiceReference: invoice.id as string,
        advanceId,
        advanceReference: advance.reference as string,
        clientName: client.name as string,
        amountApplied: numAmount,
        amountAppliedBSS: numBSS,
        rateBCV: numRate,
        date: appDate,
        status: 'PENDIENTE_AUDITORIA',
        auditNotes: ''
      };

      res.status(201).json({ success: true, application: newApp });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Audit application by Gerencia (Approve/Reject)
  app.post('/api/transactions/applications/:id/audit', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, auditNotes } = req.body;

      const appRes = await db.execute({
        sql: 'SELECT * FROM applications WHERE id = ?',
        args: [id]
      });
      if (appRes.rows.length === 0) {
        return res.status(404).json({ error: 'Aplicación no encontrada.' });
      }
      const appRecord = appRes.rows[0];

      const tx = await db.transaction('write');
      try {
        await tx.execute({
          sql: 'UPDATE applications SET status = ?, audit_notes = ? WHERE id = ?',
          args: [status, auditNotes || '', id]
        });

        if (status === 'RECHAZADO') {
          const invRes = await tx.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [appRecord.invoice_id] });
          if (invRes.rows.length > 0) {
            const invoice = invRes.rows[0];
            const newRemaining = Number(invoice.remaining_amount) + Number(appRecord.amount_applied);
            await tx.execute({
              sql: "UPDATE invoices SET remaining_amount = ?, status = 'PENDIENTE' WHERE id = ?",
              args: [newRemaining, appRecord.invoice_id]
            });
          }

          const advRes = await tx.execute({ sql: 'SELECT * FROM advances WHERE id = ?', args: [appRecord.advance_id] });
          if (advRes.rows.length > 0) {
            const advance = advRes.rows[0];
            const newRemaining = Number(advance.remaining_amount) + Number(appRecord.amount_applied);
            await tx.execute({
              sql: "UPDATE advances SET remaining_amount = ?, status = 'DISPONIBLE' WHERE id = ?",
              args: [newRemaining, appRecord.advance_id]
            });

            const cliRes = await tx.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [advance.client_id] });
            if (cliRes.rows.length > 0) {
              const client = cliRes.rows[0];
              const newPending = Number(client.saldo_pendiente) + Number(appRecord.amount_applied);
              await tx.execute({
                sql: "UPDATE clients SET saldo_pendiente = ?, estado_saldo = 'En Revisión' WHERE id = ?",
                args: [newPending, advance.client_id]
              });
            }
          }
        }
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        throw err;
      } finally {
        tx.close();
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Resubmit rejected application with adjustments by Treasury
  app.post('/api/transactions/applications/:id/resubmit', async (req, res) => {
    try {
      const { id } = req.params;
      const { amountApplied, rateBCV } = req.body;

      const appRes = await db.execute({
        sql: "SELECT * FROM applications WHERE id = ? AND status = 'RECHAZADO'",
        args: [id]
      });
      if (appRes.rows.length === 0) {
        return res.status(400).json({ error: 'Registro rechazado no encontrado.' });
      }
      const appRecord = appRes.rows[0];

      const numAmount = parseFloat(amountApplied);
      const numRate = parseFloat(rateBCV);
      const numBSS = numAmount * numRate;

      await db.transaction('write', async (tx) => {
        const invRes = await tx.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [appRecord.invoice_id] });
        const advRes = await tx.execute({ sql: 'SELECT * FROM advances WHERE id = ?', args: [appRecord.advance_id] });
        
        if (invRes.rows.length > 0 && advRes.rows.length > 0) {
          const invoice = invRes.rows[0];
          const advance = advRes.rows[0];

          const oldApplied = Number(appRecord.amount_applied);
          const tempInvoiceRemaining = Number(invoice.remaining_amount) + oldApplied;
          const tempAdvanceRemaining = Number(advance.remaining_amount) + oldApplied;

          const newInvoiceRemaining = Math.max(0, tempInvoiceRemaining - numAmount);
          const invStatus = newInvoiceRemaining <= 0 ? 'PAGADO' : 'PENDIENTE';
          await tx.execute({
            sql: 'UPDATE invoices SET remaining_amount = ?, status = ? WHERE id = ?',
            args: [newInvoiceRemaining, invStatus, appRecord.invoice_id]
          });

          const newAdvanceRemaining = Math.max(0, tempAdvanceRemaining - numAmount);
          const advStatus = newAdvanceRemaining <= 0 ? 'APLICADO' : 'DISPONIBLE';
          await tx.execute({
            sql: 'UPDATE advances SET remaining_amount = ?, status = ? WHERE id = ?',
            args: [newAdvanceRemaining, advStatus, appRecord.advance_id]
          });

          const cliRes = await tx.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [advance.client_id] });
          if (cliRes.rows.length > 0) {
            const client = cliRes.rows[0];
            const tempPending = Number(client.saldo_pendiente) + oldApplied;
            const newPending = Math.max(0, tempPending - numAmount);
            const cliStatus = newPending === 0 ? 'Al Corriente' : 'En Revisión';
            await tx.execute({
              sql: 'UPDATE clients SET saldo_pendiente = ?, estado_saldo = ? WHERE id = ?',
              args: [newPending, cliStatus, advance.client_id]
            });
          }
        }

        await tx.execute({
          sql: "UPDATE applications SET amount_applied = ?, amount_applied_bss = ?, rate_bcv = ?, status = 'PENDIENTE_AUDITORIA', audit_notes = 'Reenviado con ajustes' WHERE id = ?",
          args: [numAmount, numBSS, numRate, id]
        });
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(550).json({ error: err.message });
    }
  });

  // Caja Endpoints
  app.get('/api/caja/session/current', async (req, res) => {
    try {
      const activeRes = await db.execute({
        sql: "SELECT * FROM caja_sessions WHERE status = 'ABIERTA' ORDER BY id DESC LIMIT 1"
      });
      if (activeRes.rows.length > 0) {
        const row = activeRes.rows[0];
        const session = {
          id: Number(row.id),
          openedBy: row.opened_by as string,
          openedAt: row.opened_at as string,
          closedAt: row.closed_at as string || null,
          initialBalance: Number(row.initial_balance),
          status: row.status as string
        };
        res.json({ active: true, session });
      } else {
        res.json({ active: false });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/caja/sessions', async (req, res) => {
    try {
      const sessionsRes = await db.execute('SELECT * FROM caja_sessions');
      const sessions = sessionsRes.rows.map(r => ({
        id: Number(r.id),
        openedBy: r.opened_by as string,
        openedAt: r.opened_at as string,
        closedAt: r.closed_at as string || null,
        initialBalance: Number(r.initial_balance),
        status: r.status as string
      }));

      const txsRes = await db.execute('SELECT * FROM caja_transactions');
      const transactions = txsRes.rows.map(r => ({
        id: Number(r.id),
        sessionId: Number(r.session_id),
        type: r.type as string,
        paymentMethod: r.payment_method as string,
        currency: r.currency as string,
        amount: Number(r.amount),
        rateBCV: Number(r.rate_bcv),
        description: r.description as string || '',
        createdAt: r.created_at as string
      }));

      const closuresRes = await db.execute('SELECT * FROM caja_closures');
      const closures = closuresRes.rows.map(r => ({
        id: Number(r.id),
        sessionId: Number(r.session_id),
        calculatedBalanceBSS: Number(r.calculated_balance_bss),
        realBalanceBSS: Number(r.real_balance_bss),
        discrepancyBSS: Number(r.discrepancy_bss),
        closureDate: r.closure_date as string,
        notes: r.notes as string || ''
      }));

      res.json({ sessions, transactions, closures });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/caja/session/open', async (req, res) => {
    try {
      const { openedBy, initialBalance } = req.body;
      const activeRes = await db.execute({
        sql: "SELECT id FROM caja_sessions WHERE status = 'ABIERTA'"
      });
      if (activeRes.rows.length > 0) {
        return res.status(400).json({ error: 'Ya hay una sesión de caja activa.' });
      }

      const openedAt = new Date().toISOString();
      const initBal = parseFloat(initialBalance) || 0;
      const user = openedBy || 'tesoreria@corporativo.com';

      const insertRes = await db.execute({
        sql: "INSERT INTO caja_sessions (opened_by, opened_at, initial_balance, status) VALUES (?, ?, ?, 'ABIERTA')",
        args: [user, openedAt, initBal]
      });

      const newId = Number(insertRes.lastInsertRowid);

      res.status(201).json({
        id: newId,
        openedBy: user,
        openedAt,
        initialBalance: initBal,
        status: 'ABIERTA'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/caja/transaction', async (req, res) => {
    try {
      const { sessionId, type, paymentMethod, currency, amount, rateBCV, description } = req.body;
      const sessionRes = await db.execute({
        sql: "SELECT * FROM caja_sessions WHERE id = ? AND status = 'ABIERTA'",
        args: [parseInt(sessionId)]
      });
      if (sessionRes.rows.length === 0) {
        return res.status(400).json({ error: 'No hay sesión de caja abierta.' });
      }

      const amountVal = parseFloat(amount) || 0;
      const rateVal = parseFloat(rateBCV) || 36.50;
      const created = new Date().toISOString();

      const insertRes = await db.execute({
        sql: 'INSERT INTO caja_transactions (session_id, type, payment_method, currency, amount, rate_bcv, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [parseInt(sessionId), type || 'Ingreso', paymentMethod || 'Efectivo', currency || 'USD', amountVal, rateVal, description || '', created]
      });

      const newId = Number(insertRes.lastInsertRowid);

      res.status(201).json({
        id: newId,
        sessionId: parseInt(sessionId),
        type: type || 'Ingreso',
        paymentMethod: paymentMethod || 'Efectivo',
        currency: currency || 'USD',
        amount: amountVal,
        rateBCV: rateVal,
        description: description || '',
        createdAt: created
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/caja/session/close', async (req, res) => {
    try {
      const { sessionId, realBalanceBSS, notes } = req.body;
      const sessionRes = await db.execute({
        sql: "SELECT * FROM caja_sessions WHERE id = ? AND status = 'ABIERTA'",
        args: [parseInt(sessionId)]
      });
      if (sessionRes.rows.length === 0) {
        return res.status(400).json({ error: 'No hay sesión activa.' });
      }
      const session = sessionRes.rows[0];

      const txsRes = await db.execute({
        sql: 'SELECT * FROM caja_transactions WHERE session_id = ?',
        args: [session.id]
      });

      let totalBSS = Number(session.initial_balance);
      txsRes.rows.forEach(t => {
        const valBSS = Number(t.amount) * Number(t.rate_bcv);
        if (t.type === 'Ingreso') {
          totalBSS += valBSS;
        } else {
          totalBSS -= valBSS;
        }
      });

      const parsedReal = parseFloat(realBalanceBSS) || 0;
      const discrepancy = parsedReal - totalBSS;
      const closedAt = new Date().toISOString();

      await db.transaction('write', async (tx) => {
        await tx.execute({
          sql: "UPDATE caja_sessions SET status = 'CERRADA', closed_at = ? WHERE id = ?",
          args: [closedAt, session.id]
        });

        await tx.execute({
          sql: 'INSERT INTO caja_closures (session_id, calculated_balance_bss, real_balance_bss, discrepancy_bss, closure_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
          args: [session.id, totalBSS, parsedReal, discrepancy, closedAt, notes || '']
        });
      });

      res.json({
        success: true,
        session: {
          id: Number(session.id),
          openedBy: session.opened_by as string,
          openedAt: session.opened_at as string,
          closedAt,
          initialBalance: Number(session.initial_balance),
          status: 'CERRADA'
        },
        closure: {
          sessionId: Number(session.id),
          calculatedBalanceBSS: totalBSS,
          realBalanceBSS: parsedReal,
          discrepancyBSS: discrepancy,
          closureDate: closedAt,
          notes: notes || ''
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Execute FIFO reconciliation for a selected client
  app.post('/api/reconciliation/execute', async (req, res) => {
    try {
      const { clientId } = req.body;
      if (!clientId) {
        return res.status(400).json({ error: 'El ID de cliente es obligatorio.' });
      }

      const cliRes = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [clientId] });
      if (cliRes.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado.' });
      }
      const client = cliRes.rows[0];

      const invoicesRes = await db.execute({
        sql: "SELECT * FROM invoices WHERE client_id = ? AND status = 'PENDIENTE' AND remaining_amount > 0 ORDER BY date ASC",
        args: [clientId]
      });
      const clientInvoices = invoicesRes.rows;

      const advancesRes = await db.execute({
        sql: "SELECT * FROM advances WHERE client_id = ? AND status = 'DISPONIBLE' AND remaining_amount > 0 ORDER BY date ASC",
        args: [clientId]
      });
      const clientAdvances = advancesRes.rows;

      let totalAmountApplied = 0;
      const generatedApplications: any[] = [];

      await db.transaction('write', async (tx) => {
        for (const invoice of clientInvoices) {
          let invRemaining = Number(invoice.remaining_amount);
          if (invRemaining <= 0) continue;

          for (const advance of clientAdvances) {
            let advRemaining = Number(advance.remaining_amount);
            if (advRemaining <= 0) continue;
            if (invRemaining <= 0) break;

            const maxApplied = Math.min(invRemaining, advRemaining);

            invRemaining -= maxApplied;
            advRemaining -= maxApplied;
            totalAmountApplied += maxApplied;

            const invStatus = invRemaining <= 0 ? 'PAGADO' : 'PENDIENTE';
            const advStatus = advRemaining <= 0 ? 'APLICADO' : 'DISPONIBLE';

            await tx.execute({
              sql: 'UPDATE invoices SET remaining_amount = ?, status = ? WHERE id = ?',
              args: [invRemaining, invStatus, invoice.id]
            });
            await tx.execute({
              sql: 'UPDATE advances SET remaining_amount = ?, status = ? WHERE id = ?',
              args: [advRemaining, advStatus, advance.id]
            });

            const appId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;
            const appDate = new Date().toISOString().split('T')[0];
            const rate = Number(advance.rate_bcv);

            await tx.execute({
              sql: `INSERT INTO applications (id, invoice_id, advance_id, amount_applied, amount_applied_bss, rate_bcv, date, status, audit_notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'APROBADO', '', ?)`,
              args: [appId, invoice.id, advance.id, maxApplied, maxApplied * rate, rate, appDate, new Date().toISOString()]
            });

            generatedApplications.push({
              id: appId,
              invoiceId: invoice.id,
              invoiceReference: invoice.id,
              advanceId: advance.id,
              advanceReference: advance.reference,
              clientName: client.name,
              amountApplied: maxApplied,
              amountAppliedBSS: maxApplied * rate,
              rateBCV: rate,
              date: appDate,
              status: 'APROBADO',
              auditNotes: ''
            });

            advance.remaining_amount = advRemaining;
          }
          invoice.remaining_amount = invRemaining;
        }

        const currentPending = Number(client.saldo_pendiente);
        const newPending = Math.max(0, currentPending - totalAmountApplied);
        const cliStatus = newPending === 0 ? 'Al Corriente' : 'En Revisión';

        await tx.execute({
          sql: 'UPDATE clients SET saldo_pendiente = ?, estado_saldo = ? WHERE id = ?',
          args: [newPending, cliStatus, clientId]
        });
      });

      res.json({
        success: true,
        clientName: client.name,
        amountApplied: totalAmountApplied,
        applications: generatedApplications
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI-Powered Suggestion/Audit via Gemini API
  app.post('/api/ai/suggestion', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("PLACEHOLDER")) {
        return res.json({
          suggestion: `### 💡 Sugerencias Estratégicas AI (Previsualización)
 
*   **Optimización del Flujo:** El cliente **Innovación Digital** mantiene **$12,450.00 MXN** vencidos desde Septiembre de 2023. Se sugeriría enviar recordatorio de cobro hoy mismo.
*   **Conciliación Potencial:** Detectamos un potencial de conciliación FIFO inmediata de **$10,400.00 MXN** para **Global Logistics S.A.** utilizando sus anticipos inactivos contra sus saldos vencidos más antiguos.
*   **Eficiencia en Métricas:** Los ingresos del trimestre (Q3) subieron un **12%**, lo cual indica un fuerte desempeño, pero la cartera morosa a +90 días acumula **$12,000.00 MXN**, requiriendo atención prioritaria.`
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const clientsRes = await db.execute('SELECT name, id, saldo_pendiente, estado_saldo FROM clients');
      const serializedClients = clientsRes.rows.map(c => `- ${c.name} (${c.id}), Saldo: $${c.saldo_pendiente}, Estado: ${c.estado_saldo}`).join('\n');

      const invoicesRes = await db.execute(`
        SELECT invoices.id, clients.name AS client_name, invoices.remaining_amount, invoices.date, invoices.is_urgente 
        FROM invoices 
        LEFT JOIN clients ON invoices.client_id = clients.id
        WHERE invoices.status = 'PENDIENTE'
      `);
      const overdueInvoices = invoicesRes.rows.map(i => `- Factura ${i.id} de ${i.client_name}: $${i.remaining_amount} (Emisión: ${i.date}, Urgente: ${i.is_urgente === 1})`).join('\n');

      const advancesRes = await db.execute(`
        SELECT advances.id, clients.name AS client_name, advances.remaining_amount, advances.date 
        FROM advances 
        LEFT JOIN clients ON advances.client_id = clients.id
        WHERE advances.status = 'DISPONIBLE'
      `);
      const unusedAdvances = advancesRes.rows.map(a => `- Anticipo ${a.id} de ${a.client_name}: $${a.remaining_amount} (Emisión: ${a.date})`).join('\n');

      const systemPrompt = `Eres un auditor financiero Senior de Inteligencia Artificial que trabaja para "Contabilidad Pro".
Analizas la base de datos de clientes, sus anticipos disponibles y sus facturas pendientes para proporcionar sugerencias de cobro y conciliación contable de alto nivel.
Por favor, analiza los siguientes datos y proporciona exactamente 3 puntos concisos, ejecutables, redactados con un lenguaje profesional y pulcro en español:
1) Conciliaciones FIFO inmediatas con mayor potencial monetario.
2) Diagnóstico de clientes con deudas críticas / vencidas que amenazan la liquidez.
3) Acciones concretas sugeridas para mejorar los tiempos de cobro (DSO).

A continuación los datos vivos de la empresa:
### CLIENTES:
${serializedClients}

### FACTURAS PENDIENTES:
${overdueInvoices}

### ANTICIPOS NO APLICADOS:
${unusedAdvances}

Por favor, formatea tu respuesta en un elegante Markdown listo para mostrar en una tarjeta de dashboard corporativo moderna.`;

      const geminiResult = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: systemPrompt,
        config: {
          temperature: 0.7,
        }
      });

      res.json({ suggestion: geminiResult.text });
    } catch (err: any) {
      console.error('Error generating suggestion:', err);
      res.json({
        suggestion: `### 💡 Sugerencias Estratégicas AI (Respaldo Local)

*   **Global Logistics S.A.:** Tiene un saldo potencial reconciliable de **$10,400.00 MXN** mediante la aplicación automática del anticipo **ANT-1022**.
*   **Cartera Morosa en Mora:** El cliente **Innovación Digital** arrastra una mora crítica superior a 90 días. Se aconseja restringir nuevas facturas y activar alertas automatizadas.
*   **Proyección de Ingresos:** Los ingresos generales registran un patrón ascendente de **12%**, reflejando estabilidad de caja en corporativos.`
      });
    }
  });

  // Vite development middleware or production static deployment
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      (async () => {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
        
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
          console.log(`Server running on http://localhost:${PORT}`);
        });
      })();
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server environment: production`);
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  }

export default app;
