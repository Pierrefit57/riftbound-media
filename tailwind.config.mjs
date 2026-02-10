/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Cinzel', 'Georgia', 'serif'],
            },
            colors: {
                // Fond beige chaud Spiritforged
                'rift': {
                    50: '#917D6E',      // Assombri de 20% supplémentaire (était #B69C8A)
                    100: '#B69C8A',     // Ancien 50, pour référence
                    200: '#c09f88',
                    300: '#b8956e',
                    400: '#a5804f',
                    500: '#8b6a3e',
                    600: '#755836',
                    700: '#5a432a',
                    800: '#3d2d1c',
                    900: '#2a1a10',
                    950: '#1a100a',
                },
                // Surfaces claires
                'surface': {
                    DEFAULT: '#f5ece3',
                    light: '#faf6f1',
                    darker: '#e8ddd1',
                    border: 'rgba(180, 140, 100, 0.2)',
                },
                // Accents Spiritforged
                'accent': {
                    spirit: '#A53254',      // Nouveau rose foncé (était #E8B0B3)
                    sakura: '#E8B0B3',       // Rose pétale clair (inchangé pour les pétales)
                    forge: '#c9a84c',        // Or doré (cadre)
                    steel: '#7a8599',        // Acier/argent (lames)
                    glow: '#f0d0d5',         // Lueur rose douce
                },
                // Domains du jeu
                'domain': {
                    fury: '#e39ea6',
                    calm: '#4a9e6d',
                    mind: '#4a7ec9',
                    body: '#d48a3c',
                    chaos: '#8a4ec9',
                    order: '#c9a84c',
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
        },
    },
    plugins: [require('@tailwindcss/typography')],
}
