export default function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert error" role="alert">
      {error} {onRetry && <button type="button" className="link" onClick={onRetry}>Reintentar</button>}
    </div>
  );
}
