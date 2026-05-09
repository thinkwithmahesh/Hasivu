const DISALLOWED_PATTERNS = [
  /treat(s|ment|ing)?/i,
  /cure(s|d|ing)?/i,
  /prevent(s|ion|ing)?/i,
  /heals?/i,
  /therapeutic/i,
  /medical(ly)?/i,
  /diagnos/i,
  /supplement/i,
  /doctor.?recommend/i,
];

const ALLOWED_REASON_TYPES = [
  'available',
  'preference_match',
  'allergen_safe',
  'variety',
  'budget_fit',
  'past_acceptance',
  'popular',
  'admin_curated',
] as const;

export type AllowedReasonType = (typeof ALLOWED_REASON_TYPES)[number];

export const RECOMMENDATION_DISCLAIMER =
  'Recommendations are based on availability, preferences, and order history. ' +
  'This is not medical or nutritional advice.';

export function validateExplanation(reason: string): void {
  for (const pattern of DISALLOWED_PATTERNS) {
    if (pattern.test(reason)) {
      throw new Error(
        `Recommendation explanation contains disallowed content: "${reason}". ` +
          'Explanations must not make medical or therapeutic claims.'
      );
    }
  }
}

export function buildSafeExplanation(type: AllowedReasonType, detail?: string): string {
  const templates: Record<AllowedReasonType, string> = {
    available: 'Available for this meal slot today.',
    preference_match: `Matches ${detail ?? 'stated'} preference.`,
    allergen_safe: `Avoids listed allergen: ${detail ?? 'known allergen'}.`,
    variety: 'Adds variety compared with recent orders.',
    budget_fit: 'Within usual meal budget.',
    past_acceptance: 'Previously ordered and not dismissed.',
    popular: 'Popular choice at this school.',
    admin_curated: 'Highlighted by school admin.',
  };

  const explanation = templates[type];
  validateExplanation(explanation);
  return explanation;
}
