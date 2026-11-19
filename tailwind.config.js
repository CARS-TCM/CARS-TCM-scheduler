/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /*
       * THEME – change colours here and the whole app follows.
       * Dark surfaces, Council blue banners (#0067B1) and a yellow accent (#FFD200).
       */
      colors: {
        page: '#0a1220', // page background
        surface: '#111d30', // cards, inputs, dialogs
        'surface-2': '#17263c', // subtle panels, table headers
        line: '#2b3d57', // normal borders
        'line-strong': '#7088a8', // input and control borders
        ink: '#eaf0f8', // main text
        ink2: '#d3dceb', // secondary text
        muted: '#a9b8cf', // helper text
        link: '#7cc3ff',
        'on-accent': '#101826', // dark text for use on yellow
        brand: { DEFAULT: '#0067B1', dark: '#004A80' }, // banners
        accent: { DEFAULT: '#FFD200', hover: '#E6BD00' }, // yellow highlights
        // Status colours (always paired with a text label and an icon)
        ok: { bg: '#0e2f26', line: '#34a874', fg: '#a4f0cb' },
        warn: { bg: '#3a2e05', line: '#d9a400', fg: '#ffd966' },
        bad: { bg: '#3d1420', line: '#e5576b', fg: '#ffb3bf' },
        info: { bg: '#0b2a47', line: '#3b9ae1', fg: '#a9d6ff' },
        vio: { bg: '#2a1d4a', line: '#9b7be0', fg: '#d6c6ff' },
      },
    },
  },
  plugins: [],
};
