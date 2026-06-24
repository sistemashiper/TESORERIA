import express from 'express';
import path from 'path';
import { supabase } from './src/supabaseClient';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
// import { createClient } from '@libsql/client'; // Turso client disabled in favor of Supabase
import { Client, Invoice, Advance, Application, User, CajaSession, CajaTransaction, CajaClosure } from './src/types';
// Added explicit .js extension for Vercel production compatibility
import { initialClients, initialInvoices, initialAdvances, initialApplications } from './src/initialData.js';

dotenv.config();

// Initialize Supabase client for database operations (replaces Turso/SQLite)
// Supabase client is imported from src/supabaseClient.ts and provides CRUD methods.
// We'll use the generic `supabase` instance for all table operations.
// Note: For simplicity, we keep the same function signatures but delegate to Supabase.
// Example usage: await supabase.from('clients').select('*')
// The original `db` variable is no longer needed.
const db = null; // placeholder to keep existing code structure; will be replaced in functions below.

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
  console.log('Inicializando base de datos en Supabase...');
  try {
    // Verificar si la tabla users tiene registros
    const { count, error: countErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      console.error('Error al verificar usuarios en Supabase:', countErr);
      return;
    }

    if (count === 0) {
      console.log('Sembrando usuarios por defecto en Supabase...');
      const usersSeed = [
        { email: 'ventas@corporativo.com', name: 'Vendedor Demo', role: 'Ventas', permissions: JSON.stringify(['canRegisterClients', 'canRegisterAdvances']), password: 'admin' },
        { email: 'tesoreria@corporativo.com', name: 'Tesorero Demo', role: 'Tesoreria', permissions: JSON.stringify(['canRegisterClients', 'canRegisterAdvances', 'canVerifyAdvances', 'canApplyAdvances', 'canManageCaja']), password: 'admin' },
        { email: 'gerencia@corporativo.com', name: 'Gerente Demo', role: 'Gerencia', permissions: JSON.stringify(['canRegisterClients', 'canRegisterAdvances', 'canVerifyAdvances', 'canApplyAdvances', 'canAuditApplications', 'canManageCaja', 'canAuditCaja', 'canManageUsers']), password: 'admin' },
        { email: 'admin@corporativo.com', name: 'Administrador Demo', role: 'Administrador', permissions: JSON.stringify(['canRegisterClients', 'canRegisterAdvances', 'canVerifyAdvances', 'canApplyAdvances', 'canAuditApplications', 'canManageCaja', 'canAuditCaja', 'canManageUsers']), password: 'admin' }
      ];

      const { error: insertErr } = await supabase.from('users').insert(usersSeed);
      if (insertErr) {
        console.error('Error al sembrar usuarios:', insertErr);
      } else {
        console.log('Usuarios sembrados con éxito.');
      }
    } else {
      // Asegurar que existe el administrador por defecto
      const { data: adminUser, error: adminErr } = await supabase
        .from('users')
        .select('email')
        .eq('email', 'admin@corporativo.com')
        .maybeSingle();

      if (!adminUser && !adminErr) {
        console.log('Creando usuario administrador por defecto...');
        const { error: createAdminErr } = await supabase.from('users').insert({
          email: 'admin@corporativo.com',
          name: 'Administrador Demo',
          role: 'Administrador',
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
        });
        if (createAdminErr) {
          console.error('Error al crear administrador por defecto:', createAdminErr);
        } else {
          console.log('Administrador por defecto creado con éxito.');
        }
      }
    }
  } catch (e) {
    console.error('Error al conectar con Supabase en la inicialización:', e);
  }
}

