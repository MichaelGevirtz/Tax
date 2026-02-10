"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CTABar } from "../shared/CTABar";
import { Step1Employment } from "./steps/Step1Employment";
import { Step2MortgageInsurance } from "./steps/Step2MortgageInsurance";
import { Step3PersonalCredits } from "./steps/Step3PersonalCredits";
import { Step4AdditionalIncome } from "./steps/Step4AdditionalIncome";
import { Step5TaxYears } from "./steps/Step5TaxYears";
import {
  type WizardState,
  INITIAL_WIZARD_STATE,
  saveWizardState,
  loadWizardState,
  clearWizardState,
} from "../../lib/wizard-state";
import { trackEvent, resetFlowId } from "../../lib/analytics";
import styles from "./OnboardingWizard.module.css";

const TOTAL_STEPS = 5;

const STEP_IDS = [
  "step_1",
  "step_2",
  "step_3",
  "step_4",
  "step_5",
] as const;

const STEP_TITLES = [
  "שינוי בתבנית ההעסקה או השכר",
  "משכנתא וביטוח חיים",
  "נקודות זיכוי והטבות אישיות",
  "הכנסות נוספות מעבר לתלוש השכר",
  "בחירת שנות הבדיקה",
];

function isStepValid(step: number, state: WizardState): boolean {
  switch (step) {
    case 0:
      return state.employmentChanges.length >= 1;
    case 1:
      return state.mortgageAndLifeInsurance.length >= 1;
    case 2:
      return state.personalCredits !== null;
    case 3:
      return state.additionalIncome !== null;
    case 4:
      return state.years.length >= 1;
    default:
      return false;
  }
}

function countSelectionsForStep(step: number, state: WizardState): number {
  switch (step) {
    case 0:
      return state.employmentChanges.length;
    case 1:
      return state.mortgageAndLifeInsurance.length;
    case 2:
      return state.personalCredits !== null ? 1 : 0;
    case 3:
      return state.additionalIncome !== null ? 1 : 0;
    case 4:
      return state.years.length;
    default:
      return 0;
  }
}

function countTotalSelections(state: WizardState): number {
  let total = 0;
  for (let i = 0; i < TOTAL_STEPS; i++) {
    total += countSelectionsForStep(i, state);
  }
  return total;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const wizardStartedRef = useRef(false);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = loadWizardState();
    if (saved) {
      setState(saved);
    }
  }, []);

  // Save state to localStorage on every change
  useEffect(() => {
    saveWizardState(state);
  }, [state]);

  // Fire wizard_started once
  useEffect(() => {
    if (!wizardStartedRef.current) {
      wizardStartedRef.current = true;
      resetFlowId();
      trackEvent("wizard_started", {
        step_id: "step_1",
        screen_id: "wizard",
      });
    }
  }, []);

  // Fire wizard_abandoned on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const stepIdx = currentStepRef.current;
      trackEvent("wizard_abandoned", {
        step_id: STEP_IDS[stepIdx],
        last_step_id: STEP_IDS[stepIdx],
        last_step_number: stepIdx + 1,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleNext = useCallback(() => {
    if (!isStepValid(currentStep, state)) return;

    trackEvent("wizard_step_completed", {
      step_id: STEP_IDS[currentStep],
      step_number: currentStep + 1,
      selections_count: countSelectionsForStep(currentStep, state),
    });

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Wizard completed
      trackEvent("wizard_completed", {
        step_id: STEP_IDS[currentStep],
        total_steps: TOTAL_STEPS,
        years_count: state.years.length,
        total_selections: countTotalSelections(state),
      });
      clearWizardState();
      router.push("/upload");
    }
  }, [currentStep, state, router]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      trackEvent("wizard_step_back", {
        step_id: STEP_IDS[currentStep],
        from_step_number: currentStep + 1,
      });
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const updateState = useCallback(
    <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1Employment
            selections={state.employmentChanges}
            onChange={(v) => updateState("employmentChanges", v)}
          />
        );
      case 1:
        return (
          <Step2MortgageInsurance
            selections={state.mortgageAndLifeInsurance}
            onChange={(v) => updateState("mortgageAndLifeInsurance", v)}
          />
        );
      case 2:
        return (
          <Step3PersonalCredits
            selection={state.personalCredits}
            onChange={(v) => updateState("personalCredits", v)}
          />
        );
      case 3:
        return (
          <Step4AdditionalIncome
            selection={state.additionalIncome}
            onChange={(v) => updateState("additionalIncome", v)}
          />
        );
      case 4:
        return (
          <Step5TaxYears
            selections={state.years}
            onChange={(v) => updateState("years", v)}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <div className={styles.wizard}>
      {/* Progress dots */}
      <div className={styles.progress} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={[
              styles.dot,
              i === currentStep ? styles.dotActive : "",
              i < currentStep ? styles.dotCompleted : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </div>

      {/* Step label */}
      <div className={styles.stepLabel}>
        שלב {currentStep + 1} מתוך {TOTAL_STEPS} — {STEP_TITLES[currentStep]}
      </div>

      {/* Step content */}
      <div key={currentStep} className={styles.stepContent}>
        {renderStep()}
      </div>

      {/* Navigation */}
      <CTABar
        primaryLabel={isLastStep ? "סיום" : "המשך"}
        onPrimaryClick={handleNext}
        primaryDisabled={!isStepValid(currentStep, state)}
        secondaryLabel={currentStep > 0 ? "חזרה" : undefined}
        onSecondaryClick={currentStep > 0 ? handleBack : undefined}
      />
    </div>
  );
}
