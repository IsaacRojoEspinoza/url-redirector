import { useState } from "react";
import { updateRedirect } from "../services/redirectService";

export default function EditRedirectForm({ redirect, token, onSuccess }) {
  const [shortcode, setShortcode] = useState(redirect.shortcode);
  const [targetUrl, setTargetUrl] = useState(redirect.target_url);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateRedirect(redirect.id, { shortcode, target_url: targetUrl }, token);
      onSuccess(updated); // actualiza la lista o redirige
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Shortcode:
        <input value={shortcode} onChange={(e) => setShortcode(e.target.value)} />
      </label>
      <label>
        Target URL:
        <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
      </label>
      <button type="submit">Guardar cambios</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}