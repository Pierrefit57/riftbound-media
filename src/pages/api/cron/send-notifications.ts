import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const prerender = false;

/**
 * Vercel Cron Endpoint — Envoi des alertes e-mail pour les événements du jour.
 * Exécuté chaque matin à 7h CET via vercel.json crons.
 */
export const GET: APIRoute = async ({ request }) => {
  // 1. Sécurité : vérifier le secret Vercel
  const authHeader = request.headers.get('authorization');
  const cronSecret = import.meta.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Init clients
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = import.meta.env.RESEND_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const resend = new Resend(resendApiKey);

  // 3. Calculer le début/fin du jour en heure de Paris
  const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const startOfToday = new Date(parisNow.getFullYear(), parisNow.getMonth(), parisNow.getDate());
  const endOfToday = new Date(parisNow.getFullYear(), parisNow.getMonth(), parisNow.getDate(), 23, 59, 59);

  const startISO = startOfToday.toISOString();
  const endISO = endOfToday.toISOString();

  console.log(`[cron] Checking events between ${startISO} and ${endISO} (Paris time)`);

  // 4. Récupérer les événements qui commencent aujourd'hui
  const { data: events, error: eventError } = await supabase
    .from('calendar_events')
    .select('id, title, start_date, location, type')
    .gte('start_date', startISO)
    .lte('start_date', endISO);

  if (eventError) {
    console.error('[cron] Error fetching events:', eventError);
    return new Response(JSON.stringify({ error: 'Failed to fetch events', details: eventError.message }), { status: 500 });
  }

  if (!events || events.length === 0) {
    console.log('[cron] No events starting today.');
    return new Response(JSON.stringify({ message: 'No events today', eventsFound: 0, emailsSent: 0 }), { status: 200 });
  }

  console.log(`[cron] Found ${events.length} event(s) starting today.`);

  // 5. Récupérer tous les profils et users pour le mapping
  const { data: profiles } = await supabase.from('profiles').select('id, username');
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('[cron] Error fetching users:', userError);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 });
  }

  let totalEmailsSent = 0;
  const results: { event: string; followers: number; sent: number; errors: string[] }[] = [];

  // 6. Pour chaque événement, envoyer un email aux followers
  for (const event of events) {
    const eventResult = { event: event.title, followers: 0, sent: 0, errors: [] as string[] };

    // Récupérer les followers
    const { data: follows, error: followError } = await supabase
      .from('event_follows')
      .select('user_id')
      .eq('event_id', event.id);

    if (followError) {
      eventResult.errors.push(`Follow fetch error: ${followError.message}`);
      results.push(eventResult);
      continue;
    }

    if (!follows || follows.length === 0) {
      results.push(eventResult);
      continue;
    }

    eventResult.followers = follows.length;

    // Mapper user_id → email + username
    const subscribers = follows
      .map(f => {
        const user = users?.find(u => u.id === f.user_id);
        const profile = profiles?.find(p => p.id === f.user_id);
        return {
          email: user?.email,
          username: profile?.username || user?.user_metadata?.username || 'Invocateur'
        };
      })
      .filter(s => !!s.email);

    // Envoyer les emails (2s entre chaque pour éviter le rate limit Resend)
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    for (let i = 0; i < subscribers.length; i++) {
      const sub = subscribers[i];
      if (i > 0) await sleep(2000);
      const formattedDate = new Date(event.start_date).toLocaleString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/Paris'
      });

      const html = buildEmailHTML(sub.username, event, formattedDate);

      try {
        const { error: sendError } = await resend.emails.send({
          from: 'Riftbound Media <notifications@riftbound-media.fr>',
          to: sub.email!,
          subject: `🔔 Jour J : ${event.title}`,
          html,
        });

        if (sendError) {
          eventResult.errors.push(`Send to ${sub.email}: ${sendError.message}`);
        } else {
          eventResult.sent++;
          totalEmailsSent++;
          console.log(`[cron] Email sent to ${sub.email}`);
        }
      } catch (err: any) {
        eventResult.errors.push(`Exception for ${sub.email}: ${err.message}`);
      }
    }

    results.push(eventResult);
  }

  console.log(`[cron] Done. ${totalEmailsSent} email(s) sent.`);

  return new Response(JSON.stringify({
    message: 'Notification cron completed',
    eventsFound: events.length,
    emailsSent: totalEmailsSent,
    details: results
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

function buildEmailHTML(username: string, event: { title: string; location?: string }, formattedDate: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerte Riftbound</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #050914; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; border-spacing: 0; }
    .wrapper { background-color: #050914; width: 100%; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0a1128; border-radius: 24px; overflow: hidden; border: 1px solid rgba(233, 135, 15, 0.1); }
    .header { padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #0a1128 0%, #050914 100%); }
    .content { padding: 40px; color: #ffffff; }
    .event-box { background-color: #1c2541; border-radius: 20px; padding: 30px; border-left: 4px solid #E9870F; margin: 30px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #E9870F 0%, #ffbca1 100%); color: #050914 !important; font-weight: 800; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .footer { padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    @media only screen and (max-width: 600px) {
      .content { padding: 25px !important; }
      .container { border-radius: 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050914;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapper">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="container">
          <tr>
            <td class="header">
              <img src="https://www.riftbound-media.fr/riftbound-logo.png" alt="Riftbound Media" width="180" style="display: block; margin: 0 auto;">
            </td>
          </tr>
          <tr>
            <td height="4" style="background: linear-gradient(to right, #E9870F, #ffbca1);"></td>
          </tr>
          <tr>
            <td class="content">
              <h2 style="font-family: 'Outfit', sans-serif; font-size: 24px; margin-top: 0; color: #ffffff;">Bonjour ${username},</h2>
              <p style="font-size: 16px; color: #bcccdc; line-height: 1.6;">L'aventure vous attend ! Un événement que vous suivez sur <strong>Riftbound Media</strong> commence aujourd'hui.</p>
              
              <div class="event-box">
                <span style="font-size: 11px; font-weight: 800; color: #E9870F; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 8px;">Alerte Événement</span>
                <h3 style="font-family: 'Outfit', sans-serif; font-size: 20px; color: #ffffff; margin: 0 0 15px 0;">${event.title}</h3>
                <div style="font-size: 14px; color: #d9e2ec;">
                  <p style="margin: 5px 0;">📅 <strong>${formattedDate}</strong></p>
                  <p style="margin: 5px 0;">📍 <em>${event.location || 'En ligne / Discord'}</em></p>
                </div>
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <a href="https://www.riftbound-media.fr/calendar" class="btn">Voir sur le calendrier</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="font-size: 12px; color: #627d98; margin: 0 0 10px 0;">Vous recevez cet email car vous avez activé une alerte sur notre site.</p>
              <p style="font-size: 12px; color: #627d98; margin: 0;">&copy; 2026 Riftbound Media. <a href="https://www.riftbound-media.fr" style="color: #E9870F; text-decoration: none;">Visiter le site</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
