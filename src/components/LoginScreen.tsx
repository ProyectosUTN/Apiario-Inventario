import React, { useState } from 'react';


import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

// Usamos el placeholder para el icono de la rejilla (el logo)
const LogoIcon = () => (
    <div className="logo-circle">
        <div className="logo-icon"></div>
    </div>
);

const LoginScreen: React.FC = () => {
    // Definición de estados para el formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const emailTrimmed = email.trim();
            if (!auth) {
                throw new Error('Servicio de autenticación no inicializado');
            }
            await signInWithEmailAndPassword(auth, emailTrimmed, password);
            // onAuthStateChanged en App.tsx manejará la navegación
        } catch (err: unknown) {
            // Mapeo de códigos de error de Firebase a mensajes amigables
            const friendlyMap: Record<string, string> = {
                'auth/invalid-email': 'Correo electrónico inválido.',
                'auth/user-disabled': 'Usuario deshabilitado.',
                'auth/user-not-found': 'Usuario no encontrado.',
                'auth/wrong-password': 'Contraseña incorrecta.',
                'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.'
            };

            const error = err as { code?: string; message?: string };
            const codeStr = String(error?.code ?? '');
            const friendly = friendlyMap[codeStr] ?? error?.message ?? 'Error al iniciar sesión';
            setError(friendly);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <LogoIcon />
                <h1>ApiManager</h1>
                <h2>Iniciar Sesión en ApiManager</h2>
                <p className="tagline">Administra tu Apiario de forma segura y orgánica, desde un solo lugar.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="tucorreo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Accediendo...' : 'Acceder'}
                </button>

                {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
            </form>

            <div className="login-footer">
                <a href="#" className="link-forgot">¿Olvidaste tu contraseña?</a>
                <p>¿Aún no tienes cuenta? <a href="#" className="link-create-account">Crear cuenta</a></p>
                <p className="design-note">Una herramienta pensada para ti.</p>
            </div>
        </div>
    );
};

export default LoginScreen;