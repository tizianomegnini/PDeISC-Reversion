import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Experience from "./components/Experience";
import Achievements from "./components/Achievements";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import EditModeButton from "./components/EditModeButton";
import PasswordPromptModal from "./components/PasswordPromptModal";
import EditorModalHost from "./components/EditorModalHost";
import { usePortfolioData } from "./hooks/usePortfolioData";

/**
 * App
 * ---
 * Portfolio de una sola página. Cada sección tiene su propio botón
 * "✎ Editar" (ver Section.jsx / SectionEditButton) que, junto con el
 * candado flotante (EditModeButton), permite modificar el contenido
 * sin salir de esta misma página ni tocar código — ver EditModeContext.
 */
export default function App() {
  const { data, loading } = usePortfolioData();

  return (
    <>
      <Navbar />
      <main>
        <Hero profile={data.profile} />
        <About profile={data.profile} />
        <Skills skillGroups={data.skillGroups} />
        <Experience experience={data.experience} />
        <Achievements achievements={data.achievements} />
        <Projects projects={data.projects} loading={loading} />
        <Contact profile={data.profile} />
      </main>
      <Footer profile={data.profile} />

      <BackToTop />
      <EditModeButton />
      <PasswordPromptModal />
      <EditorModalHost />
    </>
  );
}
