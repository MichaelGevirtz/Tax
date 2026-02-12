import { z } from "zod";

export const reminderRequestSchema = z.object({
  email: z.string().email(),
  wizardState: z.object({
    employmentChanges: z.array(z.string()),
    mortgageAndLifeInsurance: z.array(z.string()),
    personalCredits: z.array(z.string()),
    additionalIncome: z.array(z.string()),
    years: z.array(z.number()),
  }),
  softResult: z.object({
    canProceedToUpload: z.boolean(),
    confidence: z.enum(["high", "medium", "low"]),
    reasons: z.array(z.string()),
  }),
});

export type ReminderRequest = z.infer<typeof reminderRequestSchema>;
