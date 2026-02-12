import { Header } from "../../components/landing/Header";
import { Footer } from "../../components/landing/Footer";
import { SectionContainer } from "../../components/shared/SectionContainer";
import { SoftResultScreen } from "../../components/onboarding/SoftResult";

export default function SoftResultPage() {
  return (
    <>
      <Header />
      <main>
        <SectionContainer>
          <SoftResultScreen />
        </SectionContainer>
      </main>
      <Footer />
    </>
  );
}
