import type { IconIndex } from './types.js';
export declare function buildIconIndex(data: {
    categories?: Record<string, {
        icons?: Record<string, {
            description?: string[];
            weights?: Record<string, {
                code?: string;
            }>;
        }>;
    }>;
}): IconIndex;
