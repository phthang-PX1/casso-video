import type { ApplyIconInput, ApplyIconOutput, IconEntry, IconWeight } from './types.js';
export declare function generateCode(icon: IconEntry, input: ApplyIconInput): ApplyIconOutput | {
    error: string;
};
export declare function buildSvgMarkup(icon: IconEntry, weight: IconWeight): string | {
    error: string;
};
