import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Solution from './components/Solution';
import Product from './components/Product';
import Features from './components/Features';
import Trust from './components/Trust';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Solution />
        <Product />
        <Features />
        <Trust />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
