import {
  buildSafeExplanation,
  validateExplanation,
} from '../../../src/modules/recommendations/safety-policy';

describe('Recommendation safety policy', () => {
  it('rejects medical treatment claims', () => {
    expect(() => validateExplanation('This treats diabetes')).toThrow();
  });

  it('rejects cure claims', () => {
    expect(() => validateExplanation('This cures allergies')).toThrow();
  });

  it('rejects prevention claims', () => {
    expect(() => validateExplanation('This prevents illness')).toThrow();
  });

  it('accepts availability explanations', () => {
    expect(() => validateExplanation(buildSafeExplanation('available'))).not.toThrow();
  });

  it('accepts allergen exclusion explanations', () => {
    expect(() =>
      validateExplanation(buildSafeExplanation('allergen_safe', 'peanut'))
    ).not.toThrow();
  });

  it('accepts preference match explanations', () => {
    expect(() =>
      validateExplanation(buildSafeExplanation('preference_match', 'vegetarian'))
    ).not.toThrow();
  });
});
