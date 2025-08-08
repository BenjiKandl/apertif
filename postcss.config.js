// PostCSS configuration for Tailwind CSS v4+
//
// Tailwind CSS 4 moved its PostCSS plugin into the `@tailwindcss/postcss`
// package. To use Tailwind via PostCSS you must import the plugin and
// include it in the `plugins` array.
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [tailwindcss, autoprefixer],
};