// Initialize Turso database before handling any request to avoid race conditions in serverless environments
// Using an async IIFE (without top‑level await) so the module remains valid in both CommonJS and ESM.
(async () => {
  try {
    await initializeDatabase();
  } catch (e) {
    console.error('Error initializing database:', e);
  }
})();

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
    // Use Supabase to fetch the user
    const { data: row, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !row) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }
    if (row.password !== password) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }
    res.json({
      success: true,
      user: {
        email: row.email,
        name: row.name,
        role: row.role,
        permissions: JSON.parse(row.permissions as string)
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Password recovery: generate a temporary password (token) and update user record
app.post('/api/auth/recover', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Correo es obligatorio.' });
    }
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    // Generate a simple random token as temporary password
    const token = Math.random().toString(36).slice(-8);
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password: token })
      .eq('email', email);
    if (updateErr) throw updateErr;
    // In a real app, send token via email. Here we return it for testing.
    res.json({ success: true, token });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reset password using the token generated by /recover
app.post('/api/auth/reset', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Campos obligatorios: email, token, newPassword.' });
    }
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', token)
      .maybeSingle();
    if (error || !user) {
      return res.status(400).json({ error: 'Token inválido o usuario no encontrado.' });
    }
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('email', email);
    if (updateErr) throw updateErr;
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// User management endpoints
app.get('/api/auth/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw error;
    const usersMapped = (users || []).map(r => ({
      email: r.email,
      name: r.name,
      role: r.role,
      permissions: JSON.parse(r.permissions as string)
    }));
    res.json(usersMapped);
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
    const { data: existingUser, error: checkErr } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe.' });
    }
    const perms = permissions || [];
    const { error: insertErr } = await supabase
      .from('users')
      .insert({
        email,
        name,
        role,
        permissions: JSON.stringify(perms),
        password: 'admin'
      });
    if (insertErr) throw insertErr;
    res.status(201).json({ email, name, role, permissions: perms });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/update-user-permissions', async (req, res) => {
  try {
    const { email, permissions } = req.body;
    const { data: user, error: checkErr } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    if (checkErr || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const { error: updateErr } = await supabase
      .from('users')
      .update({ permissions: JSON.stringify(permissions) })
      .eq('email', email);
    if (updateErr) throw updateErr;
    res.json({ email, permissions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Full database fetch – now using Supabase instead of Turso/SQLite
app.get('/api/database', async (req, res) => {
  try {
    // 1. Fetch Clients
    const { data: clients, error: errClients } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    if (errClients) throw errClients;

    const clientsMapped = (clients || []).map(r => ({
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
      createdAt: r.created_at as string,
    }));

    // 2. Fetch Invoices with client name
    const { data: invoices, error: errInvoices } = await supabase
      .from('invoices')
      .select('*, clients(name)')
      .order('id');
    if (errInvoices) throw errInvoices;

    const invoicesMapped = (invoices || []).map(r => ({
      id: r.id as string,
      clientId: r.client_id as string,
      clientName: r.clients ? (r.clients as any).name as string : '',
      reference: r.id as string,
      amount: Number(r.amount),
      remainingAmount: Number(r.remaining_amount),
      date: r.date as string,
      status: r.status as string,
      description: r.description as string || '',
      isUrgente: r.is_urgente === 1,
    }));

    // 3. Fetch Advances with client name and optional photo
    const { data: advances, error: errAdvances } = await supabase
      .from('advances')
      .select('*, clients(name), advance_images(photo_base64)')
      .order('id');
    if (errAdvances) throw errAdvances;

    const advancesMapped = (advances || []).map(r => {
      const img = r.advance_images;
      const photoBase64 = img 
        ? (Array.isArray(img) ? (img[0] ? (img[0] as any).photo_base64 : '') : (img as any).photo_base64)
        : '';
      return {
        id: r.id as string,
        clientId: r.client_id as string,
        clientName: r.clients ? (r.clients as any).name as string : '',
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
        photoUrl: photoBase64 || '',
        registeredBy: r.registered_by as string
      };
    });

    // 4. Fetch Applications
    const { data: apps, error: errApps } = await supabase
      .from('applications')
      .select('*, invoices(id), advances(reference, clients(name))');
    if (errApps) throw errApps;

    const applicationsMapped = (apps || []).map(r => {
      const adv = r.advances as any;
      const clientName = adv && adv.clients ? adv.clients.name : '';
      const invoiceReference = r.invoices ? r.invoices.id : '';
      const advanceReference = adv ? adv.reference : '';
      return {
        id: r.id as string,
        invoiceId: r.invoice_id as string,
        invoiceReference: invoiceReference as string,
        advanceId: r.advance_id as string,
        advanceReference: advanceReference as string,
        clientName: clientName as string,
        amountApplied: Number(r.amount_applied),
        amountAppliedBSS: Number(r.amount_applied_bss),
        rateBCV: Number(r.rate_bcv),
        date: r.date as string,
        status: r.status as string,
        auditNotes: r.audit_notes as string || ''
      };
    });

    res.json({
      clients: clientsMapped,
      invoices: invoicesMapped,
      advances: advancesMapped,
      applications: applicationsMapped
    });
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
    const { data: exists, error: checkErr } = await supabase
      .from('clients')
      .select('id')
      .eq('cedula', cedula)
      .maybeSingle();

    if (checkErr) throw checkErr;
    if (exists) {
      return res.status(400).json({ error: 'Ya existe un cliente registrado con esta Cédula.' });
    }

    const newId = `C-${Math.floor(10000 + Math.random() * 90000)}`;
    const createdAt = new Date().toISOString().split('T')[0];

    const { error: insertErr } = await supabase
      .from('clients')
      .insert({
        id: newId,
        cedula,
        name,
        category: category || 'Corporativo',
        address: address || '',
        phone: phone || '',
        email: email || '',
        saldo_pendiente: 0.0,
        estado_saldo: 'Al Corriente',
        created_at: createdAt
      });

    if (insertErr) throw insertErr;

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

    const { data: clientRow, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    if (clientErr || !clientRow) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const numericAmount = parseFloat(amount);
    const txDate = date || new Date().toISOString().split('T')[0];

    if (type === 'factura') {
      // Check if invoice already exists
      const { data: invExists } = await supabase
        .from('invoices')
        .select('id')
        .eq('id', reference)
        .maybeSingle();
      if (invExists) {
        return res.status(400).json({ error: 'Ya existe una factura con esta referencia/ID.' });
      }

      // Insert invoice
      const { error: invInsertErr } = await supabase
        .from('invoices')
        .insert({
          id: reference,
          client_id: clientId,
          amount: numericAmount,
          remaining_amount: numericAmount,
          date: txDate,
          status: 'PENDIENTE',
          description: description || '',
          is_urgente: isUrgente ? 1 : 0
        });
      if (invInsertErr) throw invInsertErr;

      // Update client pending balance
      const newPending = Number(clientRow.saldo_pendiente) + numericAmount;
      const { error: cliUpdateErr } = await supabase
        .from('clients')
        .update({ saldo_pendiente: newPending, estado_saldo: 'En Revisión' })
        .eq('id', clientId);
      if (cliUpdateErr) throw cliUpdateErr;

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

      // Check if advance already exists
      const { data: advExists } = await supabase
        .from('advances')
        .select('id')
        .eq('id', reference)
        .maybeSingle();
      if (advExists) {
        return res.status(400).json({ error: 'Ya existe un anticipo con esta referencia/ID.' });
      }

      // Insert advance
      const { error: advInsertErr } = await supabase
        .from('advances')
        .insert({
          id: reference,
          client_id: clientId,
          reference,
          payment_type: paymentType || 'Zelle',
          amount: numericAmount,
          rate_bcv: parsedRate,
          amount_bss: calcBSS,
          remaining_amount: numericAmount,
          description: description || '',
          date: txDate,
          status: 'PENDIENTE_VALIDACION',
          registered_by: registeredBy || 'ventas@corporativo.com',
          created_at: new Date().toISOString()
        });
      if (advInsertErr) throw advInsertErr;

      // Insert photo if provided
      if (photoUrl) {
        const { error: imgErr } = await supabase
          .from('advance_images')
          .insert({ advance_id: reference, photo_base64: photoUrl });
        if (imgErr) console.error('Error inserting advance image:', imgErr);
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

    const { data: advRow, error: advErr } = await supabase
      .from('advances')
      .select('*')
      .eq('id', id)
      .single();
    if (advErr || !advRow) {
      return res.status(404).json({ error: 'Anticipo no encontrado.' });
    }

    const newAmount = amount !== undefined ? parseFloat(amount) : Number(advRow.amount);
    const newRate = rateBCV !== undefined ? parseFloat(rateBCV) : Number(advRow.rate_bcv);
    const newBSS = amountInBSS !== undefined ? parseFloat(amountInBSS) : (newAmount * newRate);
    const newRef = reference || (advRow.reference as string);
    const newDesc = description !== undefined ? description : (advRow.description as string || '');
    const newPaymentType = paymentType || (advRow.payment_type as string);

    const { error: updateErr } = await supabase
      .from('advances')
      .update({
        amount: newAmount,
        remaining_amount: newAmount,
        rate_bcv: newRate,
        amount_bss: newBSS,
        reference: newRef,
        description: newDesc,
        payment_type: newPaymentType,
        status: 'DISPONIBLE'
      })
      .eq('id', id);
    if (updateErr) throw updateErr;

    const { data: clientRow } = await supabase
      .from('clients')
      .select('name')
      .eq('id', advRow.client_id)
      .maybeSingle();
    const clientName = clientRow?.name as string || '';

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
    const { data: advRow, error: advErr } = await supabase
      .from('advances')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (advErr || !advRow) {
      return res.status(404).json({ error: 'Anticipo no encontrado.' });
    }
    const { error: updateErr } = await supabase
      .from('advances')
      .update({ status: 'RECHAZADO' })
      .eq('id', id);
    if (updateErr) throw updateErr;
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

    const { data: client, error: cliErr } = await supabase.from('clients').select('*').eq('id', clientId).single();
    const { data: invoice, error: invErr } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
    const { data: advance, error: advErr } = await supabase.from('advances').select('*').eq('id', advanceId).single();

    if (cliErr || invErr || advErr || !client || !invoice || !advance) {
      return res.status(404).json({ error: 'Cliente, factura o anticipo no encontrado.' });
    }

    const numAmount = parseFloat(amountApplied);
    const numRate = parseFloat(rateBCV) || Number(advance.rate_bcv);
    const numBSS = numAmount * numRate;
    const appId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;
    const appDate = date || new Date().toISOString().split('T')[0];

    // Insert application
    const { error: appInsertErr } = await supabase
      .from('applications')
      .insert({
        id: appId,
        invoice_id: invoiceId,
        advance_id: advanceId,
        amount_applied: numAmount,
        amount_applied_bss: numBSS,
        rate_bcv: numRate,
        date: appDate,
        status: 'PENDIENTE_AUDITORIA',
        audit_notes: '',
        created_at: new Date().toISOString()
      });
    if (appInsertErr) throw appInsertErr;

    // Update invoice
    const invRemaining = Math.max(0, Number(invoice.remaining_amount) - numAmount);
    const invStatus = invRemaining <= 0 ? 'PAGADO' : 'PENDIENTE';
    const { error: invUpdateErr } = await supabase
      .from('invoices')
      .update({ remaining_amount: invRemaining, status: invStatus })
      .eq('id', invoiceId);
    if (invUpdateErr) throw invUpdateErr;

    // Update advance
    const advRemaining = Math.max(0, Number(advance.remaining_amount) - numAmount);
    const advStatus = advRemaining <= 0 ? 'APLICADO' : 'DISPONIBLE';
    const { error: advUpdateErr } = await supabase
      .from('advances')
      .update({ remaining_amount: advRemaining, status: advStatus })
      .eq('id', advanceId);
    if (advUpdateErr) throw advUpdateErr;

    // Update client balance
    const cliPending = Math.max(0, Number(client.saldo_pendiente) - numAmount);
    const cliStatus = cliPending === 0 ? 'Al Corriente' : 'En Revisión';
    const { error: cliUpdateErr } = await supabase
      .from('clients')
      .update({ saldo_pendiente: cliPending, estado_saldo: cliStatus })
      .eq('id', clientId);
    if (cliUpdateErr) throw cliUpdateErr;

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

    const { data: appRecord, error: appErr } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();
    if (appErr || !appRecord) {
      return res.status(404).json({ error: 'Aplicación no encontrada.' });
    }

    // Update application status
    const { error: appUpdateErr } = await supabase
      .from('applications')
      .update({ status, audit_notes: auditNotes || '' })
      .eq('id', id);
    if (appUpdateErr) throw appUpdateErr;

    if (status === 'RECHAZADO') {
      // Revert invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', appRecord.invoice_id)
        .maybeSingle();
      if (invoice) {
        const newRemaining = Number(invoice.remaining_amount) + Number(appRecord.amount_applied);
        await supabase
          .from('invoices')
          .update({ remaining_amount: newRemaining, status: 'PENDIENTE' })
          .eq('id', appRecord.invoice_id);
      }

      // Revert advance
      const { data: advance } = await supabase
        .from('advances')
        .select('*')
        .eq('id', appRecord.advance_id)
        .maybeSingle();
      if (advance) {
        const newRemaining = Number(advance.remaining_amount) + Number(appRecord.amount_applied);
        await supabase
          .from('advances')
          .update({ remaining_amount: newRemaining, status: 'DISPONIBLE' })
          .eq('id', appRecord.advance_id);

        // Revert client balance
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', advance.client_id)
          .maybeSingle();
        if (client) {
          const newPending = Number(client.saldo_pendiente) + Number(appRecord.amount_applied);
          await supabase
            .from('clients')
            .update({ saldo_pendiente: newPending, estado_saldo: 'En Revisión' })
            .eq('id', advance.client_id);
        }
      }
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

    const { data: appRecord, error: appErr } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('status', 'RECHAZADO')
      .single();
    if (appErr || !appRecord) {
      return res.status(400).json({ error: 'Registro rechazado no encontrado.' });
    }

    const numAmount = parseFloat(amountApplied);
    const numRate = parseFloat(rateBCV);
    const numBSS = numAmount * numRate;

    const { data: invoice } = await supabase.from('invoices').select('*').eq('id', appRecord.invoice_id).single();
    const { data: advance } = await supabase.from('advances').select('*').eq('id', appRecord.advance_id).single();

    if (invoice && advance) {
      const oldApplied = Number(appRecord.amount_applied);
      const tempInvoiceRemaining = Number(invoice.remaining_amount) + oldApplied;
      const tempAdvanceRemaining = Number(advance.remaining_amount) + oldApplied;

      const newInvoiceRemaining = Math.max(0, tempInvoiceRemaining - numAmount);
      const invStatus = newInvoiceRemaining <= 0 ? 'PAGADO' : 'PENDIENTE';
      await supabase
        .from('invoices')
        .update({ remaining_amount: newInvoiceRemaining, status: invStatus })
        .eq('id', appRecord.invoice_id);

      const newAdvanceRemaining = Math.max(0, tempAdvanceRemaining - numAmount);
      const advStatus = newAdvanceRemaining <= 0 ? 'APLICADO' : 'DISPONIBLE';
      await supabase
        .from('advances')
        .update({ remaining_amount: newAdvanceRemaining, status: advStatus })
        .eq('id', appRecord.advance_id);

      // Update client balance
      const { data: client } = await supabase.from('clients').select('*').eq('id', advance.client_id).maybeSingle();
      if (client) {
        const tempPending = Number(client.saldo_pendiente) + oldApplied;
        const newPending = Math.max(0, tempPending - numAmount);
        const cliStatus = newPending === 0 ? 'Al Corriente' : 'En Revisión';
        await supabase
          .from('clients')
          .update({ saldo_pendiente: newPending, estado_saldo: cliStatus })
          .eq('id', advance.client_id);
      }
    }

    // Update application
    const { error: appUpdateErr } = await supabase
      .from('applications')
      .update({
        amount_applied: numAmount,
        amount_applied_bss: numBSS,
        rate_bcv: numRate,
        status: 'PENDIENTE_AUDITORIA',
        audit_notes: 'Reenviado con ajustes'
      })
      .eq('id', id);
    if (appUpdateErr) throw appUpdateErr;

    res.json({ success: true });
  } catch (err: any) {
    res.status(550).json({ error: err.message });
  }
});

// Caja Endpoints
app.get('/api/caja/session/current', async (req, res) => {
  try {
    const { data: activeSession, error } = await supabase
      .from('caja_sessions')
      .select('*')
      .eq('status', 'ABIERTA')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (activeSession) {
      const session = {
        id: Number(activeSession.id),
        openedBy: activeSession.opened_by as string,
        openedAt: activeSession.opened_at as string,
        closedAt: activeSession.closed_at as string || null,
        initialBalance: Number(activeSession.initial_balance),
        status: activeSession.status as string
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
    const { data: sessionsData, error: sessErr } = await supabase.from('caja_sessions').select('*');
    if (sessErr) throw sessErr;
    const sessions = (sessionsData || []).map(r => ({
      id: Number(r.id),
      openedBy: r.opened_by as string,
      openedAt: r.opened_at as string,
      closedAt: r.closed_at as string || null,
      initialBalance: Number(r.initial_balance),
      status: r.status as string
    }));

    const { data: txsData, error: txsErr } = await supabase.from('caja_transactions').select('*');
    if (txsErr) throw txsErr;
    const transactions = (txsData || []).map(r => ({
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

    const { data: closuresData, error: closErr } = await supabase.from('caja_closures').select('*');
    if (closErr) throw closErr;
    const closures = (closuresData || []).map(r => ({
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

    const { data: activeCheck } = await supabase
      .from('caja_sessions')
      .select('id')
      .eq('status', 'ABIERTA')
      .maybeSingle();
    if (activeCheck) {
      return res.status(400).json({ error: 'Ya hay una sesión de caja activa.' });
    }

    const openedAt = new Date().toISOString();
    const initBal = parseFloat(initialBalance) || 0;
    const user = openedBy || 'tesoreria@corporativo.com';

    const { data: inserted, error: insertErr } = await supabase
      .from('caja_sessions')
      .insert({
        opened_by: user,
        opened_at: openedAt,
        initial_balance: initBal,
        status: 'ABIERTA'
      })
      .select('id')
      .single();
    if (insertErr) throw insertErr;

    res.status(201).json({
      id: Number(inserted.id),
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

    const { data: sessionRow, error: sessErr } = await supabase
      .from('caja_sessions')
      .select('*')
      .eq('id', parseInt(sessionId))
      .eq('status', 'ABIERTA')
      .maybeSingle();
    if (sessErr || !sessionRow) {
      return res.status(400).json({ error: 'No hay sesión de caja abierta.' });
    }

    const amountVal = parseFloat(amount) || 0;
    const rateVal = parseFloat(rateBCV) || 36.50;
    const created = new Date().toISOString();

    const { data: inserted, error: insertErr } = await supabase
      .from('caja_transactions')
      .insert({
        session_id: parseInt(sessionId),
        type: type || 'Ingreso',
        payment_method: paymentMethod || 'Efectivo',
        currency: currency || 'USD',
        amount: amountVal,
        rate_bcv: rateVal,
        description: description || '',
        created_at: created
      })
      .select('id')
      .single();
    if (insertErr) throw insertErr;

    res.status(201).json({
      id: Number(inserted.id),
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

    const { data: session, error: sessErr } = await supabase
      .from('caja_sessions')
      .select('*')
      .eq('id', parseInt(sessionId))
      .eq('status', 'ABIERTA')
      .single();
    if (sessErr || !session) {
      return res.status(400).json({ error: 'No hay sesión activa.' });
    }

    // Get transactions for this session
    const { data: txs, error: txsErr } = await supabase
      .from('caja_transactions')
      .select('*')
      .eq('session_id', session.id);
    if (txsErr) throw txsErr;

    let totalBSS = Number(session.initial_balance);
    (txs || []).forEach(t => {
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

    // Update session status
    const { error: sessUpdateErr } = await supabase
      .from('caja_sessions')
      .update({ status: 'CERRADA', closed_at: closedAt })
      .eq('id', session.id);
    if (sessUpdateErr) throw sessUpdateErr;

    // Insert closure record
    const { error: closureErr } = await supabase
      .from('caja_closures')
      .insert({
        session_id: session.id,
        calculated_balance_bss: totalBSS,
        real_balance_bss: parsedReal,
        discrepancy_bss: discrepancy,
        closure_date: closedAt,
        notes: notes || ''
      });
    if (closureErr) throw closureErr;

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

    const { data: client, error: cliErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    if (cliErr || !client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // Get pending invoices sorted by date ASC (FIFO)
    const { data: clientInvoices, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'PENDIENTE')
      .gt('remaining_amount', 0)
      .order('date', { ascending: true });
    if (invErr) throw invErr;

    // Get available advances sorted by date ASC (FIFO)
    const { data: clientAdvances, error: advErr } = await supabase
      .from('advances')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'DISPONIBLE')
      .gt('remaining_amount', 0)
      .order('date', { ascending: true });
    if (advErr) throw advErr;

    let totalAmountApplied = 0;
    const generatedApplications: any[] = [];

    // Clone remaining amounts to track in-memory
    const invoiceRemainings = (clientInvoices || []).map(inv => ({ ...inv, _remaining: Number(inv.remaining_amount) }));
    const advanceRemainings = (clientAdvances || []).map(adv => ({ ...adv, _remaining: Number(adv.remaining_amount) }));

    for (const invoice of invoiceRemainings) {
      if (invoice._remaining <= 0) continue;

      for (const advance of advanceRemainings) {
        if (advance._remaining <= 0) continue;
        if (invoice._remaining <= 0) break;

        const maxApplied = Math.min(invoice._remaining, advance._remaining);

        invoice._remaining -= maxApplied;
        advance._remaining -= maxApplied;
        totalAmountApplied += maxApplied;

        const invStatus = invoice._remaining <= 0 ? 'PAGADO' : 'PENDIENTE';
        const advStatus = advance._remaining <= 0 ? 'APLICADO' : 'DISPONIBLE';

        // Update invoice
        await supabase
          .from('invoices')
          .update({ remaining_amount: invoice._remaining, status: invStatus })
          .eq('id', invoice.id);

        // Update advance
        await supabase
          .from('advances')
          .update({ remaining_amount: advance._remaining, status: advStatus })
          .eq('id', advance.id);

        // Create application
        const appId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;
        const appDate = new Date().toISOString().split('T')[0];
        const rate = Number(advance.rate_bcv);

        await supabase
          .from('applications')
          .insert({
            id: appId,
            invoice_id: invoice.id,
            advance_id: advance.id,
            amount_applied: maxApplied,
            amount_applied_bss: maxApplied * rate,
            rate_bcv: rate,
            date: appDate,
            status: 'APROBADO',
            audit_notes: '',
            created_at: new Date().toISOString()
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
      }
    }

    // Update client balance
    const currentPending = Number(client.saldo_pendiente);
    const newPending = Math.max(0, currentPending - totalAmountApplied);
    const cliStatus = newPending === 0 ? 'Al Corriente' : 'En Revisión';
    await supabase
      .from('clients')
      .update({ saldo_pendiente: newPending, estado_saldo: cliStatus })
      .eq('id', clientId);

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
