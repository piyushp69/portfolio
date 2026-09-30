import Backdrop from './components/Backdrop'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Credentials from './components/Credentials'
import Education from './components/Education'
import Contact from './components/Contact'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import { useBubbleHover } from './hooks/usePortfolio'

export default function App() {
  useBubbleHover()

  return (
    <>
      <Backdrop />

      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Navbar />

      <main id="main">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Credentials />
        <Education />
        <Contact />
      </main>

      <Footer />
      <ScrollToTop />
    </>
  )
}
