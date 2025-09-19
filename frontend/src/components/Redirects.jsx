import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Redirects() {
  const [redirects, setRedirects] = useState([]);
  const [shortcode, setShortcode] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editShortcode, setEditShortcode] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRedirects = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://195.35.36.251:8000/api/redirects/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRedirects(response.data.redirects || []);
      } catch (err) {
        const status = err.response?.status;
        if (status === 401) {
          localStorage.removeItem('token');
          setError('Sesión expirada. Por favor inicia sesión nuevamente.');
          navigate('/login');
        } else {
          setError(err.response?.data?.detail || 'Error al cargar redirecciones');
        }
      }
    };

    fetchRedirects();
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('token');

    try {
      await axios.post('http://195.35.36.251:8000/api/redirects/', {
        shortcode,
        target_url: targetUrl
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const response = await axios.get('http://195.35.36.251:8000/api/redirects/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRedirects(response.data.redirects || []);
      setShortcode('');
      setTargetUrl('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear redirección');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');

    try {
      await axios.delete(`http://195.35.36.251:8000/api/redirects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRedirects(redirects.filter(r => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar redirección');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      await axios.put(`http://195.35.36.251:8000/api/redirects/${editingId}`, {
        shortcode: editShortcode,
        target_url: editTargetUrl
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const response = await axios.get('http://195.35.36.251:8000/api/redirects/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRedirects(response.data.redirects || []);
      setEditingId(null);
      setEditShortcode('');
      setEditTargetUrl('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al editar redirección');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestionar Redirecciones</h1>
          <h1 className="text-2xl font-bold">Dirección base: www.deceyec.cloud</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleCreate} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="shortcode" className="block text-sm font-medium text-gray-700">Nombre del Archivo</label>
              <input
                type="text"
                id="shortcode"
                value={shortcode}
                onChange={(e) => setShortcode(e.target.value)}
                className="mt-1 p-2 w-full border rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="target_url" className="block text-sm font-medium text-gray-700">URL destino</label>
              <input
                type="url"
                id="target_url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="mt-1 p-2 w-full border rounded-md"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!shortcode || !targetUrl}
          >
            Crear Redirección
          </button>
        </form>

        <h2 className="text-xl font-semibold mb-4">Tus Redirecciones</h2>

        {redirects.length === 0 ? (
          <p className="text-gray-600">No tienes redirecciones creadas aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">Nombre del Archivo</th>
                  <th className="px-4 py-2 text-left">URL destino</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {redirects.map(redirect => (
                  <tr key={redirect.id} className="border-b">
                    <td className="px-4 py-2">
                      <a
                        href={`/${redirect.shortcode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {redirect.shortcode}
                      </a>
                    </td>
                    <td className="px-4 py-2">{redirect.target_url}</td>
                    <td className="px-4 py-2">
                      {editingId === redirect.id ? (
                        <form onSubmit={handleEdit} className="flex flex-col md:flex-row gap-2">
                          <input
                            type="text"
                            value={editShortcode}
                            onChange={(e) => setEditShortcode(e.target.value)}
                            className="p-2 border rounded-md w-full md:w-1/3"
                            required
                          />
                          <input
                            type="url"
                            value={editTargetUrl}
                            onChange={(e) => setEditTargetUrl(e.target.value)}
                            className="p-2 border rounded-md w-full md:w-2/3"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="bg-gray-400 text-white px-3 py-1 rounded-md hover:bg-gray-500"
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(redirect.id);
                              setEditShortcode(redirect.shortcode);
                              setEditTargetUrl(redirect.target_url);
                            }}
                            className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 mr-2"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(redirect.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Redirects;