import Modal from "./Modal";
import { useEditMode } from "../context/EditModeContext";
import ProfileEditor from "./editors/ProfileEditor";
import ApiListEditor from "./editors/ApiListEditor";
import DataEditor from "./editors/DataEditor";

const EDITORS = {
  data: { title: "Datos del portfolio", render: () => <DataEditor /> },
  profile: { title: "Editar perfil", render: () => <ProfileEditor /> },
  skills: {
    title: "Editar habilidades",
    render: () => (
      <ApiListEditor
        resource="/skills"
        fields={[
          { key: "group_name", label: "Categoría (ej: Frontend)", type: "text" },
          { key: "name", label: "Habilidad", type: "text" },
          { key: "level", label: "Nivel (0-100)", type: "number" },
        ]}
      />
    ),
  },
  experience: {
    title: "Editar experiencia",
    render: () => (
      <ApiListEditor
        resource="/experience"
        fields={[
          { key: "role", label: "Puesto", type: "text" },
          { key: "org", label: "Organización", type: "text" },
          { key: "period", label: "Período (ej: 2024 — Presente)", type: "text" },
          { key: "description", label: "Descripción", type: "textarea" },
          { key: "tags", label: "Etiquetas (separadas por coma)", type: "tags" },
        ]}
      />
    ),
  },
  achievements: {
    title: "Editar logros",
    render: () => (
      <ApiListEditor
        resource="/achievements"
        fields={[
          { key: "value", label: "Valor destacado (ej: 1er puesto)", type: "text" },
          { key: "label", label: "Título", type: "text" },
          { key: "detail", label: "Detalle", type: "textarea" },
        ]}
      />
    ),
  },
  projects: {
    title: "Editar proyectos",
    render: () => (
      <ApiListEditor
        resource="/projects"
        fields={[
          { key: "title", label: "Título", type: "text" },
          { key: "description", label: "Descripción", type: "textarea" },
          { key: "category", label: "Categoría (ej: Web app)", type: "text" },
          { key: "tags", label: "Etiquetas (separadas por coma)", type: "tags" },
          { key: "repo_url", label: "Link al código", type: "text" },
          { key: "demo_url", label: "Link a demo", type: "text" },
        ]}
      />
    ),
  },
};

/** EditorModalHost: se monta una sola vez en App y muestra el modal activo (si hay alguno). */
export default function EditorModalHost() {
  const { activeEditor, closeEditor } = useEditMode();
  if (!activeEditor) return null;

  const editor = EDITORS[activeEditor];
  return (
    <Modal title={editor.title} onClose={closeEditor}>
      {editor.render()}
    </Modal>
  );
}
