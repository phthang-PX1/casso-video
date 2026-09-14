import type { IconWeight } from '../../core/types.js';
export declare function handleSearchIcons(args: {
    query: string;
    weight?: IconWeight;
    limit?: number;
}): {
    results: import("../../core/types.js").SearchResult[];
    instruction: string;
} | {
    error: string;
};
