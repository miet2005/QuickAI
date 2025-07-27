/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Make sure it includes your src files
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5044E5", // 👈 define custom color here
      },
    },
  },
  plugins: [],
};
