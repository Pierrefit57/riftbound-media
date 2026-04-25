import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toIcsDate(dateStr: string, allDay: boolean): string {
  const d = new Date(dateStr);
  if (allDay) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
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
    const dtStart = toIcsDate(event.start_date, allDay);
    const dtEnd = event.end_date
      ? toIcsDate(event.end_date, allDay)
      : dtStart;

    const dtPrefix = allDay ? 'VALUE=DATE:' : ':';

    const lines = [
      'BEGIN:VEVENT',
      `UID:event-${event.id}@riftbound-media.com`,
      `DTSTAMP:${now}`,
      `DTSTART${dtPrefix}${dtStart}`,
      `DTEND${dtPrefix}${dtEnd}`,
      `SUMMARY:${escapeIcs(event.title)}`,
    ];

    if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
    if (event.url) lines.push(`URL:${event.url}`);

    lines.push('END:VEVENT');
    return lines.join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Riftbound Media//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Riftbound Media - Événements',
    'X-WR-TIMEZONE:Europe/Paris',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...vevents,
    'END:VCALENDAR',
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
