/**
 * Tailwind CSS configuration file
 *
 * This file defines the paths to all of the template files in the project so
 * Tailwind can tree‑shake unused styles in production builds. The `extend`
 * section is reserved for any future customizations to the default Tailwind
 * theme.
 *
 * See https://tailwindcss.com/docs/configuration for more details.
 */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
