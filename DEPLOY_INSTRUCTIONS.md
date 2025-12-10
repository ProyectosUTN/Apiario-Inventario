# Despliegue del Backend GraphQL a Firebase Functions

## Implementación Completada

Backend GraphQL completo implementado en Firebase Functions con las siguientes características:

### Características

- **Apollo Server v4** con GraphQLs
- **Autenticación Firebase** (Bearer token)
- **Firestore** como base de datos
- **CORS** habilitado
- **Queries disponibles:**
  - `insumos` - Obtener todos los ítems del inventario
  - `insumo(id)` - Obtener un ítem específico

- **Mutations disponibles:**
  - `createInsumo(input)` - Crear nuevo ítem
  - `updateInsumo(id, input)` - Actualizar ítem existente
  - `deleteInsumo(id)` - Eliminar ítem

### Pasos para Desplegar

1. **Construir el Frontend**
   ```powershell
   npm run build
   ```

2. **Desplegar a Firebase** (Functions + Hosting)
   ```powershell
   firebase deploy
   ```

   O desplegar solo las Functions:
   ```powershell
   firebase deploy --only functions
   ```

3. **Verificar el Despliegue**
   - Functions: `https://us-central1-apiary-inventory.cloudfunctions.net/graphql`
   - Hosting: `https://apiary-inventory.web.app` o `https://apiary-inventory.firebaseapp.com`

### Probar Localmente

1. **Iniciar Emuladores de Firebase**
   ```powershell
   firebase emulators:start
   ```

2. **Actualizar `.env.local`** con el endpoint local:
   ```
   VITE_GRAPHQL_URL=http://localhost:5001/apiary-inventory/us-central1/graphql
   ```

3. **Iniciar el Frontend**
   ```powershell
   npm run dev
   ```

### Ejemplo de Query GraphQL

```graphql
query {
  insumos {
    id
    nombre
    descripcion
    cantidad
    unidad
    tipo
    creadoEn
  }
}
```

### Ejemplo de Mutation

```graphql
mutation {
  createInsumo(input: {
    nombre: "Miel"
    descripcion: "Miel de abeja pura"
    cantidad: 50
    unidad: "kg"
    tipo: "producto"
  }) {
    id
    nombre
    cantidad
  }
}
```

### Autenticación

El backend verifica el token de Firebase Authentication en el header `Authorization: Bearer <token>`. El cliente GraphQL (`src/api/graphqlClient.ts`) ya está configurado para enviar automáticamente el token del usuario autenticado.

### Notas Importantes

- Las mutations requieren autenticación
- El endpoint de producción es: `https://us-central1-apiary-inventory.cloudfunctions.net/graphql`
- La colección de Firestore es `insumos`

### Archivos Modificados

- `functions/index.js` - Implementación completa del servidor GraphQL
-  `functions/package.json` - Dependencias actualizadas
-  `src/api/graphqlClient.ts` - Endpoint actualizado a Firebase Functions
-  `firebase.json` - Configuración de hosting actualizada (dist folder)
-  `.firebaserc` - Proyecto cambiado a `apiary-inventory`
