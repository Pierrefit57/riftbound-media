import { createServiceClient } from './supabase';

// Known bot patterns in User-Agent strings
const BOT_PATTERNS = [
    'bot', 'crawl', 'spider', 'slurp', 'mediapartners',
    'headlesschrome', 'phantomjs', 'lighthouse', 'pingdom',
    'uptimerobot', 'gtmetrix', 'pagespeed', 'google-inspectiontool',
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'discordbot',
    'telegrambot', 'whatsapp', 'bingpreview', 'applebot',
    'yandex', 'baidu', 'duckduckbot', 'semrush', 'ahrefs',
    'mj12bot', 'dotbot', 'petalbot', 'bytespider',
    'gptbot', 'claudebot', 'anthropic', 'ccbot',
    'dataforseo', 'zoominfobot', 'hubspot', 'python-requests',
    'axios', 'node-fetch', 'curl', 'wget', 'httpx',
    'go-http-client', 'java/', 'okhttp', 'apache-httpclient',
    'vercelbot', 'prerender', 'rendertron',
];

// Known cloud/datacenter IP ranges (uniquement ceux très spécifiques aux bots)
const DATACENTER_PREFIXES = [
    '143.198.', '137.184.', '143.244.',  // DigitalOcean
    '18.144.', '3.125.',                 // AWS spécifiques
];

function isBot(userAgent?: string, ip?: string): boolean {
    if (!userAgent) return true; // No user agent = likely a bot

    const ua = userAgent.toLowerCase();
    if (BOT_PATTERNS.some(pattern => ua.includes(pattern))) return true;

    // Check datacenter IPs (likely automated traffic)
    if (ip && DATACENTER_PREFIXES.some(prefix => ip.startsWith(prefix))) return true;

    return false;
}

export async function trackEvent(eventType: string, data: {
    path?: string;
    user_id?: string;
    session_id?: string;
    ip?: string;
    agent?: string;
    referrer?: string;
    country?: string;
}) {
    // Skip bots and automated traffic
    if (isBot(data.agent, data.ip)) return;

    try {
        const supabase = createServiceClient();
        const { error } = await supabase.from('analytics_logs').insert({
            event_type: eventType,
            path: data.path,
            user_id: data.user_id,
            session_id: data.session_id,
            ip_address: data.ip,
            user_agent: data.agent,
            referrer: data.referrer,
            country: data.country,
        });
        if (error) {
            console.error('[analytics] Supabase insert error:', error.message, error.details, error.hint);
        }
    } catch (e: any) {
        // Fail silently to not block the app
        console.error('[analytics] Unexpected error:', e?.message);
    }
}
