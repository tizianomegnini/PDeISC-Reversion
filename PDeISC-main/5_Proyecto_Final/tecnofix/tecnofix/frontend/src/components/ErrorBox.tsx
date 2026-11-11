/**
 * Muestra errores de carga o de acción con la opción de reintento si la vista lo soporta.
 *
 * @param error Mensaje a mostrar; si es null no renderiza nada.
 * @param onRetry Callback para intentar nuevamente la operación.
 */
export default function ErrorBox({ error, onRetry }: { error: string | null; onRetry?: () => void }) {
  if (!error) return null;
  return (
    <div className="alert error" role="alert">
      {error} {onRetry && <button type="button" className="link" onClick={onRetry}>Reintentar</button>}
    </div>
  );
}
