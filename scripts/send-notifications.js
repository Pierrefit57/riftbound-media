
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
  console.error('Missing environment variables. Please check .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const resend = new Resend(resendApiKey);

async function sendNotifications() {
  console.log('--- Start Notification Script ---');

  // 1. Get events starting today (Paris time ideally, but we'll use UTC/ISO for simplicity here)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  console.log(`Checking events between ${startOfToday} and ${endOfToday}`);

  const { data: events, error: eventError } = await supabase
    .from('calendar_events')
    .select('id, title, start_date, location, type')
    .gte('start_date', startOfToday)
    .lte('start_date', endOfToday);

  if (eventError) {
    console.error('Error fetching events:', eventError);
    return;
  }

  if (!events || events.length === 0) {
    console.log('No events starting today.');
    return;
  }

  console.log(`Found ${events.length} event(s) starting today.`);

  // 2. Fetch all profiles to get usernames
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  // 3. Fetch all users from Auth to map emails
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  // 4. Process each event
  for (const event of events) {
    console.log(`Processing event: ${event.title}`);

    // Get followers for this event
    const { data: follows, error: followError } = await supabase
      .from('event_follows')
      .select('user_id')
      .eq('event_id', event.id);

    if (followError) {
      console.error(`Error fetching follows for event ${event.id}:`, followError);
      continue;
    }

    if (!follows || follows.length === 0) {
      console.log(`No followers for event: ${event.title}`);
      continue;
    }

    console.log(`Found ${follows.length} follower(s) for event: ${event.title}`);

    // Map user_id to emails and usernames
    const subscribers = follows
      .map(f => {
        const user = users.find(u => u.id === f.user_id);
        const profile = profiles.find(p => p.id === f.user_id);
        return {
          email: user?.email,
          username: profile?.username || user?.user_metadata?.username || 'Invocateur'
        };
      })
      .filter(s => !!s.email);

    if (subscribers.length === 0) {
      console.log('No valid subscribers found for followers.');
      continue;
    }

    // 5. Send Emails
    for (const sub of subscribers) {
      await sendEventEmail(sub.email, sub.username, event);
    }
  }

  console.log('--- Notification Script Completed ---');
}

async function sendEventEmail(to, username, event) {
  const formattedDate = new Date(event.start_date).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  });

  const html = `
    <!DOCTYPE html>
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
        body { margin: 0; padding: 0; background-color: #050914; font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, helvetica, arial, sans-serif; -webkit-font-smoothing: antialiased; }
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
              <!-- Header with Logo -->
              <tr>
                <td class="header">
                  <img src="https://www.riftbound-media.fr/riftbound-logo.png" alt="Riftbound Media" width="180" style="display: block; margin: 0 auto;">
                </td>
              </tr>
              <!-- Top Accent Gradient -->
              <tr>
                <td height="4" style="background: linear-gradient(to right, #E9870F, #ffbca1);"></td>
              </tr>
              <!-- Body Content -->
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
              <!-- Footer -->
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
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Riftbound Media <notifications@riftbound-media.fr>',
      to,
      subject: `🔔 Jour J : ${event.title}`,
      html: html,
    });

    if (error) {
      console.error(`Error sending to ${to}:`, error);
    } else {
      console.log(`Email sent to ${to}. ID: ${data?.id}`);
    }
  } catch (err) {
    console.error(`Exception sending to ${to}:`, err);
  }
}

sendNotifications();
