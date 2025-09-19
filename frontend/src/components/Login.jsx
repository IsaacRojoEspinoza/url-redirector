import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // limpiar token previo
      localStorage.removeItem('token');

      const response = await axios.post(
        'http://195.35.36.251:8000/api/login',
        new URLSearchParams({
          username: email,
          password: password,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const token = response.data?.access_token;
      if (!token) {
        throw new Error('Token no recibido del servidor');
      }

      localStorage.setItem('token', token);
      navigate('/redirects');
    } catch (err) {
      console.error('Login error:', err);

      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;

        if (status === 401) {
          setError('Credenciales incorrectas');
        } else if (status === 400) {
          setError(detail || 'Solicitud inválida');
        } else {
          setError(detail || 'Error inesperado al iniciar sesión');
        }
      } else {
        setError('No se pudo conectar con el servidor');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
