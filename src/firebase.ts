import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Preferir variables de entorno, pero si faltan usar el config hardcoded (fallback) para facilitar el debug local.
// Usar un cast seguro para evitar errores de typing al indexar `import.meta.env`.
const env = (key: string) => (import.meta.env as Record<string, string | undefined>)[key] ?? undefined;

const envConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('VITE_FIREBASE_APP_ID')
};

// Fallback a valores anteriormente usados (solo para dev local si no tienes .env configurado)
const fallbackConfig = {
  apiKey: "AIzaSyB9INw9uKtO3KH-jd2H5twdltHCR20nrAY",
  authDomain: "test01megan.firebaseapp.com",
  projectId: "test01megan",
  storageBucket: "test01megan.firebasestorage.app",
  messagingSenderId: "817401515455",
  appId: "1:817401515455:web:317760137ba87f8886250axº"
};

const firebaseConfig = {
  apiKey: envConfig.apiKey ?? fallbackConfig.apiKey,
  authDomain: envConfig.authDomain ?? fallbackConfig.authDomain,
  projectId: envConfig.projectId ?? fallbackConfig.projectId,
  storageBucket: envConfig.storageBucket ?? fallbackConfig.storageBucket,
  messagingSenderId: envConfig.messagingSenderId ?? fallbackConfig.messagingSenderId,
  appId: envConfig.appId ?? fallbackConfig.appId
};

export { firebaseConfig }; // <-- export para debug y comprobaciones externas

if (!envConfig.apiKey || !envConfig.projectId || !envConfig.appId) {
  console.warn('Some VITE_FIREBASE_* vars are missing; using fallback firebase config. Add .env.local with VITE_FIREBASE_* to avoid this in production.');
}

// Inicializar Firebase de forma segura (evitar múltiples inits en HMR)
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

try {
  appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  authInstance = appInstance ? getAuth(appInstance) : null;
  dbInstance = appInstance ? getFirestore(appInstance) : null;
  console.info('Firebase initialized for projectId=', firebaseConfig.projectId, ' (using env vars?)', !!envConfig.apiKey);
} catch (e) {
  console.error('Firebase initialization error:', e);
}

export const auth: Auth | null = authInstance;
export const db: Firestore | null = dbInstance;
export default appInstance;
