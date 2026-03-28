/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			nunito: ['Nunito', 'sans-serif'],
  			playfair: ['Playfair Display', 'serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			teal: {
  				50: '#F0FDFA',
  				100: '#CCFBF1',
  				600: '#0D9488',
  				700: '#0F766E',
  			},
  			orange: {
  				50: '#FFF7ED',
  				500: '#F97316',
  			},
  			green: {
  				500: '#10B981',
  			},
  			red: {
  				500: '#EF4444',
  			},
  			gray: {
  				300: '#D1D5DB',
  				600: '#4B5563',
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  		},
  		animation: {
  		'accordion-down': 'accordion-down 0.2s ease-out',
  		'accordion-up': 'accordion-up 0.2s ease-out',
  		'fly-in': 'fly-in 0.4s ease-out',
  		'wiggle': 'wiggle 0.5s ease-in-out',
  		'shimmer': 'shimmer 1.5s ease-in-out infinite',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}