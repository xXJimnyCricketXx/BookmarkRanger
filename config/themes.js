// Each theme defines just 4 base colors: bg (page), text (font), accent
// (highlight/buttons/links) and header (navbar background). Everything else
// (card, footer, subtext, contrast text) is derived automatically — see
// utils/color.js#resolveTheme. This mirrors Flame: a theme is one fixed
// look, not a light/dark pair with a toggle.
const PRESETS = {
    bookmarkranger: {
        label: 'BookmarkRanger!',
        bg: '#1a1a1d',
        text: '#f2f2f4',
        accent: '#ff6f9c',
        header: '#ff6f9c'
    },

    mint: {
        label: 'Mint',
        bg: '#171717',
        text: '#ffffff',
        accent: '#10b981',
        header: '#10b981'
    },

    blue: {
        label: 'Ocean',
        bg: '#0f172a',
        text: '#eff6ff',
        accent: '#60a5fa',
        header: '#172554'
    },

    cyan: {
        label: 'Cyan',
        bg: '#061d27',
        text: '#ecfeff',
        accent: '#22d3ee',
        header: '#164e63'
    },

    slate: {
        label: 'Slate',
        bg: '#0f172a',
        text: '#f8fafc',
        accent: '#94a3b8',
        header: '#020617'
    },

    forest: {
        label: 'Forest',
        bg: '#111f11',
        text: '#e8f5e8',
        accent: '#6abf6a',
        header: '#0d160d'
    },

    midnight: {
        label: 'Midnight',
        bg: '#050510',
        text: '#e8eaff',
        accent: '#7c73f5',
        header: '#07071a'
    },

    sand: {
        label: 'Sand',
        bg: '#231a10',
        text: '#fdf8f0',
        accent: '#d4aa6a',
        header: '#1a1008'
    }
};

module.exports = PRESETS;
