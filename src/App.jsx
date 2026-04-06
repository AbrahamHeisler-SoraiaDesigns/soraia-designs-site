import Nav from './components/Nav'
import Hero from './components/Hero'
import Gallery from './components/Gallery'
import PainPoints from './components/PainPoints'
import Strategy from './components/Strategy'
import Positioning from './components/Positioning'
import Services from './components/Services'
import Process from './components/Process'
import Investment from './components/Investment'
import Portfolio from './components/Portfolio'
import Testimonials from './components/Testimonials'
import About from './components/About'
import FAQ from './components/FAQ'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Gallery />
        <PainPoints />
        <Strategy />
        <Positioning />
        <Services />
        <Process />
        <Investment />
        <Portfolio />
        <Testimonials />
        <About />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
