import { useEditMode } from "../context/EditModeContext";
import "../styles/editors.css";

/**
 * EditModeButton
 * --------------
 * Botón flotante (esquina inferior izquierda) que muestra si la edición
 * está bloqueada o desbloqueada, y permite cambiar de estado. No hace
 * falta hacer click acá para editar: cada sección tiene su propio botón
 * "✎ Editar" que pide la contraseña automáticamente la primera vez.
 * Este botón sirve sobre todo para "cerrar sesión" (volver a bloquear).
 */
export default function EditModeButton() {
  const { unlocked, toggleLock, openEditor, checking } = useEditMode();

  if (checking) return null;

  return (
    <>
    {unlocked && (
      <button
        type="button"
        className="edit-mode-btn edit-mode-btn--data"
        onClick={() => openEditor("data")}
        title="Exportar / importar contenido"
        aria-label="Exportar / importar contenido"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      </button>
    )}
    <button
      type="button"
      className={`edit-mode-btn ${unlocked ? "edit-mode-btn--unlocked" : ""}`}
      onClick={toggleLock}
      title={unlocked ? "Bloquear edición" : "Desbloquear edición"}
      aria-label={unlocked ? "Bloquear edición" : "Desbloquear edición"}
    >
      {unlocked ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 7.2-2.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      )}
    </button>
    </>
  );
}
