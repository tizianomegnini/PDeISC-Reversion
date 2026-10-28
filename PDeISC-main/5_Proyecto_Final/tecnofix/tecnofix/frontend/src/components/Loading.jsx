export default function Loading({ text = 'Cargando…' }) {
  return <p className="loading" role="status">{text}</p>;
}
