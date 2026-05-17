import { buildSafeExplanation } from './safety-policy';

export interface RecommendationMenuItem {
  id: string;
  allergens: string[];
  tags: string[];
  price: number;
  available: boolean;
}

export interface StudentRecommendationContext {
  allergenExclusions: string[];
  preferredTags: string[];
  recentlyOrderedItemIds: string[];
  dismissedIds: string[];
  averageOrderValue?: number;
}

export interface RecommendationResult {
  menuItemId: string;
  rank: number;
  score: number;
  confidence: number;
  reasons: string[];
  mode: 'personalized' | 'fallback';
}

export class RuleBasedRecommendationEngine {
  readonly version = 'rule-based-v1';
  readonly minConfidenceThreshold = 0.3;

  recommend(
    items: RecommendationMenuItem[],
    context: StudentRecommendationContext,
    limit = 5
  ): RecommendationResult[] {
    const scored = items
      .filter(item => item.available)
      .filter(item => !context.dismissedIds.includes(item.id))
      .filter(
        item => !item.allergens.some(allergen => context.allergenExclusions.includes(allergen))
      )
      .map(item => this.scoreItem(item, context))
      .sort((a, b) => b.score - a.score);

    const highConfidence = scored.filter(item => item.confidence >= this.minConfidenceThreshold);
    const source = highConfidence.length >= 2 ? highConfidence : scored;

    return source.slice(0, limit).map((item, index) => ({
      ...item,
      rank: index + 1,
      mode: highConfidence.length >= 2 ? 'personalized' : 'fallback',
    }));
  }

  private scoreItem(
    item: RecommendationMenuItem,
    context: StudentRecommendationContext
  ): RecommendationResult {
    const reasons = [buildSafeExplanation('available')];
    let score = 0.35;

    const preferenceMatch = item.tags.find(tag => context.preferredTags.includes(tag));
    if (preferenceMatch) {
      score += 0.2;
      reasons.push(buildSafeExplanation('preference_match', preferenceMatch));
    }

    if (context.allergenExclusions.length > 0) {
      score += 0.1;
      reasons.push(buildSafeExplanation('allergen_safe', context.allergenExclusions[0]));
    }

    if (context.recentlyOrderedItemIds.includes(item.id)) {
      score += 0.1;
      reasons.push(buildSafeExplanation('past_acceptance'));
    } else {
      score += 0.1;
      reasons.push(buildSafeExplanation('variety'));
    }

    if (context.averageOrderValue && item.price <= context.averageOrderValue * 1.1) {
      score += 0.1;
      reasons.push(buildSafeExplanation('budget_fit'));
    }

    const bounded = Math.min(score, 1);
    return {
      menuItemId: item.id,
      rank: 0,
      score: bounded,
      confidence: bounded,
      reasons,
      mode: 'personalized',
    };
  }
}
