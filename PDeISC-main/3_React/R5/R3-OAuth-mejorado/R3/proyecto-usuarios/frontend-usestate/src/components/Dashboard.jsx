import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { usuario } = useAuth();

  return (
    <div className="tarjeta">
      <h1>Hola, {usuario?.nombre} 👋</h1>
      <p>Este es tu panel privado. Solo lo ves si tenés sesión iniciada.</p>
    </div>
  );
}
