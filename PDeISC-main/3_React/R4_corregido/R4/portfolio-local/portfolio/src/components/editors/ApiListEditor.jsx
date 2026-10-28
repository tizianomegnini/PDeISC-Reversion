import { useEffect, useState } from "react";
import { apiGet, apiAuthed } from "../../lib/apiClient";
import { useEditMode } from "../../context/EditModeContext";
import "../../styles/editors.css";

/**
 * ApiListEditor
 * -------------
 * Componente genérico de "CRUD" (crear, leer, actualizar, borrar) para
 * un recurso de la API (/api/skills, /api/experience, etc). Se reutiliza
 * para Skills, Experience, Achievements y Projects pasándole una
 * configuración de columnas distinta, en vez de repetir el mismo código
 * cuatro veces.
 *
 * @param {string} resource - path del recurso en la API (ej: "/skills").
 * @param {Array<{key:string, label:string, type?: "text"|"number"|"textarea"|"tags"}>} fields
 *        "tags" se muestra como texto separado por comas y se guarda como array.
 */
export default function ApiListEditor({ resource, fields }) {
  const { notifyChanged } = useEditMode();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [newRow, setNewRow] = useState(() => emptyRow(fields));
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  async function loadRows() {
    setLoading(true);
    try {
      const data = await apiGet(resource);
      setRows(data ?? []);
    } catch (err) {
      setStatus("No se pudo cargar: " + err.message);
    }
    setLoading(false);
  }

  function emptyRow(fields) {
    const row = {};
    fields.forEach((f) => (row[f.key] = ""));
    return row;
  }

  function toApiValue(field, value) {
    if (field.type === "tags") {
      return typeof value === "string"
        ? value.split(",").map((t) => t.trim()).filter(Boolean)
        : value;
    }
    if (field.type === "number") return value === "" ? null : Number(value);
    return value;
  }

  function toInputValue(field, value) {
    if (field.type === "tags") return Array.isArray(value) ? value.join(", ") : value ?? "";
    return value ?? "";
  }

  function buildPayload(source) {
    const payload = {};
    fields.forEach((f) => (payload[f.key] = toApiValue(f, source[f.key])));
    return payload;
  }

  async function handleAdd(e) {
    e.preventDefault();
    setStatus("Guardando…");
    try {
      await apiAuthed(resource, "POST", buildPayload(newRow));
      setNewRow(emptyRow(fields));
      setStatus("Agregado.");
      notifyChanged();
      loadRows();
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  async function handleUpdate(row) {
    setStatus("Guardando…");
    try {
      await apiAuthed(`${resource}/${row.id}`, "PUT", buildPayload(row));
      setStatus("Guardado.");
      notifyChanged();
      loadRows();
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      setStatus("Borrando…");
      await apiAuthed(`${resource}/${deleteTarget.id}`, "DELETE");
      setDeleteTarget(null);
      setStatus("Elemento borrado.");
      notifyChanged();
      await loadRows();
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  function updateLocalRow(id, key, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  return (
    <div>
      {status && <p className="editor__status">{status}</p>}

      <div className="editor">
        {loading && <p className="editor__status">Cargando…</p>}

        {!loading &&
          rows.map((row) => (
            <div className="editor__row" key={row.id}>
              <div className="editor__grid">
                {fields.map((f) => (
                  <div className="editor__field" key={f.key}>
                    <label>{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={toInputValue(f, row[f.key])}
                        onChange={(e) => updateLocalRow(row.id, f.key, e.target.value)}
                      />
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        value={toInputValue(f, row[f.key])}
                        onChange={(e) => updateLocalRow(row.id, f.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="editor__actions">
                <button type="button" className="btn editor__danger" onClick={() => setDeleteTarget(row)}>
                  Borrar
                </button>
                <button type="button" className="btn btn--primary" onClick={() => handleUpdate(row)}>
                  Guardar cambios
                </button>
              </div>
            </div>
          ))}

        {!loading && rows.length === 0 && <p className="editor__status">Todavía no hay elementos.</p>}

        <form className="editor__add" onSubmit={handleAdd}>
          <h4 className="editor__subtitle">Agregar nuevo</h4>
          <div className="editor__grid">
            {fields.map((f) => (
              <div className="editor__field" key={f.key}>
                <label>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={newRow[f.key] ?? ""}
                    onChange={(e) => setNewRow((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    value={newRow[f.key] ?? ""}
                    onChange={(e) => setNewRow((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="editor__actions">
            <button type="submit" className="btn btn--primary">
              Agregar
            </button>
          </div>
        </form>
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal-panel modal-panel--small"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <div className="modal-header">
              <h3 id="delete-title">Confirmar eliminación</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Cancelar"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿Seguro que querés eliminar este elemento? Esta acción no se puede deshacer.
              </p>
              <div className="editor__actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn editor__danger"
                  onClick={handleDelete}
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
