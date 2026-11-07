/**
 * URL and query string formatting utilities
 */
/**
 * Normalizes and joins base URL and a path
 */
export function buildUrl(baseUrl, path = '', query) {
    let cleanBase = (baseUrl || '').replace(/\/+$/, '');
    let cleanPath = (path || '').replace(/^\/+/, '');
    let url = cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
    if (query && Object.keys(query).length > 0) {
        const params = serializeQueryParams(query);
        if (params) {
            url += (url.includes('?') ? '&' : '?') + params;
        }
    }
    return url;
}
/**
 * Serializes query parameters into URL search string
 */
export function serializeQueryParams(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) {
            continue;
        }
        if (Array.isArray(value)) {
            // If it's with/expand/fields, PadiBase supports comma-separated format:
            if (['with', 'expand', 'fields', 'select'].includes(key)) {
                params.append(key, value.join(','));
            }
            else {
                for (const item of value) {
                    if (item !== undefined && item !== null) {
                        params.append(key, String(item));
                    }
                }
            }
        }
        else if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
        }
        else {
            params.append(key, String(value));
        }
    }
    return params.toString();
}
//# sourceMappingURL=url.js.map