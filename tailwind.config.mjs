/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            colors: {
                // Fond Bleu Nuit & Orange (Nouveau Thème)
                'rift': {
                    50: '#ffffff',       // Blanc pur (Texte principal)
                    100: '#f0f4f8',      // Gris très clair (Texte secondaire)
                    200: '#d9e2ec',      // Gris clair
                    300: '#bcccdc',      // Gris bleuté
                    400: '#9fb3c8',      // Bleu gris moyen
                    500: '#829ab1',      // Bleu gris foncé
                    600: '#627d98',      // Bleu acier
                    700: '#334e68',      // Bleu nuit clair (Bordures)
                    800: '#1c2541',      // Bleu nuit moyen (Cartes)
                    900: '#0a1128',      // Bleu nuit profond (Fond principal)
                    950: '#050914',      // Noir bleuté (Fond sombre)
                },
                // Surfaces claires (Adaptées au thème sombre)
                'surface': {
                    DEFAULT: '#1c2541',  // Fond de carte (Bleu sombre)
                    light: '#3a506b',    // Fond de carte survol
                    darker: '#0a1128',   // Fond principal
                    border: 'rgba(255, 107, 53, 0.2)', // Bordure orange subtile
                },
                // Accents Orange & Or
                'accent': {
                    spirit: '#E9870F',       // Orange spécifique demandé
                    sakura: '#ffbca1',       // Pêche clair (Pétales / Highlights)
                    forge: '#fabc2a',        // Or doré
                    steel: '#7a8599',        // Acier
                    glow: '#ffddd2',         // Lueur orange douce
                },
                // Domains du jeu
                'domain': {
                    fury: '#E9870F',     // Orange
                    calm: '#4a9e6d',     // Vert
                    mind: '#4a7ec9',     // Bleu
                    body: '#d48a3c',     // Bronze
                    chaos: '#8a4ec9',    // Violet
                    order: '#fabc2a',    // Or
                },
            },
            backgroundImage: {
                'spirit-radial': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(227,158,166,0.15), transparent)',
                'forge-radial': 'radial-gradient(ellipse 60% 40% at 50% 120%, rgba(201,168,76,0.1), transparent)',
            },
            boxShadow: {
                'spirit': '0 4px 20px rgba(227,158,166,0.15)',
                'forge': '0 4px 20px rgba(201,168,76,0.1)',
                'sakura': '0 4px 20px rgba(237,184,190,0.2)',
                'card': '0 2px 12px rgba(42,26,16,0.06)',
                'card-hover': '0 8px 30px rgba(42,26,16,0.1)',
            },
            keyframes: {
                'petal-fall': {
                    '0%': { transform: 'translateY(-10vh) translateX(0) rotate(0deg)', opacity: '0' },
                    '10%': { opacity: '0.8' },
                    '90%': { opacity: '0.6' },
                    '100%': { transform: 'translateY(110vh) translateX(80px) rotate(360deg)', opacity: '0' },
                },
                'petal-fall-2': {
                    '0%': { transform: 'translateY(-10vh) translateX(0) rotate(0deg)', opacity: '0' },
                    '10%': { opacity: '0.7' },
                    '90%': { opacity: '0.5' },
                    '100%': { transform: 'translateY(110vh) translateX(-60px) rotate(-270deg)', opacity: '0' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
            },
            animation: {
                'petal-fall': 'petal-fall linear infinite',
                'petal-fall-2': 'petal-fall-2 linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'slide-up': 'slide-up 0.6s ease-out',
                'slide-up-delay': 'slide-up 0.6s ease-out 0.15s both',
                'slide-up-delay-2': 'slide-up 0.6s ease-out 0.3s both',
                'fade-in': 'fade-in 0.4s ease-out',
                'shimmer': 'shimmer 4s linear infinite',
            },
            typography: {
                DEFAULT: {
                    css: {
                        'blockquote p:first-of-type::before': { content: 'none' },
                        'blockquote p:last-of-type::after': { content: 'none' },
                    },
                },
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
}
