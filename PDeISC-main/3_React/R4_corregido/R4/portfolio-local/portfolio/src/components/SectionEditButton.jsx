import { useEditMode } from "../context/EditModeContext";

/**
 * SectionEditButton
 * -----------------
 * Botón "✎ Editar" que va al lado del título de cada sección. Al hacer
 * click, pide la contraseña si todavía no se desbloqueó, y después abre
 * el editor correspondiente (ver EditModeContext.openEditor).
 *
 * @param {"profile"|"skills"|"experience"|"achievements"|"projects"} kind
 */
export default function SectionEditButton({ kind, label = "Editar" }) {
  const { openEditor } = useEditMode();

  return (
    <button type="button" className="section-edit-btn" onClick={() => openEditor(kind)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      {label}
    </button>
  );
}
