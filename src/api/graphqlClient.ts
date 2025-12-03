// Minimal GraphQL client used by the frontend to call Functions GraphQL endpoint.
// Configure the endpoint via `VITE_GRAPHQL_URL` in your environment; fallback to a common local path.
import { auth } from '../firebase';
const GRAPHQL_URL = (import.meta.env as Record<string, string | undefined>).VITE_GRAPHQL_URL ?? '/.netlify/functions/graphql';

export async function fetchGraphQL(query: string, variables?: Record<string, unknown>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    if (auth && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // If token retrieval fails, proceed without Authorization header.
    console.warn('Could not get idToken for GraphQL request', e);
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL network error: ${res.status} ${res.statusText} - ${text}`);
  }

  const json = await res.json();
  if (json.errors && Array.isArray(json.errors)) {
    throw new Error(json.errors.map((e: any) => e.message ?? JSON.stringify(e)).join('; '));
  }
  return json.data;
}

export default {
  fetchGraphQL,
  GRAPHQL_URL
};
