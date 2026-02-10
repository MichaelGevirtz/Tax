import { Header } from "../../components/landing/Header";
import { Footer } from "../../components/landing/Footer";
import { SectionContainer } from "../../components/shared/SectionContainer";
import { OnboardingWizard } from "../../components/onboarding/OnboardingWizard";

export default function PrecheckPage() {
  return (
    <>
      <Header />
      <main>
        <SectionContainer>
          <OnboardingWizard />
        </SectionContainer>
      </main>
      <Footer />
    </>
  );
}
