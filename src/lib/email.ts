import { Resend } from 'resend';

const resendApiKey = import.meta.env.RESEND_API_KEY;

// On initialise Resend uniquement si la clé est présente
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

/**
 * Envoie un email via Resend
 * Note: L'adresse 'from' doit être un domaine vérifié dans votre dashboard Resend.
 */
export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
    if (!resend) {
        console.error("Resend API Key manquante (RESEND_API_KEY). Impossible d'envoyer l'email.");
        return { error: new Error("Missing RESEND_API_KEY") };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: from || 'Riftbound Media <notifications@riftbound-media.com>',
            to,
            subject,
            html,
        });

        if (error) {
            console.error("Erreur Resend:", error);
            return { error };
        }

        return { data };
    } catch (err) {
        console.error("Exception lors de l'envoi d'email:", err);
        return { error: err };
    }
}
