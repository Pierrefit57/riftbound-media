/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                'rift': {
                    50: '#eafffe',
                    100: '#cbfffe',
                    200: '#9efffd',
                    300: '#5afbfc',
                    400: '#00d9ff',
                    500: '#00bce6',
                    600: '#0095c1',
                    700: '#08769c',
                    800: '#10607f',
                    900: '#0a0e17',
                    950: '#050810',
                },
                'surface': {
                    DEFAULT: '#0f1420',
                    light: '#161c2e',
                    lighter: '#1e2640',
                    border: 'rgba(0, 217, 255, 0.15)',
                },
                'accent': {
                    cyan: '#00d9ff',
                    purple: '#a855f7',
                    gold: '#fbbf24',
                    red: '#ef4444',
                },
            },
            keyframes: {
                'glow-pulse': {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
                'slide-up': 'slide-up 0.6s ease-out',
                'fade-in': 'fade-in 0.4s ease-out',
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
}
