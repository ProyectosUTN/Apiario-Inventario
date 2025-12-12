# Implementación de Perfiles de Usuario

## Resumen de Cambios

Se ha implementado un sistema de perfiles de usuario que captura información adicional durante el registro, más allá del correo y contraseña.

## Cambios Realizados

### 1. Base de Datos (Firestore)

**Nueva Colección:** `users`

**Estructura de Documento:**
```typescript
{
  uid: string,              // ID del usuario de Firebase Auth
  email: string,            // Correo electrónico
  fullName: string,         // Nombre completo (requerido)
  phone: string | null,     // Teléfono (opcional)
  apiaryName: string | null,// Nombre del apiario (opcional)
  location: string | null,  // Ubicación (opcional)
  createdAt: string,        // Fecha de creación ISO
  updatedAt: string         // Fecha de última actualización ISO
}
```

**Reglas de Seguridad (firestore.rules):**
```javascript
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
}
```

Cada usuario solo puede leer y modificar su propio perfil.

### 2. Formulario de Registro (LoginScreen.tsx)

**Nuevos Campos Agregados:**
- ✅ **Nombre Completo** (requerido)
- ✅ **Teléfono** (opcional)
- ✅ **Nombre del Apiario** (opcional)
- ✅ **Ubicación** (opcional)

**Orden de los Campos en el Formulario:**
1. Nombre Completo *
2. Correo electrónico *
3. Teléfono
4. Nombre del Apiario
5. Ubicación
6. Contraseña *
7. Confirmar Contraseña *

### 3. Flujo de Registro

```typescript
1. Usuario completa el formulario
2. Validaciones:
   - Contraseñas coinciden
   - Contraseña mínimo 6 caracteres
   - Nombre completo no vacío
3. Se crea usuario en Firebase Auth
4. Se guarda perfil en Firestore (colección users)
5. Usuario queda autenticado automáticamente
```

## Uso de los Datos del Perfil

Para obtener los datos del perfil de un usuario en otros componentes:

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Obtener perfil del usuario actual
async function getUserProfile() {
  if (!auth?.currentUser || !db) return null;
  
  const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
}

// Uso
const profile = await getUserProfile();
console.log(profile.fullName); // Nombre del usuario
console.log(profile.apiaryName); // Nombre del apiario
```

## Próximos Pasos Sugeridos

### 1. Página de Perfil de Usuario
Crear una página donde el usuario pueda:
- Ver su información
- Editar sus datos
- Cambiar contraseña
- Subir foto de perfil

### 2. Mostrar Nombre en TopNav
En lugar de mostrar solo el correo, mostrar el nombre del usuario:
```typescript
// En TopNav.tsx
const [userName, setUserName] = useState('');

useEffect(() => {
  if (auth?.currentUser && db) {
    getDoc(doc(db, 'users', auth.currentUser.uid)).then(doc => {
      if (doc.exists()) {
        setUserName(doc.data().fullName);
      }
    });
  }
}, []);
```

### 3. Migración de Usuarios Existentes
Si ya tienes usuarios registrados sin perfil, crea un script de migración:

```typescript
// migrate-users.ts
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

async function migrateExistingUsers() {
  // Obtener todos los usuarios de Auth (requiere Admin SDK)
  // Por cada usuario sin documento en /users, crear uno:
  await setDoc(doc(db, 'users', userId), {
    uid: userId,
    email: userEmail,
    fullName: userEmail.split('@')[0], // Temporal
    phone: null,
    apiaryName: null,
    location: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}
```

## Despliegue

Después de estos cambios, necesitas desplegar las nuevas reglas de Firestore:

```bash
firebase deploy --only firestore:rules
```

O desplegar todo:
```bash
firebase deploy
```

## Notas Importantes

- ✅ Los datos se guardan automáticamente al crear la cuenta
- ✅ Solo el nombre completo es obligatorio
- ✅ Los campos opcionales se guardan como `null` si están vacíos
- ✅ Cada usuario solo puede acceder a su propio perfil
- ⚠️ No hay validación de formato de teléfono (puedes agregar una)
- ⚠️ Los usuarios existentes NO tienen perfil (necesitan migración)
