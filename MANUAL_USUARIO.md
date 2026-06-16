# Manual del Sistema TESORERIA

## 1. Introducción

Este manual documenta las operaciones del sistema TESORERIA, incluyendo autenticación, gestión de clientes, conciliaciones FIFO y control de caja. Se recomienda leer este documento antes de usar el sistema.

## 2. Autenticación

### 2.1. Iniciar Sesión

1. Abra el sistema y navegue al panel de inicio.
2. Ingrese sus credenciales:
   - **Correo Electrónico:** Use uno de los siguientes correos predeterminados:
     - admin@corporativo.com (recomendado)
     - ventas@corporativo.com
     - tesoreria@corporativo.com
     - gerencia@corporativo.com
   - **Contraseña:** Cualquier contraseña no vacía es aceptada (se recomienda cambiarla al primer inicio).
3. Haga clic en "Iniciar Sesión".

### 2.2. Recuperación de Cuenta

Si olvida su contraseña, contacte al administrador del sistema para restablecerla.

## 3. Registro de Usuarios

### 3.1. Acceder al Registro

1. En la pantalla de inicio de sesión, haga clic en "No tienes cuenta? Registrate aquí".
2. Complete el formulario con:
   - Nombre completo
   - Cédula de Identidad (RFC opcional)
   - Correo electrónico
   - Rol (Ventas, Tesorería, Gerencia)
3. Confirme los datos y haga clic en "Registrar e Inicializar".

### 3.2. Asignación de Permisos

- Los usuarios nuevos reciben permisos por defecto según su rol:
  - **Ventas:** Registrar clientes y anticipos
  - **Tesorería:** Validar anticipos y aplicar a facturas
  - **Gerencia:** Aprobar aplicaciones y auditar conciliaciones
- Los permisos pueden modificarse en el panel de configuración de usuarios.

## 4. Navegación

### 4.1. Panel Principal

- **Dashboard:** Vista general de operaciones
- **Clientes:** Gestionar clientes registrados
- **Registros:** Crear nuevos registros financieros
- **Conciliación:** Realizar conciliaciones FIFO
- **Caja:** Control de caja chica y turnos
- **Aprobaciones:** Gestionar anticipos y aplicaciones
- **Auditoría:** Supervisar conciliaciones y cierres

### 4.2. Menú Lateral

- Acceda a las secciones principales desde el menú lateral izquierdo.
- Use el botón de logout en la barra superior para cerrar sesión.

## 5. Operaciones Clave

### 5.1. Conciliación FIFO

1. Navegue a la sección "Conciliación".
2. Seleccione un cliente y revise sus facturas pendientes.
3. Elija un anticipo disponible y aplique el monto a la factura.
4. Confirme la aplicación y espere la aprobación de Gerencia.

### 5.2. Control de Caja

1. Abra un turno de caja desde la sección "Caja".
2. Registre ingresos y egresos usando los formularios.
3. Realice un arqueo Z al cerrar el turno, comparando el saldo físico con el calculado.

## 6. Seguridad

- Todos los datos se almacenan encriptados.
- Los permisos de usuarios son gestionados por el rol y pueden ajustarse en el panel de configuración.
- No comparta sus credenciales con terceros.

## 7. Soporte

- Para reportar errores o solicitar nuevas funcionalidades, contacte al equipo de desarrollo.
- La documentación técnica se encuentra en el directorio `/docs` del proyecto.