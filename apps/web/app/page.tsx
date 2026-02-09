import { Header } from "../components/landing/Header";
import { HeroSection } from "../components/landing/HeroSection";
import { Footer } from "../components/landing/Footer";
import { PageViewTracker } from "./PageViewTracker";

export default function LandingPage() {
  return (
    <>
      <PageViewTracker />
      <Header />
      <main>
        <HeroSection />
      </main>
      <Footer />
    </>
  );
}
