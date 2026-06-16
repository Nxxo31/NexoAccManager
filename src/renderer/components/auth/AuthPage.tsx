import { useState } from 'react';
import Login from './Login';
import Register from './Register';

export default function AuthPage() {
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Llamar al API de autenticación
      // @ts-expect-error api existe en window via preload
      const result = await window.api.auth.login(email, password);
      if (result.success === false) {
        throw new Error(result.error || 'Error en el login');
      }
      
      // Guardar datos en localStorage para modo offline
      if (result.data && result.data.license) {
        localStorage.setItem('nexoLicenseData', JSON.stringify(result.data.license));
        localStorage.setItem('nexoUserId', result.data.userId);
        localStorage.setItem('nexoEmail', result.data.email);
      }
      
      // Notificar a la app principal que el usuario ha iniciado sesión
      // En una app real, esto haría que la vista principal cambie a 'accounts'
      // Por ahora, recargamos la página para que el useEffect en App.tsx détecte el cambio
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Llamar al API de registro
      // @ts-expect-error api existe en window via preload
      const result = await window.api.auth.register(email, password);
      if (result.success === false) {
        throw new Error(result.error || 'Error en el registro');
      }
      console.log('Registro exitoso:', result.data);
      // En una app real, aquí también iniciaríamos sesión automáticamente
      alert('Registro exitoso. Ahora puedes iniciar sesión');
      setShowRegister(false);
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Llamar al API de logout
      // @ts-expect-error api existe en window via preload
      const result = await window.api.auth.logout();
      if (result.success === false) {
        throw new Error(result.error || 'Error al cerrar sesión');
      }
      
      // Limpiar datos de localStorage
      localStorage.removeItem('nexoLicenseData');
      localStorage.removeItem('nexoUserId');
      localStorage.removeItem('nexoEmail');
      
      // Recargar para volver a la pantalla de login
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      {showRegister ? (
        <Register onRegister={handleRegister} onLogin={() => setShowRegister(false)} />
      ) : (
        <Login 
          onLogin={handleLogin} 
          onRegister={() => setShowRegister(true)}
          onLogout={handleLogout}
          loading={loading}
          error={error}
        />
      )}
      
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <button
          onClick={() => setShowRegister(!showRegister)}
          className={`text-sm text-[#a0a0a0] hover:text-white transition-colors`}
        >
          {showRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
}