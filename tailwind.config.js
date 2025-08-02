module.exports = {
  content: ["./pages/*.{html,js}", "./index.html", "./js/*.js"],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: "#0a0a0a", // Deep canvas for product showcase
        secondary: "#1a1a1a", // Subtle surface elevation and depth - gray-900
        accent: "#00bcd4", // Interactive elements and progress indicators - cyan-400
        
        // Background Colors
        background: "#000000", // Pure backdrop for maximum contrast - black
        surface: "#2a2a2a", // Card backgrounds and content containers - gray-800
        
        // Text Colors
        'text-primary': "#ffffff", // High contrast for readability - white
        'text-secondary': "#a0a0a0", // Supporting information and metadata - gray-400
        
        // Status Colors
        success: "#10b981", // Purchase confirmations and positive states - emerald-500
        warning: "#f59e0b", // Inventory alerts and attention items - amber-500
        error: "#ef4444", // Form validation and error messaging - red-500
        
        // Additional Shades
        'accent-light': "#4dd0e1", // cyan-300
        'accent-dark': "#0097a7", // cyan-600
        'surface-light': "#3a3a3a", // gray-700
        'surface-dark': "#1f1f1f", // gray-900
        
        // Extended Palette for more options
        'cyber-blue': "#00bcd4", // cyan-400
        'neon-purple': "#9c27b0", // purple-600
        'dark-slate': "#0f172a", // slate-900
        'charcoal': "#374151", // gray-700
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontWeight: {
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
        'black': 900,
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 188, 212, 0.3)',
        'glow-lg': '0 0 30px rgba(0, 188, 212, 0.5)',
        'glow-xl': '0 0 40px rgba(0, 188, 212, 0.6)',
        'inner-glow': 'inset 0 0 20px rgba(0, 188, 212, 0.2)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%': { boxShadow: '0 0 20px rgba(0, 188, 212, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 188, 212, 0.6)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionDuration: {
        '300': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'ease-out',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}