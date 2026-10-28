import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiLogin, apiAuthed, getToken, setToken, clearToken, isApiConfigured } from "../lib/apiClient";

const EditModeContext = createContext(null);

/**
 * EditModeProvider
 * -----------------
 * Reemplaza al viejo panel /admin: en vez de una página aparte, cada
 * sección del portfolio muestra un botón "✎ Editar" (ver SectionEditButton)
 * que abre un modal con el editor correspondiente. Todo eso se controla
 * desde acá:
 *
 *  - `unlocked`: si ya se ingresó la contraseña correcta en esta sesión
 *    del navegador (la sesión se guarda en localStorage del navegador).
 *  - `activeEditor`: qué modal está abierto ahora mismo (null, "profile",
 *    "skills", "experience", "achievements" o "projects").
 *  - `openEditor(kind)`: lo llama cada botón "✎ Editar". Si todavía no se
 *    desbloqueó, primero pide la contraseña y, una vez correcta, abre
 *    igual el editor que se había pedido (no hay que hacer doble clic).
 *  - `changeSignal`: un contador que se incrementa cada vez que se guarda
 *    algo; usePortfolioData lo escucha para volver a traer los datos
 *    sin necesidad de recargar la página.
 */
export function EditModeProvider({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeEditor, setActiveEditor] = useState(null);
  const [pendingEditor, setPendingEditor] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [changeSignal, setChangeSignal] = useState(0);

  useEffect(() => {
    async function checkExistingSession() {
      if (!isApiConfigured || !getToken()) {
        setChecking(false);
        return;
      }
      try {
        await apiAuthed("/admin/me", "GET");
        setUnlocked(true);
      } catch {
        clearToken();
      }
      setChecking(false);
    }
    checkExistingSession();
  }, []);

  const unlock = useCallback(
    async (password) => {
      try {
        const token = await apiLogin(password);
        setToken(token);
        setUnlocked(true);
        setShowPasswordPrompt(false);
        if (pendingEditor) {
          setActiveEditor(pendingEditor);
          setPendingEditor(null);
        }
        return { error: null };
      } catch (err) {
        return { error: err.message };
      }
    },
    [pendingEditor]
  );

  const lock = useCallback(() => {
    clearToken();
    setUnlocked(false);
    setActiveEditor(null);
  }, []);

  function openEditor(kind) {
    if (unlocked) {
      setActiveEditor(kind);
    } else {
      setPendingEditor(kind);
      setShowPasswordPrompt(true);
    }
  }

  function closeEditor() {
    setActiveEditor(null);
  }

  function toggleLock() {
    if (unlocked) {
      lock();
    } else {
      setPendingEditor(null);
      setShowPasswordPrompt(true);
    }
  }

  function notifyChanged() {
    setChangeSignal((n) => n + 1);
  }

  return (
    <EditModeContext.Provider
      value={{
        unlocked,
        checking,
        activeEditor,
        showPasswordPrompt,
        changeSignal,
        unlock,
        lock,
        openEditor,
        closeEditor,
        toggleLock,
        notifyChanged,
        cancelPasswordPrompt: () => {
          setShowPasswordPrompt(false);
          setPendingEditor(null);
        },
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) throw new Error("useEditMode debe usarse dentro de <EditModeProvider>");
  return ctx;
}
