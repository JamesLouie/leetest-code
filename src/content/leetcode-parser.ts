/**
 * LeetCode Problem Parser
 * Handles extraction of problem data from LeetCode DOM
 */

import type { 
  LeetCodeProblem, 
  ProblemExample, 
  ParsingResult, 
  ParsingConfig
} from '../types/leetcode';
import { errorHandler } from './error-handler';

export class LeetCodeParser {
  private config: ParsingConfig;


  constructor() {
    this.config = {
      elements: {
        title: {
          selector: '[data-cy="question-title"]',
          fallbackSelectors: [
            'h1[class*="title"]',
            '.question-title',
            'h1'
          ],
          required: true,
          transform: (element: Element) => element.textContent?.trim() || ''
        },
        difficulty: {
          selector: '[diff]',
          fallbackSelectors: [
            '[class*="difficulty"]',
            '.difficulty',
            '[data-cy="question-difficulty"]'
          ],
          required: true,
          transform: (element: Element) => {
            const diff = element.getAttribute('diff') || 
                       element.textContent?.trim() || 
                       element.className.match(/difficulty-(\w+)/)?.[1] || null;
            return this.normalizeDifficulty(diff);
          }
        },
        description: {
          selector: '.question-content__JfgR',
          fallbackSelectors: [
            '[class*="question-content"]',
            '.question-content',
            '[data-cy="question-content"]'
          ],
          required: true,
          transform: (element: Element) => element.textContent?.trim() || ''
        },
        examples: {
          selector: '[class*="example"]',
          fallbackSelectors: [
            '.example',
            '[data-cy="example"]'
          ],
          required: false,
          transform: (element: Element) => this.parseExamples(element)
        },
        constraints: {
          selector: '[class*="constraint"]',
          fallbackSelectors: [
            '.constraint',
            '[data-cy="constraints"]'
          ],
          required: false,
          transform: (element: Element) => this.parseConstraints(element)
        },
        topics: {
          selector: '[class*="topic"]',
          fallbackSelectors: [
            '.topic',
            '[data-cy="topics"]'
          ],
          required: false,
          transform: (element: Element) => this.parseTopics(element)
        }
      },
      retryAttempts: 3,
      timeout: 5000
    };
  }

