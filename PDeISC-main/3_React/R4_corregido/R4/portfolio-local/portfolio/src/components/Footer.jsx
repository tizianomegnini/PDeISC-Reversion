import "../styles/contact.css";

/** Footer con año dinámico y enlaces sociales. */
export default function Footer({ profile }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>© {year} {profile.name}. Hecho con React.</p>
        <ul className="footer__links">
          <li>
            <a href={profile.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </li>
          <li>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={`mailto:${profile.email}`}>Email</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
