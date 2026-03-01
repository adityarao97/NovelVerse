/**
 * Wikipedia MediaWiki API integration
 * Fetches episode plot summaries to give Gemini accurate story context.
 * No API key required — Wikipedia is freely accessible.
 * API docs: https://www.mediawiki.org/wiki/API:Main_page
 */

const WIKI_API = 'https://en.wikipedia.org/w/api.php';

/**
 * Search Wikipedia for a page matching the query
 * Returns the page title of the best match
 */
async function searchWikipediaPage(query: string): Promise<string | null> {
    const params = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: '5',
        format: 'json',
        origin: '*',
    });

    try {
        const res = await fetch(`${WIKI_API}?${params}`, {
            next: { revalidate: 86400 }, // Cache 24h — plot summaries don't change
        });
        if (!res.ok) return null;

        const data = await res.json();
        const results = data.query?.search || [];
        if (results.length === 0) return null;

        console.log(`📖 Wikipedia search "${query}" → "${results[0].title}"`);
        return results[0].title;
    } catch (err) {
        console.error('Wikipedia search error:', err);
        return null;
    }
}

/**
 * Fetch the wikitext content of a Wikipedia page
 */
async function fetchWikipediaContent(title: string): Promise<string | null> {
    const params = new URLSearchParams({
        action: 'query',
        titles: title,
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        format: 'json',
        origin: '*',
    });

    try {
        const res = await fetch(`${WIKI_API}?${params}`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;

        const data = await res.json();
        const pages = data.query?.pages || {};
        const page = Object.values(pages)[0] as any;

        if (page?.missing) return null;

        const content = page?.revisions?.[0]?.slots?.main?.['*'];
        return content || null;
    } catch (err) {
        console.error('Wikipedia fetch error:', err);
        return null;
    }
}

/**
 * Extracts the ==Plot== section from a Wikipedia article's wikitext
 */
function extractPlotSection(wikitext: string): string | null {
    // Match sections like == Plot ==, ==Plot==, === Plot ===
    const plotRegex = /={2,3}\s*Plot\s*={2,3}([\s\S]*?)(?:={2,3}[^=]|$)/i;
    const match = wikitext.match(plotRegex);
    if (!match) return null;

    const rawPlot = match[1].trim();
    if (!rawPlot) return null;

    return cleanWikitext(rawPlot);
}

/**
 * Find and extract a specific episode's plot from a season article
 * Looks for the episode in episode list tables or subsections
 */
function extractEpisodePlotFromSeasonArticle(
    wikitext: string,
    episodeNumber: number,
    episodeTitle?: string
): string | null {
    // Try to find the episode by title in subsections
    if (episodeTitle) {
        const titleRegex = new RegExp(
            `={2,4}\\s*(?:${escapeRegex(episodeTitle)}|Episode ${episodeNumber})\\s*={2,4}([\\s\\S]*?)(?:={2,4}[^=]|$)`,
            'i'
        );
        const match = wikitext.match(titleRegex);
        if (match) {
            const plot = extractPlotSection(match[0]) || cleanWikitext(match[1].substring(0, 2000));
            if (plot) return plot;
        }
    }

    // Try to find by episode number in episode list tables (wikitables have |rowspan= or | E8)
    // Look for "| 8 ||" or similar table cell patterns  
    const epNumInTable = new RegExp(
        `\\|\\s*${episodeNumber}\\s*\\n[\\s\\S]{0,500}?\\|\\|([^|]{20,500})`,
        'i'
    );
    const tableMatch = wikitext.match(epNumInTable);
    if (tableMatch) {
        return cleanWikitext(tableMatch[1].substring(0, 1000));
    }

    return null;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Clean wikitext markup into readable plain text
 */
function cleanWikitext(raw: string): string {
    return raw
        // Remove wiki links [[text]] → text, [[link|text]] → text
        .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
        // Remove external links [url text] → text
        .replace(/\[https?:\/\/[^\s\]]+\s([^\]]+)\]/g, '$1')
        // Remove bare URLs
        .replace(/\[https?:\/\/[^\]]+\]/g, '')
        // Remove templates {{...}}
        .replace(/\{\{[^}]*\}\}/g, '')
        // Remove HTML tags
        .replace(/<[^>]+>/g, '')
        // Remove references <ref>...</ref>
        .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
        .replace(/<ref[^>]*\/>/gi, '')
        // Remove bold/italic wiki markup '''x''' → x, ''x'' → x
        .replace(/'{2,3}/g, '')
        // Collapse whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Main entry point: fetch Wikipedia episode plot summary
 * Tries multiple search strategies with graceful fallback
 */
export async function fetchWikipediaEpisodePlot(
    animeName: string,
    seasonNumber: number,
    episodeNumber: number,
    episodeTitle?: string
): Promise<string | null> {
    console.log(`📖 Wikipedia: Fetching plot for "${animeName}" S${seasonNumber}E${episodeNumber}...`);

    // Strategy 1: Search for a dedicated episode article
    // e.g. "Jujutsu Kaisen season 3 episode 1"
    const episodeQuery = `${animeName} season ${seasonNumber} episode ${episodeNumber}`;
    const episodePageTitle = await searchWikipediaPage(episodeQuery);

    if (episodePageTitle) {
        const content = await fetchWikipediaContent(episodePageTitle);
        if (content) {
            const plot = extractPlotSection(content);
            if (plot && plot.length > 100) {
                console.log(`✅ Wikipedia: Found dedicated episode plot (${plot.length} chars)`);
                return plot;
            }
        }
    }

    // Strategy 2: Search for season article and extract episode from it
    // e.g. "Jujutsu Kaisen (season 3)"
    const seasonQuery = `${animeName} (season ${seasonNumber})`;
    const seasonPageTitle = await searchWikipediaPage(seasonQuery);

    if (seasonPageTitle) {
        const content = await fetchWikipediaContent(seasonPageTitle);
        if (content) {
            const epPlot = extractEpisodePlotFromSeasonArticle(content, episodeNumber, episodeTitle);
            if (epPlot && epPlot.length > 50) {
                console.log(`✅ Wikipedia: Extracted episode ${episodeNumber} plot from season article (${epPlot.length} chars)`);
                return epPlot;
            }
        }
    }

    // Strategy 3: Search for general episode list article
    const listQuery = `List of ${animeName} episodes`;
    const listPageTitle = await searchWikipediaPage(listQuery);

    if (listPageTitle) {
        const content = await fetchWikipediaContent(listPageTitle);
        if (content) {
            const epPlot = extractEpisodePlotFromSeasonArticle(content, episodeNumber, episodeTitle);
            if (epPlot && epPlot.length > 50) {
                console.log(`✅ Wikipedia: Extracted from episode list article (${epPlot.length} chars)`);
                return epPlot;
            }
        }
    }

    console.log(`⚠️  Wikipedia: No plot found for "${animeName}" S${seasonNumber}E${episodeNumber}`);
    return null;
}
