import { useEffect, useRef, type MouseEvent } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Diálogo modal para confirmaciones destructivas o decisiones de negocio con bloqueo de doble click.
 *
 * @param open Controla la apertura del dialog nativo.
 * @param title Título visible principal.
 * @param description Cuerpo aclaratorio de la acción.
 * @param confirmLabel Texto del botón de confirmación.
 * @param danger Si es true, resalta la acción como potencialmente peligrosa.
 * @param busy Deshabilita los controles mientras se procesa la acción.
 * @param onCancel Cierra el diálogo sin aplicar cambios.
 * @param onConfirm Ejecuta la acción confirmada.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && !busy) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={closeOnBackdrop}
    >
      <div className="confirm-dialog-icon" aria-hidden="true">{danger ? '!' : '?'}</div>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-description">{description}</p>
      <div className="confirm-dialog-actions">
        <button type="button" className="secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="button" className={danger ? 'danger' : ''} onClick={onConfirm} disabled={busy}>
          {busy ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
