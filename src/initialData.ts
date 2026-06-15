import { Client, Invoice, Advance, Application } from './types';

export const initialClients: Client[] = [
  {
    id: 'C-40912',
    name: 'Global Logistics S.A.',
    rfc: 'GLO12034',
    category: 'Corporativo',
    address: 'Av. de las Industrias 405, Zona Industrial, Monterrey, NL',
    phone: '+52 811 234 5678',
    email: 'contacto@globallogistics.mx',
    saldoPendiente: 0,
    estadoSaldo: 'Al Corriente',
    ultimoPago: '2023-10-12',
    createdAt: '2023-01-15'
  },
  {
    id: 'C-22341',
    name: 'Innovación Digital',
    rfc: 'INN88122',
    category: 'Pyme',
    address: 'Chihuahua 120, Col. Roma Norte, CDMX',
    phone: '+52 554 123 4567',
    email: 'pagos@innovacion.digital',
    saldoPendiente: 12450.00,
    estadoSaldo: 'Saldo Vencido',
    ultimoPago: '2023-09-05',
    createdAt: '2023-02-10'
  },
  {
    id: 'C-55612',
    name: 'Terra Constructora',
    rfc: 'TER90112',
    category: 'Corporativo',
    address: 'Paseo de la Reforma 450, Piso 12, CDMX',
    phone: '+52 555 987 6543',
    email: 'facturas@terraconstructora.com',
    saldoPendiente: 4200.00,
    estadoSaldo: 'En Revisión',
    ultimoPago: '2023-09-28',
    createdAt: '2023-03-22'
  },
  {
    id: 'C-11098',
    name: 'Studio Minimal',
    rfc: 'STU44551',
    category: 'Persona Física',
    address: 'Av. Patria 1050, Zapopan, Jal',
    phone: '+52 331 456 7890',
    email: 'hola@studiominimal.com',
    saldoPendiente: 0,
    estadoSaldo: 'Al Corriente',
    ultimoPago: 'Hoy, 09:45 AM',
    createdAt: '2023-05-18'
  },
  {
    id: 'C-99021',
    name: 'Logística Central S.A.',
    rfc: 'LCE99120',
    category: 'Corporativo',
    address: 'Carr. Laredo Km 14, Apodaca, NL',
    phone: '+52 818 900 1122',
    email: 'admin@logisticacentral.com',
    saldoPendiente: 8900.00,
    estadoSaldo: 'Al Corriente',
    ultimoPago: '2023-11-01',
    createdAt: '2023-02-01'
  },
  {
    id: 'C-88102',
    name: 'Techno Export',
    rfc: 'TEX88091',
    category: 'Corporativo',
    address: 'Industrial Park II, Ciudad Juárez, Chih',
    phone: '+52 656 777 8899',
    email: 'billing@technoexport.com',
    saldoPendiente: 15300.00,
    estadoSaldo: 'Al Corriente',
    ultimoPago: '2023-10-20',
    createdAt: '2023-04-12'
  },
  {
    id: 'C-72109',
    name: 'Manufacturas Sur',
    rfc: 'MSU72041',
    category: 'Gobierno',
    address: 'Av. Central Oriente 21, Tuxtla Gutiérrez, Chiapas',
    phone: '+52 961 123 0088',
    email: 'adquisiciones@manufacturassur.gob.mx',
    saldoPendiente: 3200.00,
    estadoSaldo: 'Saldo Vencido',
    ultimoPago: '2023-08-30',
    createdAt: '2023-01-20'
  },
  {
    id: 'C-66155',
    name: 'Innova Apps',
    rfc: 'IAP66022',
    category: 'Pyme',
    address: 'Av. Las Américas 80, Guadalajara, Jal',
    phone: '+52 333 444 5555',
    email: 'accounting@innovaapps.io',
    saldoPendiente: 8900.00,
    estadoSaldo: 'En Revisión',
    ultimoPago: '2023-11-10',
    createdAt: '2023-06-05'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'F-2024-001',
    clientId: 'C-40912',
    clientName: 'Global Logistics S.A.',
    reference: 'F-2024-001',
    amount: 5000.00,
    remainingAmount: 5000.00,
    date: '2024-01-12',
    status: 'PENDIENTE',
    description: 'Servicio de flete terrestre internacional - Contenedor A3',
    isUrgente: true
  },
  {
    id: 'F-2024-005',
    clientId: 'C-40912',
    clientName: 'Global Logistics S.A.',
    reference: 'F-2024-005',
    amount: 2450.00,
    remainingAmount: 2450.00,
    date: '2024-01-15',
    status: 'PENDIENTE',
    description: 'Maniobras de descarga y almacenamiento temporal',
    isUrgente: false
  },
  {
    id: 'F-2024-009',
    clientId: 'C-40912',
    clientName: 'Global Logistics S.A.',
    reference: 'F-2024-009',
    amount: 8900.00,
    remainingAmount: 8900.00,
    date: '2024-01-18',
    status: 'PENDIENTE',
    description: 'Despacho aduanal y tramitología de pedimento',
    isUrgente: false
  },
  {
    id: 'F-2024-012',
    clientId: 'C-40912',
    clientName: 'Global Logistics S.A.',
    reference: 'F-2024-012',
    amount: 1200.00,
    remainingAmount: 1200.00,
    date: '2024-01-22',
    status: 'PENDIENTE',
    description: 'Seguro de tránsito de mercancías',
    isUrgente: false
  },
  {
    id: 'F-2024-015',
    clientId: 'C-40912',
    clientName: 'Global Logistics S.A.',
    reference: 'F-2024-015',
    amount: 6700.00,
    remainingAmount: 6700.00,
    date: '2024-01-25',
    status: 'PENDIENTE',
    description: 'Distribución local última milla - Lote 12',
    isUrgente: false
  },
  {
    id: 'F-2024-018',
    clientId: 'C-40912',
    clientName: 'Global Logistics S.A.',
    reference: 'F-2024-018',
    amount: 4320.00,
    remainingAmount: 4320.00,
    date: '2024-02-01',
    status: 'PENDIENTE',
    description: 'Retorno de contenedores vacíos a puerto',
    isUrgente: false
  },
  {
    id: 'F-9203',
    clientId: 'C-99021',
    clientName: 'Logística Central S.A.',
    reference: 'F-9203',
    amount: 12450.00,
    remainingAmount: 0.00,
    date: '2023-10-15',
    status: 'PAGADO',
    description: 'Arrendamiento de pallets y montacargas Q3',
    isUrgente: false
  },
  {
    id: 'F-9211',
    clientId: 'C-66155',
    clientName: 'Innova Apps',
    reference: 'F-9211',
    amount: 8900.00,
    remainingAmount: 8900.00,
    date: '2023-11-05',
    status: 'PENDIENTE',
    description: 'Desarrollo de módulos API de cobro electrónico',
    isUrgente: true
  }
];

export const initialAdvances: Advance[] = [
  {
    id: 'ANT-1022',
    clientId: 'C-40912',
    clientName: 'Global Logistics S.A.',
    reference: 'ANT-1022',
    amount: 8500.00,
    remainingAmount: 8500.00,
    date: '2024-01-05',
    status: 'DISPONIBLE',
    description: 'Anticipo para futuros fletes del mes de Enero'
  },
  {
    id: 'ANT-1035',
    clientId: 'C-40912',
    clientName: 'Global Logistics S.A.',
    reference: 'ANT-1035',
    amount: 1200.00,
    remainingAmount: 1200.00,
    date: '2024-01-10',
    status: 'DISPONIBLE',
    description: 'Anticipo de caja para contingencias aduanales'
  },
  {
    id: 'ANT-1048',
    clientId: 'C-40912',
    clientName: 'Global Logistics S.A.',
    reference: 'ANT-1048',
    amount: 3140.50,
    remainingAmount: 3140.50,
    date: '2024-01-20',
    status: 'DISPONIBLE',
    description: 'Abono extraordinario saldo a favor'
  }
];

export const initialApplications: Application[] = [];
