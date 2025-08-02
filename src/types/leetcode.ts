/**
 * TypeScript types and interfaces for LeetCode problem data extraction
 */

export interface LeetCodeProblem {
  // Required fields
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  problemSlug: string;
  problemId: string;
  
  // Optional fields
  acceptanceRate?: number;
  submissionCount?: number;
  examples: ProblemExample[];
  constraints: string[];
  relatedTopics: string[];
  tags: string[];
  
  // Metadata
  extractedAt: string;
  url: string;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemAnalysis {
  // Analysis results
  estimatedTimeComplexity: string;
  estimatedSpaceComplexity: string;
  difficultyConfidence: number; // 0-1
  topicConfidence: number; // 0-1
  
  // Recommendations
  suggestedApproach: string[];
  commonPitfalls: string[];
  relatedProblems: string[];
  studyMaterials: string[];
  
  // Metadata
  analyzedAt: string;
}

export interface ParsingResult<T = LeetCodeProblem> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export interface DOMElement {
  selector: string;
  fallbackSelectors?: string[];
  required: boolean;
  transform?: (element: Element) => unknown;
}

export interface ParsingConfig {
  elements: Record<string, DOMElement>;
  retryAttempts: number;
  timeout: number;
}

// Error types
export enum ParsingError {
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ParsingErrorInfo {
  type: ParsingError;
  message: string;
  element?: string;
  context?: unknown;
} 