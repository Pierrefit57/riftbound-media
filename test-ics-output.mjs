/**
 * Quick test: simulate the ICS generation logic and validate output.
 * Run: node test-ics-output.mjs
 */

// --- Reproduce the exact functions from feed.ics.ts ---

function escapeIcs(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .trim();
}

function toIcsDateValue(dateStr) {
  const d = new Date(dateStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function toIcsDateTimeValue(dateStr) {
  return new Date(dateStr).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function addOneDay(dateStr) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

function foldLine(line) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  const parts = [];
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

// --- Test data simulating DB rows ---
const testEvents = [
  {
    id: 'test-1',
    title: 'Sortie Spiritforged',
    description: 'Sortie mondiale du Set 2 Spiritforged !',
    start_date: '2026-02-13T00:00:00.000Z',
    end_date: null,
    all_day: true,
    location: 'Mondiale',
    url: null,
  },
  {
    id: 'test-2',
    title: 'RQ Bologne',
    description: 'Le Régional Qualifier de Bologne, le premier en Europe !',
    start_date: '2026-02-20T00:00:00.000Z',
    end_date: '2026-02-22T00:00:00.000Z',
    all_day: true,
    location: 'Bologne',
    url: 'https://www.twitch.tv/otplol2',
  },
  {
    id: 'test-3',
    title: 'Billetterie RQ Lille',
    description: 'Premier arrivé, premier servi !',
    start_date: '2026-02-18T10:00:00.000Z',
    end_date: '2026-02-18T11:00:00.000Z',
    all_day: false,
    location: 'En ligne',
    url: 'https://www.eventbrite.com/e/riftbound-regional-qualifier-lille-tickets-1982724863440?aff=eprofsaved',
  },
  {
    id: 'test-4',
    title: 'Royaume du TCG',
    description: 'Un tournoi de 512 joueurs qui se déroule au Parc des Expo de Villepinte ! Des centaines de boosters à gagner et d\'autres lots !',
    start_date: '2026-04-04T00:00:00.000Z',
    end_date: '2026-04-05T00:00:00.000Z',
    all_day: true,
    location: 'Parc des Expositions de Villepinte',
    url: 'https://www.royaumedutcg.com/riftbound',
  },
];

// --- Generate ICS output ---
const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const vevents = testEvents.map(event => {
  const allDay = !!event.all_day;
  const lines = [
    'BEGIN:VEVENT',
    `UID:event-${event.id}@riftbound-media.com`,
    `DTSTAMP:${now}`,
  ];

  if (allDay) {
    const dtStart = toIcsDateValue(event.start_date);
    const endDateStr = event.end_date || event.start_date;
    const dtEnd = toIcsDateValue(addOneDay(endDateStr));
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
  } else {
    const dtStart = toIcsDateTimeValue(event.start_date);
    const dtEnd = event.end_date ? toIcsDateTimeValue(event.end_date) : dtStart;
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
  }

  lines.push(`SUMMARY:${escapeIcs(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  if (event.url) lines.push(`URL:${event.url.trim()}`);
  lines.push('END:VEVENT');
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
  '',
].join('\r\n');

// --- Validation ---
console.log('=== GENERATED ICS OUTPUT ===\n');
console.log(ics);
console.log('\n=== VALIDATION ===\n');

let errors = 0;

// 1) Check DTSTART;VALUE=DATE has semicolon
const dtstartAllDay = ics.match(/DTSTART[^:\r\n]*DATE[^:\r\n]*:\d{8}/g) || [];
for (const match of dtstartAllDay) {
  if (!match.startsWith('DTSTART;VALUE=DATE:')) {
    console.error(`❌ FAIL: Bad DTSTART format: "${match}"`);
    errors++;
  } else {
    console.log(`✅ PASS: DTSTART format OK: "${match}"`);
  }
}

// 2) Check DTEND;VALUE=DATE has semicolon
const dtendAllDay = ics.match(/DTEND[^:\r\n]*DATE[^:\r\n]*:\d{8}/g) || [];
for (const match of dtendAllDay) {
  if (!match.startsWith('DTEND;VALUE=DATE:')) {
    console.error(`❌ FAIL: Bad DTEND format: "${match}"`);
    errors++;
  } else {
    console.log(`✅ PASS: DTEND format OK: "${match}"`);
  }
}

// 3) Check exclusive end date for single-day all-day event (test-1)
// start=20260213, end should be 20260214 (next day)
if (ics.includes('DTSTART;VALUE=DATE:20260213') && ics.includes('DTEND;VALUE=DATE:20260214')) {
  console.log('✅ PASS: Single-day all-day event has DTEND = start+1 day (20260214)');
} else {
  console.error('❌ FAIL: Single-day all-day event DTEND is wrong');
  errors++;
}

// 4) Check multi-day all-day event (test-2: Feb 20-22, end should be Feb 23)
if (ics.includes('DTSTART;VALUE=DATE:20260220') && ics.includes('DTEND;VALUE=DATE:20260223')) {
  console.log('✅ PASS: Multi-day all-day event has DTEND = end+1 day (20260223)');
} else {
  console.error('❌ FAIL: Multi-day all-day event DTEND is wrong');
  errors++;
}

// 5) Check non-all-day event uses DTSTART: (no VALUE=DATE)
if (ics.includes('DTSTART:20260218T100000Z')) {
  console.log('✅ PASS: Non-all-day event uses DTSTART:YYYYMMDDTHHMMSSZ format');
} else {
  console.error('❌ FAIL: Non-all-day event DTSTART format wrong');
  errors++;
}

// 6) Check no line exceeds 75 octets (after folding)
const encoder = new TextEncoder();
const rawLines = ics.split('\r\n');
let longLineFound = false;
for (let i = 0; i < rawLines.length; i++) {
  const byteLen = encoder.encode(rawLines[i]).length;
  if (byteLen > 75) {
    console.error(`❌ FAIL: Line ${i+1} is ${byteLen} bytes (max 75): "${rawLines[i].substring(0, 60)}..."`);
    longLineFound = true;
    errors++;
  }
}
if (!longLineFound) {
  console.log('✅ PASS: All lines ≤ 75 octets (RFC 5545 compliant)');
}

// 7) Check commas are escaped in DESCRIPTION
if (ics.includes('DESCRIPTION:Le R\\;gional Qualifier de Bologne\\, le premier en Europe !')) {
  // Hmm, actually the semicolon in "Régional" is an accent not a semicolon. Let me check the comma.
}
// Check commas properly escaped
if (ics.includes('Premier arriv\\;')) {
  // This would be wrong — "arrivé" has no semicolon
}
// Just check that commas in description are escaped
if (ics.includes('le premier en Europe !') && !ics.includes('Bologne, le premier')) {
  console.log('✅ PASS: Commas escaped in text properties');
} else {
  console.error('❌ FAIL: Commas not escaped');
  errors++;
}

// 8) Check BEGIN/END:VCALENDAR wrapping
if (ics.startsWith('BEGIN:VCALENDAR') && ics.includes('END:VCALENDAR')) {
  console.log('✅ PASS: VCALENDAR wrapper present');
} else {
  console.error('❌ FAIL: Missing VCALENDAR wrapper');
  errors++;
}

// 9) Check VEVENT count
const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
if (veventCount === testEvents.length) {
  console.log(`✅ PASS: ${veventCount} VEVENT blocks generated`);
} else {
  console.error(`❌ FAIL: Expected ${testEvents.length} VEVENTs, got ${veventCount}`);
  errors++;
}

// 10) Royaume du TCG: 2-day event Apr 4-5, DTEND should be Apr 6
if (ics.includes('DTSTART;VALUE=DATE:20260404') && ics.includes('DTEND;VALUE=DATE:20260406')) {
  console.log('✅ PASS: "Royaume du TCG" 2-day event ends on 20260406 (exclusive)');
} else {
  console.error('❌ FAIL: "Royaume du TCG" end date wrong');
  errors++;
}

console.log(`\n=== RESULT: ${errors === 0 ? '✅ ALL TESTS PASSED' : `❌ ${errors} FAILURE(S)`} ===`);
process.exit(errors);
