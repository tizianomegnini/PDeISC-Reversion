import { useState } from "react";
import Modal from "./Modal";
import { useEditMode } from "../context/EditModeContext";
import "../styles/editors.css";

/**
 * PasswordPromptModal
 * --------------------
 * Se muestra cuando alguien hace click en "✎ Editar" (o en el candado
 * flotante) sin haber desbloqueado todavía la edición. Solo pide la
 * contraseña; no hay usuario ni email.
 */
export default function PasswordPromptModal() {
  const { showPasswordPrompt, unlock, cancelPasswordPrompt } = useEditMode();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!showPasswordPrompt) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await unlock(password);
    setLoading(false);
    if (error) setError(error);
    else setPassword("");
  }

  return (
    <Modal title="Ingresá la contraseña para editar" onClose={cancelPasswordPrompt}>
      <form className="editor" onSubmit={handleSubmit}>
        <div className="editor__field">
          <label htmlFor="edit-password">Contraseña</label>
          <input
            id="edit-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="editor__status editor__danger">{error}</p>}
        <div className="editor__actions">
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Verificando…" : "Desbloquear"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
