# Documentación del Sistema de Gestión de Apiarios

## Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Propósito y Objetivos](#propósito-y-objetivos)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Tecnologías Utilizadas](#tecnologías-utilizadas)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
7. [Flujo de Datos](#flujo-de-datos)
8. [Lógica de Negocio](#lógica-de-negocio)
9. [Sistema de Autenticación](#sistema-de-autenticación)
10. [Base de Datos](#base-de-datos)
11. [API GraphQL](#api-graphql)
12. [Interfaz de Usuario](#interfaz-de-usuario)
13. [Gestión de Imágenes](#gestión-de-imágenes)
14. [Instalación y Configuración](#instalación-y-configuración)
15. [Mantenimiento y Extensibilidad](#mantenimiento-y-extensibilidad)

---

## 📖 Descripción General

**Sistema de Gestión de Inventario para Apiarios** es una aplicación web moderna diseñada para apicultores y administradores de apiarios que necesitan llevar un control detallado de sus operaciones apícolas. El sistema permite gestionar:

- **Colmenas**: Registro y seguimiento de cada colmena con información detallada
- **Cosechas**: Control de producción de miel con métricas y análisis
- **Inventario**: Gestión de insumos, herramientas y materiales
- **Dashboard**: Visualización de métricas clave y alertas en tiempo real

La aplicación está construida con tecnologías web modernas, utiliza Firebase como backend (autenticación, base de datos y almacenamiento), y proporciona una interfaz intuitiva y responsiva para facilitar la gestión diaria de un apiario.

---

## Propósito y Objetivos

### Problema que Resuelve
Los apicultores tradicionalmente llevan registros manuales en papel o spreadsheets, lo que dificulta:
- El seguimiento histórico de cada colmena
- La identificación rápida de problemas (stock bajo, colmenas inactivas)
- El análisis de producción
- La coordinación entre múltiples operadores

### Objetivos Principales
1. **Centralizar la información**: Todos los datos de colmenas, cosechas e inventario en un solo lugar
2. **Proporcionar visibilidad**: Dashboard con métricas clave y alertas automáticas
3. **Facilitar el seguimiento**: Historial fotográfico y notas de cada colmena
4. **Optimizar recursos**: Control de inventario con alertas de stock bajo
5. **Análisis de producción**: Métricas de producción mensual y por colmena

---

## Arquitectura del Sistema

### Modelo de Arquitectura: Cliente-Servidor con Backend como Servicio (BaaS)

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE CLIENTE                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │         React SPA (Single Page Application)      │  │
│  │  - Vite como bundler                              │  │
│  │  - TypeScript para type safety                    │  │
│  │  - React Router para navegación                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕️ HTTPS
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE API                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Firebase Cloud Functions (GraphQL)           │  │
│  │  - Apollo Server                                  │  │
│  │  - Express middleware                             │  │
│  │  - Autenticación JWT                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Firestore  │  │ Firebase Auth│  │   Storage   │  │
│  │   Database   │  │              │  │   (Images)  │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Características de la Arquitectura

**Frontend (React + TypeScript)**
- SPA con routing del lado del cliente
- State management local con React Hooks
- Comunicación con backend vía GraphQL
- Polling automático para datos en tiempo real
- Autenticación persistente con Firebase Auth

**Backend (Firebase Cloud Functions)**
- API GraphQL serverless
- Validación de tokens JWT
- CRUD operations con Firestore
- Lógica de negocio centralizada
- CORS configurado para seguridad

**Datos (Firebase)**
- Firestore: Base de datos NoSQL para datos estructurados
- Firebase Auth: Gestión de usuarios y autenticación
- Firebase Storage: Almacenamiento de imágenes de colmenas

---

## Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **React** | 19.2.0 | Framework de UI para componentes reactivos |
| **TypeScript** | 5.9.3 | Type safety y mejor experiencia de desarrollo |
| **Vite** | 7.2.4 | Build tool moderno, rápido HMR |
| **Firebase SDK** | 12.6.0 | Cliente para servicios Firebase |
| **ESLint** | 9.39.1 | Linting de código para calidad |

### Backend
| Tecnología | Propósito |
|-----------|-----------|
| **Firebase Cloud Functions** | Serverless compute para API |
| **Apollo Server** | Servidor GraphQL |
| **Express** | Middleware HTTP |
| **Firebase Admin SDK** | Acceso privilegiado a servicios Firebase |

### Infraestructura
| Servicio | Propósito |
|---------|-----------|
| **Firebase Hosting** | Hosting de la aplicación web |
| **Cloud Firestore** | Base de datos NoSQL en tiempo real |
| **Firebase Authentication** | Sistema de autenticación |
| **Firebase Storage** | Almacenamiento de archivos (fotos) |
| **Cloud Functions** | Ejecución de código backend |

---

## Estructura del Proyecto

```
Apiario-Inventario/
├── Archivos de Configuración
│   ├── package.json              # Dependencias y scripts de npm
│   ├── tsconfig.json             # Configuración TypeScript
│   ├── vite.config.ts            # Configuración Vite
│   ├── eslint.config.js          # Reglas de linting
│   ├── firebase.json             # Configuración Firebase
│   ├── firestore.rules           # Reglas de seguridad Firestore
│   ├── firestore.indexes.json    # Índices de Firestore
│   └── storage.rules             # Reglas de seguridad Storage
│
├── src/                          # Código fuente del frontend
│   ├── main.tsx                  # Entry point de la aplicación
│   ├── App.tsx                   # Componente raíz
│   ├── App.css                   # Estilos globales
│   ├── firebase.ts               # Configuración Firebase cliente
│   │
│   ├── components/            # Componentes React
│   │   ├── LoginScreen.tsx       # Pantalla de inicio de sesión
│   │   ├── DashboardScreen.tsx   # Dashboard principal
│   │   ├── InventoryPage.tsx     # Página de inventario
│   │   ├── InventoryList.tsx     # Lista de items del inventario
│   │   ├── InventoryItemEditor.tsx # Editor de items
│   │   ├── ColmenaPage.tsx       # Gestión de colmenas
│   │   ├── CosechaPage.tsx       # Gestión de cosechas
│   │   └── TopNav.tsx            # Barra de navegación
│   │
│   └──api/                   # Capa de comunicación
│       └── graphqlClient.ts      # Cliente GraphQL
│
├── functions/                 # Cloud Functions (Backend)
│   ├── index.js                  # Servidor GraphQL
│   └── package.json              # Dependencias del backend
│
└── public/                    # Archivos estáticos
    └── index.html                # HTML base
```

---

## Módulos y Funcionalidades

### 1. Módulo de Autenticación

**Archivo**: `src/components/LoginScreen.tsx`

**Funcionalidad**: 
- Login con email y password usando Firebase Authentication
- Persistencia de sesión automática
- Validación de credenciales

**Flujo**:
1. Usuario ingresa email y contraseña
2. Se llama a `signInWithEmailAndPassword()` de Firebase
3. Firebase valida las credenciales
4. Si son correctas, Firebase retorna un token JWT
5. El token se almacena automáticamente y se usa en todas las peticiones
6. La app actualiza el estado y muestra el dashboard

### 2. Módulo de Dashboard

**Archivo**: `src/components/DashboardScreen.tsx`

**Funcionalidad**:
- Visualización de métricas clave del apiario
- Sistema de alertas automáticas
- Polling de datos cada 5 segundos
- Navegación a otros módulos

**Métricas Mostradas**:
- Colmenas activas (estado = true)
- Producción de miel del mes actual
- Sistema de alertas automáticas (8 tipos diferentes)
- Estado general del apiario

**Sistema Completo de Alertas**:

El dashboard implementa un sistema inteligente de alertas que monitorea múltiples aspectos del apiario:

#### 1. Alerta: Reemplazo de Reina por Edad
**Condición**: `edadReinaMeses > 18`  
**Severidad**: `warning` (Amarillo)  
**Descripción**: Detecta colmenas con reinas que superan los 18 meses de edad  
**Acción recomendada**: Programar reemplazo de reina para prevenir colapso de colonia y mantener productividad

#### 2. Alerta: Necesidad Potencial de Alza
**Condición**: `cantidadAlzas >= 3`  
**Severidad**: `info` (Azul)  
**Descripción**: Identifica colmenas con 3 o más alzas que pueden requerir expansión  
**Acción recomendada**: Considerar agregar alza adicional para evitar enjambrazón

#### 3. Alerta: Colmena sin Inspeccionar
**Condición**: `fechaInstalacion > 6 meses` AND `sin cosechas en últimos 3 meses`  
**Severidad**: `warning` (Amarillo)  
**Descripción**: Detecta colmenas instaladas hace más de 6 meses sin actividad de cosecha reciente  
**Acción recomendada**: Verificar estado de la colmena y evaluar productividad

#### 4. Alerta: Colmena Inactiva
**Condición**: `estado === false`  
**Severidad**: `critical` (Rojo)  
**Descripción**: Identifica colmenas marcadas como inactivas en el sistema  
**Acción recomendada**: Confirmar estado físico y actualizar inventario

#### 5. Alerta: Stock de Insumos Bajo/Negativo
**Condición**: `cantidad < 5`  
**Severidad**: 
- `critical` (Rojo) si cantidad < 0 - Stock negativo
- `warning` (Amarillo) si 0 ≤ cantidad < 5 - Stock bajo  
**Descripción**: Monitorea nivel de inventario de insumos y materiales  
**Acción recomendada**: Reabastecer insumos según prioridad

#### 6. Alerta: Riesgo de Fermentación por Humedad
**Condición**: `humedad > 18.5%` en cosechas  
**Severidad**: `critical` (Rojo)  
**Descripción**: Detecta miel con niveles de humedad que pueden causar fermentación  
**Acción recomendada**: Separar lote inmediatamente y aplicar tratamiento de deshidratación

#### 7. Alerta: Bajo Rendimiento por Panal
**Condición**: `(cantidadKg / panalesExtraidos) < 1.0 kg/panal`  
**Severidad**: `warning` (Amarillo)  
**Descripción**: Identifica colmenas con rendimiento inferior al estándar  
**Acción recomendada**: Investigar posibles causas (sanidad, orfandad, falta de floración)

#### 8. Alerta: Registro de Cosecha Incompleto
**Condición**: `floracion` vacío OR `operador` vacío  
**Severidad**: `warning` (Amarillo)  
**Descripción**: Detecta registros de cosecha con información faltante  
**Acción recomendada**: Completar datos para mejorar trazabilidad y análisis

**Algoritmo de Generación de Alertas**:
```javascript
// Se ejecuta en cada polling (cada 5 segundos)
1. Obtener datos completos: colmenas, insumos, cosechas
2. Evaluar cada tipo de alerta secuencialmente:
   a. Verificar edad de reinas en colmenas activas
   b. Revisar cantidad de alzas en colmenas activas
   c. Detectar colmenas sin inspección (6+ meses sin cosecha)
   d. Identificar colmenas inactivas
   e. Verificar niveles de stock de insumos
   f. Analizar humedad en cosechas
   g. Calcular rendimiento por panal
   h. Validar completitud de registros de cosecha
3. Asignar severidad según condiciones
4. Ordenar alertas por prioridad (critical > warning > info)
5. Mostrar en dashboard con enlaces a páginas específicas
```

**Navegación Inteligente de Alertas**:
Cada alerta incluye:
- `targetPage`: Página donde se puede resolver (colmenas, inventory, cosechas)
- `targetItemId`: ID del elemento específico afectado
- Permite al usuario navegar directamente al origen del problema

**Cálculo de Producción Mensual**:
```javascript
// Obtener mes y año actual
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

// Filtrar cosechas del mes
const cosechasDelMes = cosechas.filter(cosecha => {
  const fecha = new Date(cosecha.fecha);
  return fecha.getMonth() === currentMonth && 
         fecha.getFullYear() === currentYear;
});

// Sumar cantidades
const totalKg = cosechasDelMes.reduce((total, cosecha) => 
  total + (cosecha.cantidadKg || 0), 0
);
```

### 3. Módulo de Colmenas

**Archivo**: `src/components/ColmenaPage.tsx`

**Funcionalidad**:
- CRUD completo de colmenas
- Carga de fotos con Firebase Storage
- Filtrado y búsqueda
- Información detallada de cada colmena

**Campos de Colmena**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `codigo` | String | Identificador único de la colmena |
| `apiarioID` | String | ID del apiario al que pertenece |
| `tipo` | String | Tipo de colmena (Langstroth, etc.) |
| `estado` | Boolean | Activa (true) o Inactiva (false) |
| `cantidadAlzas` | Number | Número de alzas en la colmena |
| `edadReinaMeses` | Number | Edad de la reina en meses |
| `origenReina` | String | Procedencia de la reina |
| `fechaInstalacion` | String | Fecha de instalación (ISO 8601) |
| `fotoURL` | String | URL de la foto en Firebase Storage |
| `notas` | String | Observaciones adicionales |

**Gestión de Fotos**:
```javascript
// Flujo de carga de foto:
1. Usuario selecciona archivo (validación: tipo image/*, máx 10MB)
2. Se genera preview local con FileReader
3. Al guardar:
   a. Se sube a Firebase Storage: /colmenas/{id}/foto.jpg
   b. Se obtiene downloadURL
   c. Se guarda la URL en Firestore
4. Al editar/eliminar foto:
   a. Si hay URL anterior, se elimina archivo de Storage
   b. Se sube nueva foto
   c. Se actualiza URL en Firestore
```

### 4. Módulo de Cosechas

**Archivo**: `src/components/CosechaPage.tsx`

**Funcionalidad**:
- Registro de cosechas por colmena
- Filtros por colmena y apiario
- Cálculo de totales
- Métricas de producción

**Campos de Cosecha**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `colmenaId` | String | ID de la colmena cosechada |
| `fecha` | String | Fecha de cosecha (ISO 8601) |
| `cantidadKg` | Number | Cantidad en kilogramos |
| `panalesExtraidos` | Number | Número de panales extraídos |
| `tipoMiel` | String | Tipo (multifloral, monofloral, etc.) |
| `floracion` | String | Tipo de floración predominante |
| `humedad` | Number | Porcentaje de humedad |
| `metodo` | String | Método de extracción |
| `operador` | String | Persona que realizó la cosecha |
| `notas` | String | Observaciones |

**Filtrado Inteligente**:
```javascript
// Se puede filtrar por:
1. Colmena específica: Muestra solo cosechas de esa colmena
2. Apiario: Filtra colmenas del apiario, luego sus cosechas
3. Sin filtro: Muestra todas las cosechas
```

### 5. Módulo de Inventario

**Archivos**: 
- `src/components/InventoryPage.tsx`
- `src/components/InventoryList.tsx`
- `src/components/InventoryItemEditor.tsx`

**Funcionalidad**:
- Gestión de insumos y materiales
- Ajustes rápidos de cantidad (+/-)
- Categorización por tipo
- Sistema de badges por categoría
- Polling automático cada 5 segundos

**Campos de Insumo**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | String | Nombre del insumo |
| `descripcion` | String | Descripción detallada |
| `cantidad` | Number | Cantidad disponible |
| `unidad` | String | Unidad de medida (kg, L, unidades) |
| `tipo` | String | Categoría (herramienta, insumo, etc.) |
| `creadoEn` | Timestamp | Fecha de creación |

**Sistema de Categorización**:
```javascript
// Badges de color según tipo:
- Herramientas → Badge azul
- Insumos/Consumibles → Badge verde
- Materiales → Badge gris
- Miel/Alimentos → Badge ámbar
- Medicamentos → Badge rojo
- Otros → Badge por defecto
```

**Ajustes de Cantidad**:
- Botón `+`: Incrementa en 1
- Botón `-`: Decrementa en 1
- Editor completo: Permite cambiar cualquier campo

### 6. Módulo de Navegación

**Archivo**: `src/components/TopNav.tsx`

**Funcionalidad**:
- Barra de navegación inferior (bottom nav)
- 4 opciones: Dashboard, Inventario, Colmenas, Cosechas
- Indicador visual de página activa
- Botón de logout

---

## Flujo de Datos

### Arquitectura de Comunicación

```
┌────────────────────────────────────────────────────┐
│              COMPONENTE REACT                      │
│  (ColmenaPage, InventoryList, DashboardScreen)    │
└───────────────────┬────────────────────────────────┘
                    │ 1. Llama fetchGraphQL()
                    ↓
┌────────────────────────────────────────────────────┐
│          graphqlClient.ts                          │
│  - Obtiene token JWT del usuario                   │
│  - Construye petición HTTP POST                    │
│  - Incluye Authorization header                    │
└───────────────────┬────────────────────────────────┘
                    │ 2. HTTP POST /graphql
                    ↓
┌────────────────────────────────────────────────────┐
│     CLOUD FUNCTION (Apollo Server)                 │
│  - Valida token JWT                                │
│  - Parsea query/mutation GraphQL                   │
│  - Ejecuta resolver correspondiente                │
└───────────────────┬────────────────────────────────┘
                    │ 3. Operación Firestore
                    ↓
┌────────────────────────────────────────────────────┐
│            FIRESTORE DATABASE                      │
│  - Lee/Escribe datos                               │
│  - Valida reglas de seguridad                      │
│  - Retorna resultado                               │
└───────────────────┬────────────────────────────────┘
                    │ 4. Respuesta JSON
                    ↓
┌────────────────────────────────────────────────────┐
│         COMPONENTE REACT                           │
│  - Actualiza estado local                          │
│  - Re-renderiza UI                                 │
└────────────────────────────────────────────────────┘
```

### Ejemplo Detallado: Crear una Colmena

**1. Usuario completa formulario y hace clic en "Guardar"**

**2. Componente ejecuta**:
```typescript
const createColmena = async (data: ColmenaInput) => {
  // Si hay foto, primero subirla
  if (selectedFile) {
    const photoURL = await uploadPhoto(data.id, selectedFile);
    data.fotoURL = photoURL;
  }
  
  // Mutation GraphQL
  const mutation = `
    mutation CreateColmena($input: ColmenaInput!) {
      createColmena(input: $input) {
        id
        codigo
        tipo
        estado
        ...
      }
    }
  `;
  
  await fetchGraphQL(mutation, { input: data });
};
```

**3. Cliente GraphQL**:
```typescript
async function fetchGraphQL(query, variables) {
  // Obtener token
  const token = await auth.currentUser.getIdToken();
  
  // Hacer petición
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });
  
  return response.json();
}
```

**4. Cloud Function recibe y procesa**:
```javascript
// Resolver en functions/index.js
const resolvers = {
  Mutation: {
    createColmena: async (_, { input }, context) => {
      // context.user ya fue validado por middleware
      
      // Crear documento en Firestore
      const docRef = await db.collection('colmenas').add({
        ...input,
        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        creadoPor: context.user.uid
      });
      
      // Retornar con ID generado
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    }
  }
};
```

**5. Respuesta vuelve al componente**:
```typescript
// En ColmenaPage.tsx
await createColmena(formData);
// Recargar lista
await fetchColmenas();
// Cerrar modal
setIsCreating(false);
```

---

## Lógica de Negocio

### Reglas de Negocio Implementadas

#### 1. **Sistema Completo de Alertas**

El sistema implementa 8 tipos diferentes de alertas que monitorean todos los aspectos críticos del apiario:

**Alertas de Colmenas**:
1. **Reemplazo de Reina**: `edadReinaMeses > 18` → Prevenir colapso de colonia
2. **Necesidad de Alza**: `cantidadAlzas >= 3` → Prevenir enjambrazón
3. **Sin Inspeccionar**: Instalada >6 meses sin cosecha en 3 meses → Verificar productividad
4. **Colmena Inactiva**: `estado === false` → Confirmar estado físico

**Alertas de Inventario**:
5. **Stock Bajo/Negativo**: `cantidad < 5` → Reabastecer insumos
   - CRÍTICO: cantidad < 0 (stock negativo)
   - ADVERTENCIA: 0 ≤ cantidad < 5 (stock bajo)

**Alertas de Cosechas**:
6. **Riesgo de Fermentación**: `humedad > 18.5%` → Tratamiento inmediato
7. **Bajo Rendimiento**: `kg/panal < 1.0` → Investigar causas
8. **Registro Incompleto**: Faltan datos de floración u operador → Completar información

**Severidades**:
- `critical` (Rojo): Requiere acción inmediata (stock negativo, humedad alta, colmena inactiva)
- `warning` (Amarillo): Requiere atención pronto (stock bajo, reina vieja, bajo rendimiento)
- `info` (Azul): Información preventiva (necesidad de alza)

**Implementación**:
```javascript
// En DashboardScreen.tsx - Sistema completo de alertas
const generateAlerts = (colmenas, insumos, cosechas) => {
  const alerts = [];
  
  // 1. Reemplazo de Reina
  colmenas.forEach(colmena => {
    if (colmena.estado && colmena.edadReinaMeses > 18) {
      alerts.push({
        title: `Reemplazo de Reina: ${colmena.codigo}`,
        description: `La reina tiene ${colmena.edadReinaMeses} meses`,
        severity: 'warning',
        targetPage: 'colmenas',
        targetItemId: colmena.id
      });
    }
  });
  
  // 2. Necesidad de Alza
  colmenas.forEach(colmena => {
    if (colmena.estado && colmena.cantidadAlzas >= 3) {
      alerts.push({
        title: `Considerar agregar alza: ${colmena.codigo}`,
        severity: 'info',
        targetPage: 'colmenas'
      });
    }
  });
  
  // 3. Colmena sin Inspeccionar
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  colmenas.forEach(colmena => {
    const instalacion = new Date(colmena.fechaInstalacion);
    const sinCosechasRecientes = !cosechas.some(c => 
      c.colmenaId === colmena.id && 
      new Date(c.fecha) >= threeMonthsAgo
    );
    
    if (colmena.estado && instalacion < sixMonthsAgo && sinCosechasRecientes) {
      alerts.push({
        title: `Colmena sin inspeccionar: ${colmena.codigo}`,
        severity: 'warning',
        targetPage: 'colmenas'
      });
    }
  });
  
  // 4. Colmena Inactiva
  colmenas.forEach(colmena => {
    if (!colmena.estado) {
      alerts.push({
        title: `Colmena inactiva: ${colmena.codigo}`,
        severity: 'critical',
        targetPage: 'colmenas'
      });
    }
  });
  
  // 5. Stock de Insumos
  insumos
    .filter(i => i.cantidad < 5)
    .sort((a, b) => a.cantidad - b.cantidad)
    .forEach(insumo => {
      alerts.push({
        title: insumo.cantidad < 0 
          ? `Stock negativo: ${insumo.nombre}`
          : `Stock bajo: ${insumo.nombre}`,
        severity: insumo.cantidad < 0 ? 'critical' : 'warning',
        targetPage: 'inventory'
      });
    });
  
  // 6. Riesgo de Fermentación
  cosechas.forEach(cosecha => {
    if (cosecha.humedad > 18.5) {
      alerts.push({
        title: `Riesgo de fermentación`,
        description: `Humedad de ${cosecha.humedad}%`,
        severity: 'critical',
        targetPage: 'cosechas'
      });
    }
  });
  
  // 7. Bajo Rendimiento
  cosechas.forEach(cosecha => {
    const rendimiento = cosecha.cantidadKg / cosecha.panalesExtraidos;
    if (cosecha.panalesExtraidos > 0 && rendimiento < 1.0) {
      alerts.push({
        title: `Bajo rendimiento: ${rendimiento.toFixed(1)} kg/panal`,
        severity: 'warning',
        targetPage: 'colmenas'
      });
    }
  });
  
  // 8. Registro Incompleto
  cosechas.forEach(cosecha => {
    if (!cosecha.floracion || !cosecha.operador) {
      alerts.push({
        title: 'Datos incompletos en cosecha',
        severity: 'warning',
        targetPage: 'cosechas'
      });
    }
  });
  
  return alerts;
};
```

#### 2. **Estados de Colmena**

**Regla**: Una colmena puede estar activa o inactiva

**Lógica**:
- `estado = true`: Colmena activa, produciendo
- `estado = false`: Colmena inactiva (problema, mantenimiento, etc.)

**Impacto**:
- Solo colmenas activas se cuentan en métricas del dashboard
- Filtros pueden mostrar/ocultar colmenas inactivas
- Cosechas solo se pueden registrar en colmenas activas

#### 3. **Cálculo de Producción Mensual**

**Regla**: Sumar todas las cosechas del mes actual

**Implementación**:
```javascript
const calculateMonthlyProduction = (cosechas) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return cosechas
    .filter(c => {
      const fecha = new Date(c.fecha);
      return fecha.getMonth() === currentMonth &&
             fecha.getFullYear() === currentYear;
    })
    .reduce((total, c) => total + (c.cantidadKg || 0), 0);
};
```

#### 4. **Validación de Fotos**

**Reglas**:
- Tipo de archivo: Solo imágenes (image/*)
- Tamaño máximo: 10MB
- Formato recomendado: JPEG, PNG

**Implementación**:
```javascript
const validatePhoto = (file) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Debe ser una imagen');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Tamaño máximo: 10MB');
  }
  return true;
};
```

#### 5. **Sincronización en Tiempo Real**

**Estrategia**: Polling cada 5 segundos

**Razón**: Firestore real-time listeners pueden ser costosos; el polling es más predecible

**Implementación**:
```javascript
useEffect(() => {
  // Carga inicial
  loadData();
  
  // Polling cada 5 segundos
  const interval = setInterval(loadData, 5000);
  
  // Cleanup
  return () => clearInterval(interval);
}, []);
```

---

## Sistema de Autenticación

### Flujo de Autenticación

```
┌──────────────┐
│   Usuario    │
│ Ingresa      │
│ Credenciales │
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│  Firebase Auth       │
│  Valida Email/Pass   │
└──────┬───────────────┘
       │
       ↓ (Si válido)
┌──────────────────────┐
│  Genera JWT Token    │
│  Válido por 1 hora   │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  Cliente guarda      │
│  token en memoria    │
│  (no localStorage)   │
└──────┬───────────────┘
       │
       ↓ (En cada petición)
┌──────────────────────┐
│  Incluye token en    │
│  Authorization header│
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  Cloud Function      │
│  Verifica token      │
│  con Admin SDK       │
└──────┬───────────────┘
       │
       ↓ (Si válido)
┌──────────────────────┐
│  Procesa petición    │
│  con contexto user   │
└──────────────────────┘
```

### Implementación en Cliente

**firebase.ts**:
```typescript
import { getAuth } from 'firebase/auth';

// Inicializar Auth
const auth = getAuth(app);
```

**LoginScreen.tsx**:
```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Firebase automáticamente actualiza auth.currentUser
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

**App.tsx** (Protección de rutas):
```typescript
const App = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Escuchar cambios de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);
  
  if (!user) {
    return <LoginScreen />;
  }
  
  return <DashboardScreen user={user} />;
};
```

### Implementación en Backend

**functions/index.js** (Middleware de autenticación):
```javascript
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Adjuntar info del usuario
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

app.use('/graphql', authMiddleware);
```

### Seguridad

**Reglas de Firestore** (firestore.rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer/escribir
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Reglas de Storage** (storage.rules):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /colmenas/{colmenaId}/{allPaths=**} {
      // Solo usuarios autenticados pueden subir/leer fotos
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Base de Datos

### Modelo de Datos Firestore

#### Colección: `insumos`

```javascript
{
  id: "auto-generated-id",
  nombre: "Azúcar",
  descripcion: "Azúcar blanca para alimentación",
  cantidad: 25,
  unidad: "kg",
  tipo: "insumo",
  creadoEn: Timestamp
}
```

**Índices**: 
- `nombre` (ASC) para búsqueda
- `tipo` (ASC), `cantidad` (ASC) para filtros

#### Colección: `colmenas`

```javascript
{
  id: "auto-generated-id",
  codigo: "COL-001",
  apiarioID: "apiario-norte",
  tipo: "Langstroth",
  estado: true,
  cantidadAlzas: 3,
  edadReinaMeses: 8,
  origenReina: "Criador local",
  fechaInstalacion: "2024-06-15",
  fotoURL: "https://storage.googleapis.com/...",
  notas: "Colmena muy productiva",
  creadoEn: Timestamp
}
```

**Índices**:
- `apiarioID` (ASC) para filtros por apiario
- `estado` (ASC), `codigo` (ASC) para listados

#### Colección: `cosechas`

```javascript
{
  id: "auto-generated-id",
  colmenaId: "colmena-id-ref",
  fecha: "2024-11-20",
  cantidadKg: 15.5,
  panalesExtraidos: 6,
  tipoMiel: "multifloral",
  floracion: "primavera",
  humedad: 17.5,
  metodo: "centrifuga",
  operador: "Juan Pérez",
  notas: "Excelente calidad",
  creadoEn: Timestamp
}
```

**Índices**:
- `colmenaId` (ASC), `fecha` (DESC) para historial
- `fecha` (DESC) para listado cronológico

### Relaciones

```
┌────────────┐           ┌────────────┐
│  colmenas  │ 1      N  │  cosechas  │
│            ├──────────→│            │
│  id        │           │ colmenaId  │
└────────────┘           └────────────┘

     │
     │ N:1
     ↓
┌────────────┐
│  apiarios  │
│ (futuro)   │
└────────────┘
```

---

## API GraphQL

### Schema Completo

```graphql
type Query {
  # Obtener todos los insumos
  insumos: [InventoryItem]
  
  # Obtener todas las colmenas
  colmenas: [Colmena]
  
  # Obtener todas las cosechas
  cosechas: [Cosecha]
}

type Mutation {
  # Inventario
  createInsumo(input: InventoryItemInput!): InventoryItem
  updateInsumo(id: ID!, input: InventoryItemInput!): InventoryItem
  deleteInsumo(id: ID!): Boolean
  
  # Colmenas
  createColmena(input: ColmenaInput!): Colmena
  updateColmena(id: ID!, input: ColmenaInput!): Colmena
  deleteColmena(id: ID!): Boolean
  
  # Cosechas
  createCosecha(input: CosechaInput!): Cosecha
  updateCosecha(id: ID!, input: CosechaInput!): Cosecha
  deleteCosecha(id: ID!): Boolean
}

# Tipos
type InventoryItem {
  id: ID!
  nombre: String
  descripcion: String
  cantidad: Float
  unidad: String
  tipo: String
  creadoEn: String
}

type Colmena {
  id: ID!
  apiarioID: String
  cantidadAlzas: Int
  codigo: String
  edadReinaMeses: Int
  estado: Boolean
  fechaInstalacion: String
  fotoURL: String
  notas: String
  origenReina: String
  tipo: String
}

type Cosecha {
  id: ID!
  cantidadKg: Float
  colmenaId: String
  fecha: String
  floracion: String
  humedad: Float
  metodo: String
  notas: String
  operador: String
  panalesExtraidos: Int
  tipoMiel: String
  creadoEn: String
}

# Inputs
input InventoryItemInput {
  nombre: String
  descripcion: String
  cantidad: Float
  unidad: String
  tipo: String
}

input ColmenaInput {
  apiarioID: String
  cantidadAlzas: Int
  codigo: String
  edadReinaMeses: Int
  estado: Boolean
  fechaInstalacion: String
  fotoURL: String
  notas: String
  origenReina: String
  tipo: String
}

input CosechaInput {
  cantidadKg: Float
  colmenaId: String
  fecha: String
  floracion: String
  humedad: Float
  metodo: String
  notas: String
  operador: String
  panalesExtraidos: Int
  tipoMiel: String
}
```

### Ejemplos de Uso

**Query: Obtener todas las colmenas activas**
```graphql
query {
  colmenas {
    id
    codigo
    estado
    tipo
    cantidadAlzas
  }
}
```

**Mutation: Crear nueva cosecha**
```graphql
mutation {
  createCosecha(input: {
    colmenaId: "col-123",
    fecha: "2024-12-11",
    cantidadKg: 18.5,
    panalesExtraidos: 8,
    tipoMiel: "multifloral",
    metodo: "centrifuga",
    operador: "Juan Pérez"
  }) {
    id
    cantidadKg
    fecha
  }
}
```

**Mutation: Actualizar inventario**
```graphql
mutation {
  updateInsumo(id: "ins-456", input: {
    cantidad: 30
  }) {
    id
    nombre
    cantidad
  }
}
```

---

## Interfaz de Usuario

### Diseño Visual

**Paleta de Colores**:
- Primario: `#4A90E2` (Azul apicultura)
- Secundario: `#FFC107` (Amarillo miel)
- Éxito: `#4CAF50`
- Advertencia: `#FF9800`
- Error: `#F44336`
- Fondo: `#F5F5F5`

**Tipografía**:
- Font: System fonts (San Francisco, Segoe UI, Roboto)
- Tamaños: 12px (small), 14px (body), 16px (subtitle), 20px (title)

### Componentes Reutilizables

#### Botones
```css
.btn-primary {
  background: #4A90E2;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.btn-danger {
  background: #F44336;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}
```

#### Cards
```css
.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 12px;
}
```

#### Badges
```css
.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-tools { background: #2196F3; color: white; }
.badge-supply { background: #4CAF50; color: white; }
.badge-warning { background: #FF9800; color: white; }
.badge-critical { background: #F44336; color: white; }
```

### Responsive Design

La aplicación está optimizada para:
- Móviles (320px - 767px)
- Tablets (768px - 1023px)
- Desktop (1024px+)

**Breakpoints**:
```css
/* Mobile first approach */
@media (min-width: 768px) {
  /* Tablet */
}

@media (min-width: 1024px) {
  /* Desktop */
}
```

---

## 📸 Gestión de Imágenes

### Firebase Storage

**Estructura de carpetas**:
```
storage_bucket/
└── colmenas/
    ├── {colmena-id-1}/
    │   └── foto.jpg
    ├── {colmena-id-2}/
    │   └── foto.jpg
    └── ...
```

### Flujo de Subida

```javascript
// 1. Crear referencia
const storageRef = ref(storage, `colmenas/${colmenaId}/foto.jpg`);

// 2. Subir archivo
await uploadBytes(storageRef, file);

// 3. Obtener URL pública
const downloadURL = await getDownloadURL(storageRef);

// 4. Guardar URL en Firestore
await updateColmena(colmenaId, { fotoURL: downloadURL });
```

### Optimizaciones

1. **Validación del lado del cliente**:
   - Tipo de archivo
   - Tamaño máximo
   - Preview antes de subir

2. **Limpieza de archivos antiguos**:
   ```javascript
   // Al actualizar foto, eliminar la anterior
   if (colmena.fotoURL) {
     const oldRef = ref(storage, colmena.fotoURL);
     await deleteObject(oldRef);
   }
   ```

3. **Compresión (futuro)**:
   - Usar Cloud Functions para generar thumbnails
   - Comprimir imágenes grandes automáticamente

---

## ⚙️ Instalación y Configuración

### Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Firebase (plan Blaze para Cloud Functions)
- Git

### Paso 1: Clonar el Repositorio

```bash
git clone <repository-url>
cd Apiario-Inventario
```

### Paso 2: Instalar Dependencias

```bash
# Frontend
npm install

# Backend (Cloud Functions)
cd functions
npm install
cd ..
```

### Paso 3: Configurar Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)

2. Habilitar servicios:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Cloud Functions

3. Obtener configuración del proyecto (Project Settings > General)

4. Crear archivo `.env.local` en la raíz:
```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.storage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
VITE_GRAPHQL_URL=https://graphql-xxx.cloudfunctions.net
```

### Paso 4: Configurar Firestore y Storage

```bash
# Deploy reglas de seguridad
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy índices
firebase deploy --only firestore:indexes
```

### Paso 5: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### Paso 6: Crear Usuario Administrador

```bash
# En Firebase Console > Authentication
# Add user > Email/Password
```

### Paso 7: Ejecutar Localmente

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview
```

### Paso 8: Deploy a Producción

```bash
# Build frontend
npm run build

# Deploy a Firebase Hosting
firebase deploy --only hosting
```

---

## 🔧 Mantenimiento y Extensibilidad

### Estructura de Código

**Principios**:
- Componentes funcionales con Hooks
- TypeScript para type safety
- Separación de lógica de UI
- API GraphQL centralizada

### Agregar Nueva Entidad

**Ejemplo**: Agregar módulo "Apiarios"

1. **Actualizar Schema GraphQL** (functions/index.js):
```javascript
const typeDefs = `
  ...
  type Apiario {
    id: ID!
    nombre: String
    ubicacion: String
    cantidadColmenas: Int
  }
  
  input ApiarioInput {
    nombre: String
    ubicacion: String
    cantidadColmenas: Int
  }
  
  extend type Query {
    apiarios: [Apiario]
  }
  
  extend type Mutation {
    createApiario(input: ApiarioInput!): Apiario
    updateApiario(id: ID!, input: ApiarioInput!): Apiario
    deleteApiario(id: ID!): Boolean
  }
`;
```

2. **Crear Resolvers**:
```javascript
const resolvers = {
  Query: {
    apiarios: async () => {
      const snapshot = await db.collection('apiarios').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  },
  Mutation: {
    createApiario: async (_, { input }) => {
      const docRef = await db.collection('apiarios').add(input);
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    },
    ...
  }
};
```

3. **Crear Componente React**:
```typescript
// src/components/ApiarioPage.tsx
import React, { useEffect, useState } from 'react';
import { fetchGraphQL } from '../api/graphqlClient';

type Apiario = {
  id: string;
  nombre: string;
  ubicacion: string;
  cantidadColmenas: number;
};

const ApiarioPage: React.FC = () => {
  const [apiarios, setApiarios] = useState<Apiario[]>([]);
  
  useEffect(() => {
    loadApiarios();
  }, []);
  
  const loadApiarios = async () => {
    const query = `query { apiarios { id nombre ubicacion cantidadColmenas } }`;
    const data = await fetchGraphQL(query);
    setApiarios(data.apiarios);
  };
  
  return (
    <div>
      <h2>Apiarios</h2>
      {apiarios.map(apiario => (
        <div key={apiario.id}>
          <h3>{apiario.nombre}</h3>
          <p>{apiario.ubicacion}</p>
          <p>{apiario.cantidadColmenas} colmenas</p>
        </div>
      ))}
    </div>
  );
};

export default ApiarioPage;
```

4. **Agregar a Navegación**:
```typescript
// App.tsx
<TopNav 
  page={page} 
  onNavigate={setPage}
  pages={['dashboard', 'inventory', 'colmenas', 'cosechas', 'apiarios']}
/>
```

### Testing

**Testing Recomendado**:
```bash
# Instalar dependencias
npm install --save-dev vitest @testing-library/react

# Crear test
// src/components/__tests__/DashboardScreen.test.tsx
```

### Monitoreo

**Firebase Console**:
- Functions logs: Ver errores y latencias
- Firestore usage: Monitorear reads/writes
- Storage usage: Tamaño de archivos

**Alertas**:
- Configurar alertas de cuota en Firebase Console
- Monitorear costos mensualmente

### Backup

**Estrategia de Backup**:
```bash
# Export Firestore
gcloud firestore export gs://[BUCKET_NAME]/[EXPORT_FOLDER]

# Automatizar con Cloud Scheduler
```

---

## Métricas y KPIs

### Métricas del Sistema

- **Colmenas activas**: `COUNT(colmenas WHERE estado = true)`
- **Producción mensual**: `SUM(cosechas.cantidadKg WHERE MONTH(fecha) = current_month)`
- **Alertas activas**: Sistema de 8 tipos de alertas que monitorean:
  - Salud de colmenas (edad reina, alzas, estado)
  - Niveles de inventario
  - Calidad de miel (humedad)
  - Rendimiento de producción
  - Completitud de datos
- **Promedio por colmena**: `producción_total / colmenas_activas`

### Tipos de Alertas y Umbrales

| Tipo de Alerta | Condición | Severidad | Umbral |
|----------------|-----------|-----------|---------|
| Reemplazo de Reina | edadReinaMeses > 18 | warning | 18 meses |
| Necesidad de Alza | cantidadAlzas >= 3 | info | 3 alzas |
| Sin Inspeccionar | >6 meses sin cosecha | warning | 6 meses + 3 meses sin cosecha |
| Colmena Inactiva | estado = false | critical | - |
| Stock Negativo | cantidad < 0 | critical | 0 |
| Stock Bajo | cantidad < 5 | warning | 5 unidades |
| Riesgo Fermentación | humedad > 18.5% | critical | 18.5% |
| Bajo Rendimiento | kg/panal < 1.0 | warning | 1.0 kg/panal |
| Datos Incompletos | campos vacíos | warning | - |

### Reportes Disponibles

1. **Producción por Colmena**
2. **Evolución Mensual**
3. **Stock de Insumos**
4. **Historial de Cosechas**

---

## Roadmap Futuro

### Funcionalidades Planificadas

- [ ] Reportes y gráficos avanzados
- [ ] Exportación a PDF/Excel
- [ ] Notificaciones push
- [ ] App móvil nativa
- [ ] Integración con sensores IoT
- [ ] Sistema de tareas programadas
- [ ] Multi-tenant (múltiples apiarios)
- [ ] Marketplace de insumos

---

## Soporte y Contacto

Para preguntas, sugerencias o reportes de bugs, contactar al equipo de desarrollo.

---

**Última actualización**: Diciembre 11, 2025
**Versión**: 1.0.0
