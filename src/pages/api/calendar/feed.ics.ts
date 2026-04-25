import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .trim();
}

/**
 * Fold lines longer than 75 octets per RFC 5545 §3.1.
 * Continuation lines start with a single space character.
 */
function foldLine(line: string): string {
  // Use byte length, not char length (UTF-8 chars can be multi-byte)
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  const parts: string[] = [];
  let start = 0;
  let isFirst = true;

  while (start < bytes.length) {
    // First line: 75 bytes max. Continuation lines: 74 bytes max (1 byte for leading space)
    const maxBytes = isFirst ? 75 : 74;
    let end = Math.min(start + maxBytes, bytes.length);

    // Don't split in the middle of a multi-byte UTF-8 character
    if (end < bytes.length) {
      while (end > start && (bytes[end] & 0xc0) === 0x80) {
        end--;
      }
    }

    const chunk = decoder.decode(bytes.slice(start, end));
    parts.push(isFirst ? chunk : ' ' + chunk);
    start = end;
    isFirst = false;
  }

  return parts.join('\r\n');
}

function toIcsDateValue(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function toIcsDateTimeValue(dateStr: string): string {
  return new Date(dateStr).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * For all-day events, iCalendar uses an EXCLUSIVE end date.
 * A single-day event on 2026-02-13 needs DTEND;VALUE=DATE:20260214
 */
function addOneDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

function toIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export const GET: APIRoute = async () => {
  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    return new Response('Erreur lors de la récupération des événements', { status: 500 });
  }

  const now = toIcsTimestamp(new Date());

  const vevents = (events || []).map(event => {
    const allDay = !!event.all_day;

    const lines: string[] = [
      'BEGIN:VEVENT',
      `UID:event-${event.id}@riftbound-media.com`,
      `DTSTAMP:${now}`,
    ];

    if (allDay) {
      const dtStart = toIcsDateValue(event.start_date);
      // Exclusive end: if no end_date or same as start, use start + 1 day
      const endDateStr = event.end_date || event.start_date;
      const dtEnd = toIcsDateValue(addOneDay(endDateStr));

      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    } else {
      const dtStart = toIcsDateTimeValue(event.start_date);
      const dtEnd = event.end_date
        ? toIcsDateTimeValue(event.end_date)
        : dtStart;

      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
    }

    lines.push(`SUMMARY:${escapeIcs(event.title)}`);

    if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
    if (event.url) lines.push(`URL:${event.url.trim()}`);

    lines.push('END:VEVENT');

    // Apply line folding to each content line
    return lines.map(foldLine).join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Riftbound Media//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Riftbound Media - Evenements',
    'X-WR-TIMEZONE:Europe/Paris',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...vevents,
    'END:VCALENDAR',
    '', // trailing newline
  ].join('\r\n');

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      // No Content-Disposition: attachment — we want calendar apps to subscribe, not download
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
