import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

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
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  const parts: string[] = [];
  let start = 0;
  let isFirst = true;

  while (start < bytes.length) {
    const maxBytes = isFirst ? 75 : 74;
    let end = Math.min(start + maxBytes, bytes.length);
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

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  const { data: event, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    return new Response('Événement introuvable', { status: 404 });
  }

  const allDay = !!event.all_day;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Riftbound Media//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@riftbound-media.com`,
  ];

  if (allDay) {
    const dtStart = toIcsDateValue(event.start_date);
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

  lines.push('END:VEVENT', 'END:VCALENDAR');

  const ics = lines.map(foldLine).join('\r\n') + '\r\n';

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
    },
  });
};
