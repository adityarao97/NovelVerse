/**
 * OpenSubtitles API v1 integration
 * Fetches and parses episode subtitles to provide dialogue context for novel generation
 * Docs: https://opensubtitles.stoplight.io/docs/opensubtitles-api
 */

const OS_API_BASE = 'https://api.opensubtitles.com/api/v1';
const OS_API_KEY = process.env.OPENSUBTITLES_API_KEY || '';
const OS_USERNAME = process.env.OPENSUBTITLES_USERNAME || '';
const OS_PASSWORD = process.env.OPENSUBTITLES_PASSWORD || '';
const APP_NAME = 'NovelVerse/1.0';

// Cache the JWT token in memory (valid for 24 hours)
let authToken: string | null = null;
let authTokenExpiry: number = 0;

/**
 * Login to OpenSubtitles and get JWT token (cached)
 */
async function getAuthToken(): Promise<string | null> {
    if (authToken && Date.now() < authTokenExpiry) {
        return authToken;
    }

    if (!OS_API_KEY || !OS_USERNAME || !OS_PASSWORD) {
        console.warn('⚠️  OpenSubtitles credentials not configured');
        return null;
    }

    try {
        const res = await fetch(`${OS_API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': OS_API_KEY,
                'User-Agent': APP_NAME,
            },
            body: JSON.stringify({ username: OS_USERNAME, password: OS_PASSWORD }),
        });

        if (!res.ok) {
            console.error(`OpenSubtitles login failed: ${res.status}`);
            return null;
        }

        const data = await res.json();
        authToken = data.token;
        // Tokens are valid for 24h, refresh after 23h
        authTokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
        console.log('✅ OpenSubtitles login successful');
        return authToken;
    } catch (err) {
        console.error('OpenSubtitles login error:', err);
        return null;
    }
}

interface SubtitleSearchResult {
    id: string;
    attributes: {
        language: string;
        download_count: number;
        files: Array<{ file_id: number; file_name: string }>;
    };
}

/**
 * Search for subtitles by anime name, season, and episode number
 */
async function searchSubtitles(
    animeName: string,
    seasonNumber: number,
    episodeNumber: number
): Promise<SubtitleSearchResult[]> {
    if (!OS_API_KEY) return [];

    const params = new URLSearchParams({
        query: animeName,
        season_number: String(seasonNumber),
        episode_number: String(episodeNumber),
        languages: 'en',
        type: 'episode',
    });

    try {
        const res = await fetch(`${OS_API_BASE}/subtitles?${params}`, {
            headers: {
                'Api-Key': OS_API_KEY,
                'User-Agent': APP_NAME,
            },
            // Short cache since we want fresh results
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            console.warn(`OpenSubtitles search failed: ${res.status}`);
            return [];
        }

        const data = await res.json();
        console.log(`🔍 OpenSubtitles: Found ${data.total_count ?? 0} results for "${animeName}" S${seasonNumber}E${episodeNumber}`);
        return data.data || [];
    } catch (err) {
        console.error('OpenSubtitles search error:', err);
        return [];
    }
}

/**
 * Download a subtitle file by file_id and return raw SRT content
 */
async function downloadSubtitleContent(fileId: number): Promise<string | null> {
    const token = await getAuthToken();
    if (!token) return null;

    try {
        // Step 1: Get the download URL
        const res = await fetch(`${OS_API_BASE}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': OS_API_KEY,
                'Authorization': `Bearer ${token}`,
                'User-Agent': APP_NAME,
            },
            body: JSON.stringify({ file_id: fileId, sub_format: 'srt' }),
        });

        if (!res.ok) {
            console.warn(`OpenSubtitles download request failed: ${res.status}`);
            return null;
        }

        const data = await res.json();
        const downloadLink = data.link;
        if (!downloadLink) return null;

        // Step 2: Fetch the actual SRT file
        const srtRes = await fetch(downloadLink);
        if (!srtRes.ok) return null;

        const srtText = await srtRes.text();
        console.log(`✅ Downloaded subtitle (${srtText.length} chars)`);
        return srtText;
    } catch (err) {
        console.error('OpenSubtitles download error:', err);
        return null;
    }
}

/**
 * Parse SRT content into clean readable dialogue lines
 * Removes timestamps, sequence numbers, and HTML tags
 */
export function parseSRTToDialogue(srt: string): string {
    const lines = srt.split('\n');
    const dialogueLines: string[] = [];
    const timestampRegex = /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/;
    const sequenceRegex = /^\d+$/;

    let buffer: string[] = [];
    for (const line of lines) {
        const trimmed = line.trim();

        // Skip sequence numbers, timestamps, empty lines between blocks
        if (!trimmed || sequenceRegex.test(trimmed) || timestampRegex.test(trimmed)) {
            if (buffer.length > 0) {
                const clean = buffer
                    .join(' ')
                    .replace(/<[^>]+>/g, '')  // Remove HTML tags like <i>
                    .replace(/\{[^}]+\}/g, '') // Remove style codes like {\an8}
                    .trim();
                if (clean) dialogueLines.push(clean);
                buffer = [];
            }
            continue;
        }

        buffer.push(trimmed);
    }

    // Flush last buffer
    if (buffer.length > 0) {
        const clean = buffer.join(' ').replace(/<[^>]+>/g, '').trim();
        if (clean) dialogueLines.push(clean);
    }

    return dialogueLines.join('\n');
}

/**
 * Main entry point: fetch subtitle dialogue for an episode
 * Returns null if unavailable (graceful degradation)
 */
export async function fetchEpisodeSubtitleContext(
    animeName: string,
    seasonNumber: number,
    episodeNumber: number
): Promise<string | null> {
    if (!OS_API_KEY) {
        console.log('ℹ️  OpenSubtitles not configured, skipping subtitle fetch');
        return null;
    }

    console.log(`📥 Fetching subtitles for "${animeName}" S${seasonNumber}E${episodeNumber}...`);

    // Try original name first, then stripped name
    const namesToTry = [animeName];
    // If name has a colon, also try the base name (e.g. "Jujutsu Kaisen" from "Jujutsu Kaisen: The Culling Game Part 1")
    const colonIndex = animeName.indexOf(':');
    if (colonIndex > 0) {
        namesToTry.push(animeName.substring(0, colonIndex).trim());
    }

    for (const name of namesToTry) {
        const results = await searchSubtitles(name, seasonNumber, episodeNumber);
        if (results.length === 0) continue;

        // Pick the most downloaded English subtitle
        const best = results
            .filter(r => r.attributes.language === 'en' && r.attributes.files.length > 0)
            .sort((a, b) => b.attributes.download_count - a.attributes.download_count)[0];

        if (!best) continue;

        const fileId = best.attributes.files[0].file_id;
        const srt = await downloadSubtitleContent(fileId);
        if (!srt) continue;

        const dialogue = parseSRTToDialogue(srt);
        if (dialogue.trim()) {
            console.log(`✅ Subtitle context ready (${dialogue.split('\n').length} lines)`);
            return dialogue;
        }
    }

    console.log(`⚠️  No subtitles found for "${animeName}" S${seasonNumber}E${episodeNumber}`);
    return null;
}
