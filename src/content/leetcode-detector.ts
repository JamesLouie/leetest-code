/**
 * LeetCode Page Detection and URL Validation
 * Handles detection of LeetCode problem pages and URL validation
 */

export interface LeetCodePageInfo {
  isLeetCodeProblem: boolean;
  problemId?: string;
  problemSlug?: string;
  pageType: 'problem' | 'submission' | 'discussion' | 'other';
  url: string;
}

/**
 * Detects if the current page is a LeetCode problem page
 * @param url - The URL to check
 * @returns LeetCodePageInfo object with detection results
 */
export function detectLeetCodePage(url: string): LeetCodePageInfo {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's a LeetCode domain
    if (!hostname.includes('leetcode.com')) {
      return {
        isLeetCodeProblem: false,
        pageType: 'other',
        url
      };
    }

    const pathname = urlObj.pathname.toLowerCase();

    // Check for problem pages
    if (pathname.includes('/problems/')) {
      const problemMatch = pathname.match(/\/problems\/([^/]+)/);
      if (problemMatch) {
        const problemSlug = problemMatch[1];
        
        // Exclude submission pages
        if (pathname.includes('/submissions/')) {
          return {
            isLeetCodeProblem: false,
            pageType: 'submission',
            problemSlug,
            url
          };
        }
        
        // Exclude discussion pages
        if (pathname.includes('/discuss/')) {
          return {
            isLeetCodeProblem: false,
            pageType: 'discussion',
            problemSlug,
            url
          };
        }
        
        // This is a problem page
        return {
          isLeetCodeProblem: true,
          problemSlug,
          pageType: 'problem',
          url
        };
      }
    }
    
    // Not a problem page
    return {
      isLeetCodeProblem: false,
      pageType: 'other',
      url
    };
    
  } catch (error) {
    console.error('Error detecting LeetCode page:', error);
    return {
      isLeetCodeProblem: false,
      pageType: 'other',
      url
    };
  }
}

/**
 * Validates if a URL is a valid LeetCode problem URL
 * @param url - The URL to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidLeetCodeProblemUrl(url: string): boolean {
  const pageInfo = detectLeetCodePage(url);
  return pageInfo.isLeetCodeProblem;
}

/**
 * Extracts problem slug from LeetCode URL
 * @param url - The LeetCode problem URL
 * @returns problem slug or null if not found
 */
export function extractProblemSlug(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const match = pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting problem slug:', error);
    return null;
  }
}

/**
 * Gets the current page's LeetCode information
 * @returns LeetCodePageInfo for the current page
 */
export function getCurrentPageInfo(): LeetCodePageInfo {
  return detectLeetCodePage(window.location.href);
}

/**
 * Checks if the current page is a LeetCode problem page
 * @returns boolean indicating if current page is a LeetCode problem
 */
export function isCurrentPageLeetCodeProblem(): boolean {
  return getCurrentPageInfo().isLeetCodeProblem;
} 