  /**
   * Parse LeetCode problem data from the current page
   */
  async parseProblem(): Promise<ParsingResult> {
    try {
      errorHandler.info('Starting LeetCode problem parsing...');
      
      const problemData: Partial<LeetCodeProblem> = {
        extractedAt: new Date().toISOString(),
        url: window.location.href,
        examples: [],
        constraints: [],
        relatedTopics: [],
        tags: []
      };

      // Extract basic problem information
      const basicInfo = await this.extractBasicInfo();
      if (!basicInfo.success) {
        errorHandler.error('Basic info extraction failed', { error: basicInfo.error });
        return basicInfo as ParsingResult<LeetCodeProblem>;
      }

      Object.assign(problemData, basicInfo.data);

      // Extract additional information
      const additionalInfo = await this.extractAdditionalInfo();
      if (additionalInfo.success && additionalInfo.data) {
        Object.assign(problemData, additionalInfo.data);
      }

      // Validate the extracted data
      const validation = this.validateProblemData(problemData as LeetCodeProblem);
      if (!validation.isValid) {
        errorHandler.error('Data validation failed', { errors: validation.errors });
        return {
          success: false,
          error: `Data validation failed: ${validation.errors.join(', ')}`,
          warnings: validation.warnings
        };
      }

      errorHandler.info('Problem parsing completed successfully', { 
        title: problemData.title,
        difficulty: problemData.difficulty 
      });
      return {
        success: true,
        data: problemData as LeetCodeProblem,
        warnings: validation.warnings
      };

    } catch (error) {
      errorHandler.error('Unexpected error during problem parsing', { error });
      return {
        success: false,
        error: `Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract basic problem information (title, difficulty, description)
   */
  private async extractBasicInfo(): Promise<ParsingResult<Partial<LeetCodeProblem>>> {
    const data: Partial<LeetCodeProblem> = {};

    // Extract title
    const titleResult = await this.extractElement('title');
    if (!titleResult.success) {
      return titleResult as ParsingResult<Partial<LeetCodeProblem>>;
    }
    data.title = titleResult.data as string;

    // Extract difficulty
    const difficultyResult = await this.extractElement('difficulty');
    if (!difficultyResult.success) {
      return difficultyResult as ParsingResult<Partial<LeetCodeProblem>>;
    }
    data.difficulty = difficultyResult.data as 'Easy' | 'Medium' | 'Hard';

    // Extract description
    const descriptionResult = await this.extractElement('description');
    if (!descriptionResult.success) {
      return descriptionResult as ParsingResult<Partial<LeetCodeProblem>>;
    }
    data.description = descriptionResult.data as string;

    // Extract problem slug and ID
    const urlInfo = this.extractUrlInfo();
    data.problemSlug = urlInfo.slug;
    data.problemId = urlInfo.id;

    return {
      success: true,
      data
    };
  }

  /**
   * Extract additional problem information (examples, constraints, topics)
   */
  private async extractAdditionalInfo(): Promise<ParsingResult<Partial<LeetCodeProblem>>> {
    const data: Partial<LeetCodeProblem> = {};

    // Extract examples
    const examplesResult = await this.extractElement('examples');
    if (examplesResult.success) {
      data.examples = examplesResult.data as ProblemExample[];
    }

    // Extract constraints
    const constraintsResult = await this.extractElement('constraints');
    if (constraintsResult.success) {
      data.constraints = constraintsResult.data as string[];
    }

    // Extract topics
    const topicsResult = await this.extractElement('topics');
    if (topicsResult.success) {
      data.relatedTopics = topicsResult.data as string[];
    }

    return {
      success: true,
      data
    };
  }

  /**
   * Extract a single element using the configured selectors
   */
  private async extractElement(elementName: string): Promise<ParsingResult<unknown>> {
    const elementConfig = this.config.elements[elementName];
    if (!elementConfig) {
      errorHandler.error(`Unknown element configuration: ${elementName}`);
      return {
        success: false,
        error: `Unknown element: ${elementName}`
      };
    }

    // Try primary selector first
    let element = document.querySelector(elementConfig.selector);
    
    // Try fallback selectors if primary fails
    if (!element && elementConfig.fallbackSelectors) {
      for (const fallbackSelector of elementConfig.fallbackSelectors) {
        element = document.querySelector(fallbackSelector);
        if (element) {
          errorHandler.debug(`Found element using fallback selector: ${fallbackSelector}`, { elementName });
          break;
        }
      }
    }

    if (!element) {


      if (elementConfig.required) {
        errorHandler.error(`Required element not found: ${elementName}`, { 
          selectors: [elementConfig.selector, ...(elementConfig.fallbackSelectors || [])] 
        });
        return {
          success: false,
          error: `Required element not found: ${elementName}`,
          warnings: [`Could not find element with selectors: ${elementConfig.selector}, ${elementConfig.fallbackSelectors?.join(', ')}`]
        };
      } else {
        errorHandler.warn(`Optional element not found: ${elementName}`, { 
          selectors: [elementConfig.selector, ...(elementConfig.fallbackSelectors || [])] 
        });
        return {
          success: true,
          data: elementName === 'examples' ? [] : 
                elementName === 'constraints' ? [] : 
                elementName === 'topics' ? [] : '',
          warnings: [`Optional element not found: ${elementName}`]
        } as ParsingResult<unknown>;
      }
    }

    try {
      const data = elementConfig.transform ? elementConfig.transform(element) : element.textContent?.trim() || '';
      errorHandler.debug(`Successfully extracted element: ${elementName}`, { data: typeof data === 'string' ? data.substring(0, 100) : data });
      return { success: true, data };
    } catch (error) {
      errorHandler.error(`Error transforming element ${elementName}`, { error });
      return {
        success: false,
        error: `Error transforming element ${elementName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse examples from DOM element
   */
  private parseExamples(element: Element): ProblemExample[] {
    const examples: ProblemExample[] = [];
    
    // Look for example containers
    const exampleElements = element.querySelectorAll('[class*="example"], .example');
    
    exampleElements.forEach((exampleEl) => {
      const inputEl = exampleEl.querySelector('[class*="input"], .input');
      const outputEl = exampleEl.querySelector('[class*="output"], .output');
      const explanationEl = exampleEl.querySelector('[class*="explanation"], .explanation');
      
      if (inputEl && outputEl) {
        examples.push({
          input: inputEl.textContent?.trim() || '',
          output: outputEl.textContent?.trim() || '',
          explanation: explanationEl?.textContent?.trim()
        });
      }
    });

    return examples;
  }

  /**
   * Parse constraints from DOM element
   */
  private parseConstraints(element: Element): string[] {
    const constraints: string[] = [];
    
    // Look for constraint items
    const constraintElements = element.querySelectorAll('li, [class*="constraint"]');
    
    constraintElements.forEach(constraintEl => {
      const text = constraintEl.textContent?.trim();
      if (text) {
        constraints.push(text);
      }
    });

    return constraints;
  }

  /**
   * Parse topics from DOM element
   */
  private parseTopics(element: Element): string[] {
    const topics: string[] = [];
    
    // Look for topic tags
    const topicElements = element.querySelectorAll('[class*="topic"], .topic, [class*="tag"], .tag');
    
    topicElements.forEach(topicEl => {
      const text = topicEl.textContent?.trim();
      if (text) {
        topics.push(text);
      }
    });

    return topics;
  }

  /**
   * Extract problem slug and ID from URL
   */
  private extractUrlInfo(): { slug: string; id: string } {
    const url = window.location.href;
    const slugMatch = url.match(/\/problems\/([^/]+)/);
    const slug = slugMatch ? slugMatch[1] : '';
    
    // Try to extract problem ID from various sources
    let id = '';
    
    // Look for problem ID in meta tags
    const metaId = document.querySelector('meta[name="problem-id"]')?.getAttribute('content');
    if (metaId) {
      id = metaId;
    } else {
      // Try to extract from page content
      const idMatch = document.body.textContent?.match(/Problem\s+#?(\d+)/i);
      if (idMatch) {
        id = idMatch[1];
      }
    }

    return { slug, id };
  }

  /**
   * Normalize difficulty string
   */
  private normalizeDifficulty(difficulty: string | null): 'Easy' | 'Medium' | 'Hard' {
    if (!difficulty) return 'Medium';
    
    const normalized = difficulty.toLowerCase();
    if (normalized.includes('easy')) return 'Easy';
    if (normalized.includes('hard')) return 'Hard';
    return 'Medium';
  }

  /**
   * Validate extracted problem data
   */
  private validateProblemData(data: LeetCodeProblem): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!data.title) errors.push('Title is required');
    if (!data.difficulty) errors.push('Difficulty is required');
    if (!data.description) errors.push('Description is required');
    if (!data.problemSlug) errors.push('Problem slug is required');

    // Check data quality
    if (data.description.length < 50) warnings.push('Description seems too short');
    if (data.examples.length === 0) warnings.push('No examples found');
    if (data.constraints.length === 0) warnings.push('No constraints found');

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }




} 