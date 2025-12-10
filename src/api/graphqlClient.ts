// Minimal GraphQL client used by the frontend to call Functions GraphQL endpoint.
// Configure the endpoint via `VITE_GRAPHQL_URL` in your environment; fallback to Firebase Functions endpoint.
import { auth } from '../firebase';
const GRAPHQL_URL = (import.meta.env as Record<string, string | undefined>).VITE_GRAPHQL_URL ?? 'https://graphql-fpckkxzmsq-uc.a.run.app';

export async function fetchGraphQL(query: string, variables?: Record<string, unknown>) {
  console.log('[GraphQL] Iniciando petición a:', GRAPHQL_URL);
  console.log('[GraphQL] Query:', query.substring(0, 100) + '...');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    if (auth && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[GraphQL] Token de autenticación agregado');
      }
    } else {
      console.log('[GraphQL] No hay usuario autenticado o auth no está disponible');
    }
  } catch (e) {
    // If token retrieval fails, proceed without Authorization header.
    console.warn('[GraphQL] No se pudo obtener token:', e);
  }

  console.log('[GraphQL] Headers:', Object.keys(headers));
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });

  console.log('[GraphQL] Respuesta status:', res.status, res.statusText);
  if (!res.ok) {
    const text = await res.text();
    console.error('[GraphQL] Error de red:', text);
    throw new Error(`GraphQL network error: ${res.status} ${res.statusText} - ${text}`);
  }

  const json = await res.json();
  console.log('[GraphQL] JSON recibido:', json);
  
  // Handle Apollo Server v4 response format
  let responseData = json;
  if (json.kind === 'single' && json.singleResult) {
    console.log('[GraphQL] Detectado formato Apollo Server v4, extrayendo singleResult');
    responseData = json.singleResult;
  }
  
  if (responseData.errors && Array.isArray(responseData.errors)) {
    console.error('[GraphQL] Errores GraphQL:', responseData.errors);
    throw new Error(responseData.errors.map((e: any) => e.message ?? JSON.stringify(e)).join('; '));
  }
  
  console.log('[GraphQL] Data extraída:', responseData.data);
  return responseData.data;
}

export default {
  fetchGraphQL,
  GRAPHQL_URL
};
