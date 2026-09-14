import { loadIndex } from '../../core/load-index.js';
import { searchIcons } from '../../core/search.js';
export function handleSearchIcons(args) {
    const index = loadIndex();
    return searchIcons(index, args.query, {
        weight: args.weight,
        limit: args.limit,
    });
}
