/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep': 'var(--bg-deep)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
        'accent-orange': 'var(--accent-orange)',
        'accent-coral': 'var(--accent-coral)',
        'accent-cream': 'var(--accent-cream)',
        'accent-lavender': 'var(--accent-lavender)',
        'accent-mint': 'var(--accent-mint)',
        'accent-pink': 'var(--accent-pink)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-dim': 'var(--text-dim)',
        'border-subtle': 'var(--border-subtle)',
      },
      fontFamily: {
        display: ['ZCOOL KuaiLe', 'sans-serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
