# Instrucciones para Implementar Filtrado por Usuario

## ✅ Cambios Implementados

Se han realizado los siguientes cambios para que cada usuario solo vea sus propios datos:

### 1. **Reglas de Seguridad de Firestore** (`firestore.rules`)
- ✅ Actualizadas para que solo el usuario propietario pueda leer/escribir sus documentos
- ✅ Se verifica que `userId` coincida con el usuario autenticado

### 2. **Backend GraphQL** (`functions/index.js`)
- ✅ Todas las queries filtran por `userId` del usuario autenticado
- ✅ Todas las mutaciones agregan `userId` automáticamente al crear documentos
- ✅ Requiere autenticación para todas las operaciones

### 3. **Cliente GraphQL** (`src/api/graphqlClient.ts`)
- ✅ Ya estaba configurado para enviar el token de autenticación

---

## 🔧 Pasos para Completar la Configuración

### Paso 1: Migrar Datos Existentes

Los datos existentes en tu base de datos no tienen el campo `userId`, por lo que necesitas agregárselo.

#### Opción A: Usando Firebase Console (Recomendado para pocos datos)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** y copia el **User UID** del usuario propietario
4. Ve a **Firestore Database**
5. Para cada documento en las colecciones `insumos`, `colmenas`, `cosechas`:
   - Haz clic en el documento
   - Agrega un nuevo campo: `userId` con el valor del User UID
   - Guarda

#### Opción B: Usando el Script de Migración (Recomendado para muchos datos)

1. **Obtén el User ID:**
   ```bash
   # En Firebase Console > Authentication, copia el User UID del usuario
   ```

2. **Edita el script de migración:**
   ```bash
   # Abre migrate-add-userid.js
   # Reemplaza 'TU_USER_ID_AQUI' con el User UID real
   ```

3. **Instala firebase-admin si no lo tienes:**
   ```bash
   cd functions
   npm install firebase-admin
   cd ..
   ```

4. **Ejecuta la migración:**
   ```bash
   # Asegúrate de estar autenticado con Firebase CLI
   firebase login
   
   # Ejecuta el script
   node migrate-add-userid.js
   ```

### Paso 2: Desplegar las Nuevas Reglas de Firestore

```bash
# Despliega las reglas de seguridad actualizadas
firebase deploy --only firestore:rules
```

### Paso 3: Desplegar la Función GraphQL Actualizada

```bash
# Despliega la función GraphQL con los cambios
firebase deploy --only functions
```

### Paso 4: Verificar la Configuración

1. **Prueba el login:**
   - Inicia sesión en la aplicación
   - Verifica que veas tus datos

2. **Prueba con otro usuario:**
   - Crea otro usuario en Authentication
   - Inicia sesión con ese usuario
   - Verifica que NO vea los datos del primer usuario
   - Crea algunos datos nuevos
   - Verifica que solo vea sus propios datos

3. **Verifica los logs:**
   ```bash
   # Ver logs de las funciones
   firebase functions:log
   ```

---

## 🎯 Verificación de Seguridad

Después de desplegar, verifica que:

- ✅ Cada usuario solo ve sus propios datos
- ✅ No se pueden ver datos de otros usuarios
- ✅ Los nuevos datos creados tienen el campo `userId`
- ✅ Las reglas de Firestore bloquean el acceso no autorizado

---

## 📝 Notas Importantes

### Usuarios Múltiples en el Futuro

Si quieres que múltiples usuarios puedan compartir datos (por ejemplo, un equipo):

1. Agrega un campo `teamId` o `organizationId` a los documentos
2. Modifica las reglas de Firestore para verificar la pertenencia al equipo
3. Actualiza las queries del backend para filtrar por `teamId`

### Datos Antiguos

Los datos creados antes de esta actualización necesitan tener el campo `userId` agregado manualmente usando una de las opciones del Paso 1.

### Índices de Firestore

Firebase creará automáticamente los índices necesarios para las queries con `userId`. Si ves errores sobre índices faltantes:

1. Copia el enlace del error
2. Pégalo en el navegador
3. Firebase te pedirá crear el índice automáticamente

---

## 🚨 Solución de Problemas

### "Authentication required"
- Verifica que el usuario esté autenticado
- Revisa que el token se esté enviando correctamente en los headers

### "No se muestran datos después del deploy"
- Verifica que los datos existentes tengan el campo `userId`
- Ejecuta el script de migración si no lo has hecho

### "Permission denied"
- Las reglas de Firestore están bloqueando el acceso
- Asegúrate de haber desplegado las reglas actualizadas
- Verifica que el campo `userId` exista en los documentos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `firebase functions:log`
2. Verifica la consola del navegador (F12) para ver errores de autenticación
3. Revisa que todas las reglas estén correctamente desplegadas

