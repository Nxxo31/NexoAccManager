import { useState } from 'react';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login({ 
  onLogin, 
  onRegister,
  loading,
  error 
}: { 
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setLocalError(null);
    setSuccess(null);

    try {
      await onLogin(formData.email, formData.password);
      setSuccess('Inicio de sesión exitoso');
    } catch (err: any) {
      setLocalError(err.message || 'Error al iniciar sesión');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d0d0d] to-[#161616]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Iniciar Sesión</h2>
          <p className="text-sm text-[#a0a0a0]">
            Accede a tu cuenta de NexoAccManager
          </p>
        </div>

        {error || localError && (
          <div className="p-4 bg-red-900/50 border border-red-600 rounded text-sm">
            {error || localError}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900/50 border border-green-600 rounded text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1e272e] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6347FF] text-white placeholder-[#a0a0a0]"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1e272e] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6347FF] text-white placeholder-[#a0a0a0]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={localLoading}
            className={`w-full flex items-center justify-center px-4 py-3 bg-[#6347FF] hover:bg-[#8B6FFF] 
                       text-white font-medium rounded-md transition-colors disabled:opacity-50`}
          >
            {localLoading ? (
              <>
                <svg className="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 014.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-13.583-8m0 0a8.003 8.003 0 0113.583-8m0 0A8.003 8.003 0 0016.583 8m-6.583 0a5.586 5.586 0 01-5.583 5.583m11.166 3a5.586 5.586 0 01-5.583 5.583m0-11.166a5.586 5.586 0 005.583 5.583m0 0a5.586 5.586 0 015.583 5.583Z" />
                </svg>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="text-center text-sm text-[#a0a0a0]">
          <p>
            ¿No tienes una cuenta?{' '}
            <button onClick={onRegister} className="text-[#6347FF] hover:text-[#8B6FFF] underline">
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}