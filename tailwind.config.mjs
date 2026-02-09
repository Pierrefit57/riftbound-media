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
                    50: '#d5b8a4',
                    100: '#d0b29c',
                    200: '#c4a08a',
                    300: '#d9b796',
                    400: '#c99b70',
                    500: '#b07d50',
                    600: '#a56b3f',
                    700: '#7a4e2e',
                    800: '#4a2f1c',
                    900: '#2a1a10',
                    950: '#1a100a',
                },
                // Surfaces claires
                'surface': {
                    DEFAULT: '#fff8f0',
                    light: '#ffffff',
                    darker: '#f3e8da',
                    border: 'rgba(180, 140, 100, 0.2)',
                },
                // Accents Spiritforged
                'accent': {
                    spirit: '#c93545',      // Cramoisi (rubans d'Irelia)
                    sakura: '#e8809a',       // Rose pétale
                    forge: '#c9a84c',        // Or doré (cadre)
                    steel: '#7a8599',        // Acier/argent (lames)
                    glow: '#f5d0d8',         // Lueur rose douce
                },
                // Domains du jeu
                'domain': {
                    fury: '#c93545',
                    calm: '#4a9e6d',
                    mind: '#4a7ec9',
                    body: '#d48a3c',
                    chaos: '#8a4ec9',
                    order: '#c9a84c',
                },
            },
            backgroundImage: {
                'spirit-radial': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(232,128,154,0.15), transparent)',
                'forge-radial': 'radial-gradient(ellipse 60% 40% at 50% 120%, rgba(201,168,76,0.1), transparent)',
            },
            boxShadow: {
                'spirit': '0 4px 20px rgba(201,53,69,0.1)',
                'forge': '0 4px 20px rgba(201,168,76,0.1)',
                'sakura': '0 4px 20px rgba(232,128,154,0.15)',
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
