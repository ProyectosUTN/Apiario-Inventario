declare module '*.css';

// Extender InputHTMLAttributes para incluir el atributo capture
declare namespace React {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    capture?: boolean | 'user' | 'environment';
  }
}
