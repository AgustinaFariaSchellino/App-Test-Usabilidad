
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#0d7ff2",
                "background-light": "#f5f7f8",
                "background-dark": "#101922",
            },
            fontFamily: {
                "display": ["Inter"] // Adding sans-serif fallback in CSS, keeping Inter here for Tailwind classes
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
        },
    },
}
