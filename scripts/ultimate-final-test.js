
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const resend = new Resend(resendApiKey);
const supabase = createClient(supabaseUrl, serviceRoleKey);

const toEmail = 'zawodny.pierre@gmail.com';
const eventId = 'fd30eb87-9d93-4f19-9d3b-2433627c3f01'; // "Riot Merch : Pack Nouvel An Lunaire"

async function finalVerificationEmail() {
    console.log(`Sending final verification email to ${toEmail}...`);

    // 1. Fetch Event
    const { data: event, error: eventError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (eventError) {
        console.error('Event Error:', eventError);
        return;
    }

    // 2. Fetch User & Profile
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === toEmail);

    if (!user) {
        console.error('User not found');
        return;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

    const username = profile?.username || user?.user_metadata?.username || 'test';

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
      <style>
        body { margin: 0; padding: 0; background-color: #050914; font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, helvetica, arial, sans-serif; -webkit-font-smoothing: antialiased; }
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
                  <p style="font-size: 16px; color: #bcccdc; line-height: 1.6;">L'aventure vous attend ! Un événement que vous suivez sur <strong>Riftbound Media</strong> commence bientôt.</p>
                  
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
                  <p style="font-size: 12px; color: #627d98; margin: 0 0 10px 0;">Rendu final validé. Bon de déconnexion & zoom PDF aussi en ligne.</p>
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
            from: 'notifications@riftbound-media.fr',
            to: toEmail,
            subject: `🔔 CONFIRMATION : ${event.title}`,
            html: html,
        });

        if (error) {
            console.error(`Error:`, error);
        } else {
            console.log(`Success! ID: ${data?.id}`);
        }
    } catch (err) {
        console.error(`Exception:`, err);
    }
}

finalVerificationEmail();
