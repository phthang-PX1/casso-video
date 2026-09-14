import type { ApplyIconInput } from '../../core/types.js';
export declare function handleApplyIcon(args: ApplyIconInput): {
    error: string;
} | {
    error: string;
    suggestion: string;
} | {
    meta: {
        name: string;
        weight: import("../../core/types.js").IconWeight;
        framework: import("../../core/types.js").Framework;
        size: number;
    };
    importStatement: string;
    docsSnippet: string;
    error?: undefined;
    suggestion?: undefined;
};
