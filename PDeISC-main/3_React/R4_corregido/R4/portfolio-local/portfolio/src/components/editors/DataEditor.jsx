import { useRef, useState } from "react";
import { exportData, importData, resetData } from "../../lib/apiClient";
import { useEditMode } from "../../context/EditModeContext";
import "../../styles/editors.css";

/**
 * DataEditor
 * ----------
 * Panel para llevarse / traerse el contenido del portfolio. Los cambios que
 * importar, exportar o restablecer el contenido compartido en Railway.
 */
export default function DataEditor() {
  const { notifyChanged } = useEditMode();
  const fileRef = useRef(null);
  const [status, setStatus] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  async function handleExport() {
    try {
      const json = JSON.stringify(await exportData(), null, 2) + "\n";
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "seed.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Listo: se descargÃ³ el contenido actual del portfolio.");
    } catch (err) {
      setStatus("No se pudo exportar: " + err.message);
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await importData(JSON.parse(await file.text()));
      notifyChanged();
      setStatus("Contenido importado.");
    } catch (err) {
      setStatus("No se pudo importar: " + err.message);
    }
  }

  async function handleReset() {
    try {
      await resetData();
      notifyChanged();
      setConfirmReset(false);
      setStatus("El contenido de Railway volviÃ³ a los datos iniciales de seed.json.");
    } catch (err) {
      setStatus("No se pudo restablecer: " + err.message);
    }
  }

  return (
    <div className="editor">
      {status && <p className="editor__status">{status}</p>}

      <div className="editor__row">
        <p>
          El contenido se guarda en <strong>Railway</strong> y los cambios quedan disponibles para todos los visitantes.
        </p>
        <div className="editor__actions">
          <button type="button" className="btn btn--primary" onClick={handleExport}>
            Exportar contenido
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Importar archivoâ€¦
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
        </div>
      </div>

      <div className="editor__row">
        <h4 className="editor__subtitle">Descartar cambios</h4>
        <p>Reemplaza el contenido compartido en Railway por los datos iniciales de seed.json.</p>
        <div className="editor__actions">
          {confirmReset ? (
            <>
              <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
              <button type="button" className="btn editor__danger" onClick={handleReset}>
                SÃ­, restablecer
              </button>
            </>
          ) : (
            <button type="button" className="btn editor__danger" onClick={() => setConfirmReset(true)}>
              Restablecer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

