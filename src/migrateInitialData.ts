/**
 * Script de migración de los datos iniciales (clients, invoices, advances, applications)
 * a la base de datos Supabase.
 *
 * Ejecutar con: `tsx src/migrateInitialData.ts`
 */
import { supabase } from './supabaseClient';
import { initialClients, initialInvoices, initialAdvances, initialApplications } from './initialData';

// Generic helper to insert rows into a Supabase table. Using `any` to avoid type‑argument issues with the Supabase client typings.
async function insertTable(table: string, rows: any[]) {
    const { data, error } = await supabase.from(table).upsert(rows, { returning: 'minimal' });
    if (error) {
        console.error(`Error inserting into ${table}:`, error);
        process.exit(1);
    }
    console.log(`✅ ${rows.length} registros insertados en ${table}`);
}

async function main() {
    // Clients
    await insertTable('clients', initialClients as any);

    // Invoices – adaptamos la estructura a la tabla supabase
    const invoices = initialInvoices.map(inv => ({
        id: inv.id,
        client_id: inv.clientId,
        amount: inv.amount,
        remaining_amount: inv.remainingAmount,
        date: inv.date,
        status: inv.status,
        description: inv.description ?? '',
        is_urgente: inv.isUrgente ? 1 : 0,
    }));
    await insertTable('invoices', invoices as any);

    // Advances
    const advances = initialAdvances.map(adv => ({
        id: adv.id,
        client_id: adv.clientId,
        reference: adv.reference,
        payment_type: adv.paymentType ?? 'Zelle',
        amount: adv.amount,
        rate_bcv: 36.5,
        amount_bss: adv.amount * 36.5,
        remaining_amount: adv.remainingAmount,
        description: adv.description ?? '',
        date: adv.date,
        status: adv.status ?? 'DISPONIBLE',
        registered_by: adv.registeredBy ?? 'admin@corporativo.com',
        created_at: new Date().toISOString(),
    }));
    await insertTable('advances', advances as any);

    // Applications
    const applications = initialApplications.map(app => ({
        id: app.id,
        invoice_id: app.invoiceId,
        advance_id: app.advanceId,
        amount_applied: app.amountApplied,
        amount_applied_bss: app.amountAppliedBss,
        rate_bcv: app.rateBCV,
        date: app.date,
        status: app.status,
        audit_notes: app.auditNotes ?? null,
        created_at: new Date().toISOString(),
    }));
    await insertTable('applications', applications as any);
}

main().catch(err => {
    console.error('Fallo en la migración:', err);
    process.exit(1);
});

