/**
 * Levenshtein Distance Utility
 * Used for fuzzy matching anime titles across providers.
 */

/**
 * Calculates the Levenshtein distance between two strings.
 * Lower distance = more similar.
 */
export function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Normalize inputs
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();

    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    // Initialize matrix
    for (let i = 0; i <= s1.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= s1.length; i++) {
        for (let j = 1; j <= s2.length; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[s1.length][s2.length];
}

/**
 * Calculates similarity as a percentage (0-1) based on Levenshtein distance.
 */
export function calculateLevenshteinSimilarity(a: string, b: string): number {
    const distance = levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1;
    return 1 - distance / maxLength;
}

export interface MatchResult {
    value: string;
    similarity: number;
    distance: number;
}

/**
 * Finds the best match for a query among a list of candidates.
 * @param query - The search query
 * @param candidates - List of candidate strings
 * @param threshold - Minimum similarity (0-1) required for a match
 * @returns The best match or null if none meet the threshold
 */
export function findBestMatch(
    query: string,
    candidates: (string | null | undefined)[],
    threshold: number = 0.6
): MatchResult | null {
    if (!query || candidates.length === 0) return null;

    let bestMatch: MatchResult | null = null;

    for (const candidate of candidates) {
        if (!candidate) continue;

        const similarity = calculateLevenshteinSimilarity(query, candidate);

        if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
            bestMatch = {
                value: candidate,
                similarity,
                distance: levenshteinDistance(query, candidate),
            };
        }
    }

    return bestMatch;
}

/**
 * Ranks all candidates by similarity to the query.
 * @param query - The search query
 * @param candidates - List of candidate strings
 * @returns Array of matches sorted by similarity (highest first)
 */
export function rankMatches(
    query: string,
    candidates: (string | null | undefined)[]
): MatchResult[] {
    if (!query) return [];

    const results: MatchResult[] = [];

    for (const candidate of candidates) {
        if (!candidate) continue;

        const similarity = calculateLevenshteinSimilarity(query, candidate);
        results.push({
            value: candidate,
            similarity,
            distance: levenshteinDistance(query, candidate),
        });
    }

    return results.sort((a, b) => b.similarity - a.similarity);
}
