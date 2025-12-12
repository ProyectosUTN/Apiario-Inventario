import React, { useState } from 'react';


import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    
    // Campos adicionales para el perfil de usuario
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [apiaryName, setApiaryName] = useState('');
    const [location, setLocation] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // Validación de contraseñas si estamos en modo registro
        if (isRegistering) {
            if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }
            if (password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            if (!fullName.trim()) {
                setError('El nombre completo es requerido');
                return;
            }
        }

        setLoading(true);
        try {
            const emailTrimmed = email.trim();
            if (!auth) {
                throw new Error('Servicio de autenticación no inicializado');
            }
            
            if (isRegistering) {
                // Crear nuevo usuario
                const userCredential = await createUserWithEmailAndPassword(auth, emailTrimmed, password);
                const userId = userCredential.user.uid;
                
                // Guardar perfil de usuario en Firestore
                if (db) {
                    await setDoc(doc(db, 'users', userId), {
                        uid: userId,
                        email: emailTrimmed,
                        fullName: fullName.trim(),
                        phone: phone.trim() || null,
                        apiaryName: apiaryName.trim() || null,
                        location: location.trim() || null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            } else {
                // Iniciar sesión
                await signInWithEmailAndPassword(auth, emailTrimmed, password);
            }
            // onAuthStateChanged en App.tsx manejará la navegación
        } catch (err: unknown) {
            // Mapeo de códigos de error de Firebase a mensajes amigables
            const friendlyMap: Record<string, string> = {
                'auth/invalid-email': 'Correo electrónico inválido.',
                'auth/user-disabled': 'Usuario deshabilitado.',
                'auth/user-not-found': 'Usuario no encontrado.',
                'auth/wrong-password': 'Contraseña incorrecta.',
                'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
                'auth/email-already-in-use': 'Este correo ya está registrado.',
                'auth/weak-password': 'La contraseña es demasiado débil.'
            };

            const error = err as { code?: string; message?: string };
            const codeStr = String(error?.code ?? '');
            const friendly = friendlyMap[codeStr] ?? error?.message ?? (isRegistering ? 'Error al crear usuario' : 'Error al iniciar sesión');
            setError(friendly);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError(null);
        setConfirmPassword('');
        setFullName('');
        setPhone('');
        setApiaryName('');
        setLocation('');
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <LogoIcon />
                <h1>ApiManager</h1>
                <h2>{isRegistering ? 'Crear Cuenta en ApiManager' : 'Iniciar Sesión en ApiManager'}</h2>
                <p className="tagline">Administra tu Apiario de forma segura y orgánica, desde un solo lugar.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
                {isRegistering && (
                    <div className="input-group">
                        <label htmlFor="fullName">Nombre Completo *</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            placeholder="Tu nombre completo"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                )}

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

                {isRegistering && (
                    <>
                        <div className="input-group">
                            <label htmlFor="phone">Teléfono (opcional)</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                placeholder="+1 234 567 8900"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="apiaryName">Nombre del Apiario (opcional)</label>
                            <input
                                type="text"
                                id="apiaryName"
                                name="apiaryName"
                                placeholder="Mi Apiario"
                                value={apiaryName}
                                onChange={(e) => setApiaryName(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="location">Ubicación (opcional)</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                placeholder="Ciudad, País"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </>
                )}

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

                {isRegistering && (
                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (isRegistering ? 'Creando cuenta...' : 'Accediendo...') : (isRegistering ? 'Crear Cuenta' : 'Acceder')}
                </button>

                {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
            </form>

            <div className="login-footer">
                {!isRegistering && <a href="#" className="link-forgot">¿Olvidaste tu contraseña?</a>}
                <p>
                    {isRegistering ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
                    <a href="#" className="link-create-account" onClick={(e) => { e.preventDefault(); toggleMode(); }}>
                        {isRegistering ? 'Iniciar sesión' : 'Crear cuenta'}
                    </a>
                </p>
                <p className="design-note">Una herramienta pensada para ti.</p>
            </div>
        </div>
    );
};

export default LoginScreen;