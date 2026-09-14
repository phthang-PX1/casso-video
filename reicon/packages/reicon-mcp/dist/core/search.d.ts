import type { IconEntry, IconIndex, IconWeight, SearchResult } from './types.js';
export declare function isSentenceQuery(query: string): boolean;
export declare function searchIcons(index: IconIndex, query: string, options?: {
    weight?: IconWeight;
    limit?: number;
}): {
    results: SearchResult[];
    instruction: string;
} | {
    error: string;
};
export declare function findIcon(index: IconIndex, name: string): IconEntry | undefined;
export declare function listCategories(index: IconIndex): string[];
