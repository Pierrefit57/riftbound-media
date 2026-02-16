
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);

const toEmail = 'zawodny.pierre@gmail.com';

async function testSimpleEmail() {
    console.log(`Sending MINIMAL test email to ${toEmail}...`);
    try {
        const { data, error } = await resend.emails.send({
            from: 'notifications@riftbound-media.fr',
            to: toEmail,
            subject: 'Test Minimal Riftbound',
            text: 'Ceci est un test minimal sans HTML pour vérifier la réception. Si tu reçois ça, c'est que le design V3 était peut- être bloqué.'
        });

    if (error) {
        console.error(`Error:`, JSON.stringify(error, null, 2));
    } else {
        console.log(`Success! ID: ${data?.id}`);
    }
} catch (err) {
    console.error(`Exception:`, err);
}
}

testSimpleEmail();
