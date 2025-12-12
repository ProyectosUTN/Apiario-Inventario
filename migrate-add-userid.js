/**
 * Script de migración para agregar userId a documentos existentes
 * 
 * Este script actualiza todos los documentos existentes en las colecciones
 * insumos, colmenas y cosechas para agregar el campo userId.
 * 
 * IMPORTANTE: Debes especificar el userId del usuario propietario antes de ejecutar.
 * 
 * Para ejecutar:
 * 1. Instala las dependencias si no lo has hecho: npm install firebase-admin
 * 2. Configura la autenticación con Firebase Admin SDK
 * 3. Ejecuta: node migrate-add-userid.js
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
// Asegúrate de tener configuradas las credenciales de servicio
// O que estés autenticado con Firebase CLI
admin.initializeApp();
const db = admin.firestore();

// CONFIGURA AQUÍ EL USER ID DEL USUARIO PROPIETARIO
// Puedes obtenerlo desde Firebase Console > Authentication
const DEFAULT_USER_ID = 'TU_USER_ID_AQUI'; // <<< CAMBIAR ESTO

async function migrateCollection(collectionName) {
  console.log(`\n=== Migrando colección: ${collectionName} ===`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    console.log(`Encontrados ${snapshot.docs.length} documentos`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Si ya tiene userId, saltarlo
      if (data.userId) {
        console.log(`✓ ${doc.id} - Ya tiene userId, saltando`);
        skipped++;
        continue;
      }
      
      // Agregar userId
      await doc.ref.update({
        userId: DEFAULT_USER_ID
      });
      
      console.log(`✓ ${doc.id} - userId agregado`);
      updated++;
    }
    
    console.log(`\nResumen ${collectionName}:`);
    console.log(`  - Actualizados: ${updated}`);
    console.log(`  - Saltados: ${skipped}`);
    console.log(`  - Total: ${snapshot.docs.length}`);
    
  } catch (error) {
    console.error(`Error migrando ${collectionName}:`, error);
  }
}

async function main() {
  console.log('===========================================');
  console.log('  MIGRACIÓN: Agregar userId a documentos');
  console.log('===========================================');
  console.log(`User ID que se asignará: ${DEFAULT_USER_ID}`);
  
  if (DEFAULT_USER_ID === 'TU_USER_ID_AQUI') {
    console.error('\n❌ ERROR: Debes configurar DEFAULT_USER_ID en el script');
    console.error('   1. Ve a Firebase Console > Authentication');
    console.error('   2. Copia el User UID del usuario propietario');
    console.error('   3. Reemplaza "TU_USER_ID_AQUI" en este script');
    process.exit(1);
  }
  
  // Confirmar antes de ejecutar
  console.log('\n⚠️  ADVERTENCIA: Este script modificará todos los documentos');
  console.log('   en las colecciones: insumos, colmenas, cosechas');
  console.log('\nPresiona Ctrl+C para cancelar o espera 5 segundos para continuar...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Migrar cada colección
  await migrateCollection('insumos');
  await migrateCollection('colmenas');
  await migrateCollection('cosechas');
  await migrateCollection('alerts');
  
  console.log('\n===========================================');
  console.log('  ✓ Migración completada');
  console.log('===========================================');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
