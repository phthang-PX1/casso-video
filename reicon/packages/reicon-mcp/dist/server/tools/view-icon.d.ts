import type { IconWeight } from '../../core/types.js';
export declare function handleViewIcon(args: {
    name: string;
    weight: IconWeight;
}): {
    error: string;
} | {
    error: string;
    suggestion: string;
    name?: undefined;
    weight?: undefined;
    availableWeights?: undefined;
    category?: undefined;
    tags?: undefined;
    viewBox?: undefined;
    svg?: undefined;
    hint?: undefined;
} | {
    name: string;
    weight: IconWeight;
    availableWeights: IconWeight[];
    category: string;
    tags: string[];
    viewBox: string;
    svg: string;
    hint: string;
    error?: undefined;
    suggestion?: undefined;
};
