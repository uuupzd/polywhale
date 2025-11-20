import { useCallback } from 'react';

/**
 * Infer category from market title/question using keyword matching
 * This is a simple client-side approach that doesn't require API calls
 */
function inferCategory(title: string): string {
  const lowerTitle = title.toLowerCase();

  // Check for crypto keywords
  if (lowerTitle.includes('bitcoin') || lowerTitle.includes('btc') ||
      lowerTitle.includes('ethereum') || lowerTitle.includes('eth') ||
      lowerTitle.includes('crypto') || lowerTitle.includes('solana') ||
      lowerTitle.includes('usdc') || lowerTitle.includes('defi')) {
    return 'Crypto';
  }

  // Check for sports keywords
  if (lowerTitle.includes('nba') || lowerTitle.includes('nfl') ||
      lowerTitle.includes('soccer') || lowerTitle.includes('football') ||
      lowerTitle.includes('basketball') || lowerTitle.includes('baseball') ||
      lowerTitle.includes('tennis') || lowerTitle.includes('ufc') ||
      lowerTitle.includes('mma') || lowerTitle.includes('f1') ||
      lowerTitle.includes('premier league') || lowerTitle.includes('champions league')) {
    return 'Sports';
  }

  // Check for politics keywords
  if (lowerTitle.includes('election') || lowerTitle.includes('trump') ||
      lowerTitle.includes('biden') || lowerTitle.includes('president') ||
      lowerTitle.includes('congress') || lowerTitle.includes('senate') ||
      lowerTitle.includes('governor') || lowerTitle.includes('political') ||
      lowerTitle.includes('vote') || lowerTitle.includes('democrat') ||
      lowerTitle.includes('republican')) {
    return 'US-current-affairs';
  }

  // Check for business keywords
  if (lowerTitle.includes('stock') || lowerTitle.includes('market') ||
      lowerTitle.includes('fed') || lowerTitle.includes('interest rate') ||
      lowerTitle.includes('gdp') || lowerTitle.includes('inflation') ||
      lowerTitle.includes('economy') || lowerTitle.includes('unemployment')) {
    return 'Business';
  }

  // Check for science keywords
  if (lowerTitle.includes('ai') || lowerTitle.includes('space') ||
      lowerTitle.includes('nasa') || lowerTitle.includes('research') ||
      lowerTitle.includes('technology') || lowerTitle.includes('science')) {
    return 'Science';
  }

  // Check for pop culture keywords
  if (lowerTitle.includes('movie') || lowerTitle.includes('film') ||
      lowerTitle.includes('oscar') || lowerTitle.includes('emmy') ||
      lowerTitle.includes('grammy') || lowerTitle.includes('celebrity') ||
      lowerTitle.includes('music') || lowerTitle.includes('album')) {
    return 'Pop-Culture ';
  }

  // Check for global politics
  if (lowerTitle.includes('war') || lowerTitle.includes('ukraine') ||
      lowerTitle.includes('russia') || lowerTitle.includes('china') ||
      lowerTitle.includes('israel') || lowerTitle.includes('palestine') ||
      lowerTitle.includes('iran') || lowerTitle.includes('syria')) {
    return 'Global Politics';
  }

  return 'Other';
}

/**
 * Hook to infer market categories from trade titles
 * Uses keyword matching - simple and always works without API dependencies
 */
export const useMarketCategories = () => {
  /**
   * Get category for a trade based on its title
   * Stable function that doesn't change between renders
   */
  const getCategory = useCallback((title: string): string => {
    return inferCategory(title);
  }, []);

  return {
    getCategory,
    loading: false,
    error: null,
  };
};

/**
 * Get list of popular categories for filtering
 */
export const POPULAR_CATEGORIES = [
  'All',
  'Crypto',
  'Sports',
  'US-current-affairs',
  'Pop-Culture ',
  'Business',
  'Science',
  'Global Politics',
] as const;

export type PopularCategory = typeof POPULAR_CATEGORIES[number];
