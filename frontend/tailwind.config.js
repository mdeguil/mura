/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    50:  '#EEEDFE',
                    100: '#CECBF6',
                    200: '#AFA9EC',
                    300: '#8F87E3',
                    400: '#7F77DD',
                    500: '#534AB7',
                    600: '#3C3489',
                    700: '#2B2562',
                },
            },
        },
    },
    plugins: [],
}