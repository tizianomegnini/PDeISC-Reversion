export default function Loading({ text = 'Cargando…' }: { text?: string }) {
  return <p className="loading" role="status">{text}</p>;
}
