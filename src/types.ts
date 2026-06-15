export type ClientCategory = 'Corporativo' | 'Pyme' | 'Persona Física' | 'Gobierno';

export interface Client {
  id: string; // e.g., "C-40912"
  cedula?: string; // e.g., "V-20456123"
  name: string;
  rfc: string;
  category: ClientCategory;
  address: string;
  phone: string;
  email: string;
  saldoPendiente: number;
  estadoSaldo: 'Al Corriente' | 'Saldo Vencido' | 'En Revisión';
  ultimoPago: string;
  createdAt: string;
}

export type TransactionType = 'factura' | 'anticipo';
export type TransactionStatus = 'PENDIENTE' | 'PAGADO' | 'CANCELADO' | 'DISPONIBLE' | 'APLICADO' | 'PROCESANDO' | 'PENDIENTE_VALIDACION' | 'RECHAZADO';

export interface Invoice {
  id: string; // e.g., "F-2024-001"
  clientId: string;
  clientName: string;
  reference: string;
  amount: number;
  remainingAmount: number;
  date: string; //YYYY-MM-DD
  status: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
  description: string;
  isUrgente: boolean;
}

export type PaymentMethodType = 'Zelle' | 'Transferencia BSS' | 'Efectivo' | 'Euro' | 'Pesos' | 'Binance' | 'Otro';
export type RateType = 'BCV' | 'EUR' | 'Binance' | 'Peso' | 'Personal';

export interface Advance {
  id: string; // e.g., "ANT-1022"
  clientId: string;
  clientName: string;
  reference: string;
  paymentType?: PaymentMethodType;
  rateType?: RateType;
  amount: number; // Monto en moneda origen (ej. USD, EUR, etc.)
  rateBCV?: number; // Factor cambiario de conversión a BSS
  amountInBSS?: number; // Monto total calculado en bolívares (BSS)
  remainingAmount: number; // Remanente en moneda origen
  date: string; // YYYY-MM-DD
  status: TransactionStatus;
  description: string;
  photoUrl?: string; // Comprobante cargado o tomado por cámara
  registeredBy?: string; // Email del usuario que lo registró
}

export interface Application {
  id: string;
  invoiceId: string;
  invoiceReference: string;
  advanceId: string;
  advanceReference: string;
  clientName: string;
  amountApplied: number; // Monto en moneda origen
  amountAppliedBSS: number; // Monto en bolívares al factor cambiario
  rateBCV: number; // Factor al que se aplicó
  date: string;
  status: 'PENDIENTE_AUDITORIA' | 'APROBADO' | 'RECHAZADO';
  auditNotes?: string;
}

export interface CajaSession {
  id: number;
  openedBy: string;
  openedAt: string;
  closedAt?: string;
  initialBalance: number;
  status: 'ABIERTA' | 'CERRADA';
}

export interface CajaTransaction {
  id: number;
  sessionId: number;
  type: 'Ingreso' | 'Egreso';
  paymentMethod: 'Punto de Venta' | 'Efectivo' | 'Caja Chica' | 'Vueltos' | 'Zelle' | 'Otro';
  currency: string;
  amount: number;
  rateBCV: number;
  description: string;
  createdAt: string;
}

export interface CajaClosure {
  id: number;
  sessionId: number;
  calculatedBalanceBSS: number;
  realBalanceBSS: number;
  discrepancyBSS: number;
  closureDate: string;
  notes: string;
}

export interface User {
  email: string;
  role: string;
  name: string;
  permissions: string[]; // Listado de permisos activos del usuario
}

export type ViewType = 'dashboard' | 'clientes' | 'nuevo-cliente' | 'nuevo-registro' | 'conciliacion' | 'reportes' | 'usuarios' | 'caja' | 'aprobaciones' | 'auditoria';

