import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toIcsDate(dateStr: string, allDay: boolean): string {
  const d = new Date(dateStr);
  if (allDay) {
    // VALUE=DATE format: YYYYMMDD
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
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
  const dtStart = toIcsDate(event.start_date, allDay);
  const dtEnd = event.end_date
    ? toIcsDate(event.end_date, allDay)
    : dtStart;

  const dtPrefix = allDay ? 'VALUE=DATE:' : ':';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Riftbound Media//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@riftbound-media.com`,
    `DTSTART${dtPrefix}${dtStart}`,
    `DTEND${dtPrefix}${dtEnd}`,
    `SUMMARY:${escapeIcs(event.title)}`,
  ];

  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');

  const ics = lines.join('\r\n');

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
    },
  });
};
