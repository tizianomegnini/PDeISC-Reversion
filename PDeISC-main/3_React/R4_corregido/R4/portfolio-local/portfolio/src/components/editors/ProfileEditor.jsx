import { useEffect, useState } from "react";
import { apiGet, apiAuthed } from "../../lib/apiClient";
import { useEditMode } from "../../context/EditModeContext";
import { profile as fallbackProfile } from "../../data/fallbackData";
import "../../styles/editors.css";

const EMPTY = {
  name: "",
  role: "",
  location: "",
  summary: "",
  bio: "",
  email: "",
  github: "",
  linkedin: "",
  facts: [],
};

/**
 * ProfileEditor
 * -------------
 * Edita el perfil (un único registro guardado en la base local del
 * navegador, ver lib/apiClient.js): nombre, rol, bio, redes y los "facts" (datos
 * clave tipo "Años programando: 3+"). Cubre lo que se muestra en Hero,
 * Sobre mí y Contacto, porque las tres secciones leen del mismo perfil.
 */
export default function ProfileEditor() {
  const { notifyChanged } = useEditMode();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet("/profile");
      if (data) {
        setForm({ ...data, bio: (data.bio ?? []).join("\n\n") });
      } else {
        setForm({ ...fallbackProfile, bio: (fallbackProfile.bio ?? []).join("\n\n") });
      }
    } catch (err) {
      setForm({ ...fallbackProfile, bio: (fallbackProfile.bio ?? []).join("\n\n") });
      setStatus("No se pudo cargar el perfil guardado (" + err.message + "). Mostrando los datos originales.");
    }
    setLoading(false);
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateFact(index, key, value) {
    setForm((prev) => {
      const facts = [...prev.facts];
      facts[index] = { ...facts[index], [key]: value };
      return { ...prev, facts };
    });
  }

  function addFact() {
    setForm((prev) => ({ ...prev, facts: [...prev.facts, { label: "", value: "" }] }));
  }

  function removeFact(index) {
    setForm((prev) => ({ ...prev, facts: prev.facts.filter((_, i) => i !== index) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setStatus("Guardando…");
    const payload = {
      name: form.name,
      role: form.role,
      location: form.location,
      summary: form.summary,
      bio: form.bio.split("\n\n").map((p) => p.trim()).filter(Boolean),
      email: form.email,
      github: form.github,
      linkedin: form.linkedin,
      facts: form.facts,
    };
    try {
      await apiAuthed("/profile", "PUT", payload);
      setStatus("Guardado en este navegador. Para publicarlo, exportalo desde el botón de datos.");
      notifyChanged();
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  if (loading) return <p className="editor__status">Cargando…</p>;

  return (
    <form className="editor" onSubmit={handleSave}>
      {status && <p className="editor__status">{status}</p>}

      <div className="editor__row">
        <div className="editor__grid">
          <div className="editor__field">
            <label>Nombre</label>
            <input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
          </div>
          <div className="editor__field">
            <label>Rol / título</label>
            <input value={form.role} onChange={(e) => updateField("role", e.target.value)} />
          </div>
          <div className="editor__field">
            <label>Ubicación</label>
            <input value={form.location} onChange={(e) => updateField("location", e.target.value)} />
          </div>
          <div className="editor__field">
            <label>Email</label>
            <input value={form.email} onChange={(e) => updateField("email", e.target.value)} />
          </div>
          <div className="editor__field">
            <label>GitHub (URL completa)</label>
            <input value={form.github} onChange={(e) => updateField("github", e.target.value)} />
          </div>
          <div className="editor__field">
            <label>LinkedIn (URL completa)</label>
            <input value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
          </div>
        </div>

        <div className="editor__field">
          <label>Resumen corto (aparece en el Hero)</label>
          <textarea rows={2} value={form.summary} onChange={(e) => updateField("summary", e.target.value)} />
        </div>

        <div className="editor__field">
          <label>Biografía (separá los párrafos dejando una línea en blanco entre ellos)</label>
          <textarea rows={6} value={form.bio} onChange={(e) => updateField("bio", e.target.value)} />
        </div>
      </div>

      <div className="editor__row">
        <h4 className="editor__subtitle">Datos clave (sección "Sobre mí")</h4>
        {form.facts.map((fact, i) => (
          <div className="editor__grid" key={i} style={{ gridTemplateColumns: "1fr 1fr auto" }}>
            <div className="editor__field">
              <label>Etiqueta</label>
              <input value={fact.label} onChange={(e) => updateFact(i, "label", e.target.value)} />
            </div>
            <div className="editor__field">
              <label>Valor</label>
              <input value={fact.value} onChange={(e) => updateFact(i, "value", e.target.value)} />
            </div>
            <div className="editor__field" style={{ alignSelf: "end" }}>
              <button type="button" className="btn editor__danger" onClick={() => removeFact(i)}>
                Quitar
              </button>
            </div>
          </div>
        ))}
        <div>
          <button type="button" className="btn" onClick={addFact}>
            + Agregar dato
          </button>
        </div>
      </div>

      <div className="editor__actions">
        <button type="submit" className="btn btn--primary">
          Guardar perfil
        </button>
      </div>
    </form>
  );
}
