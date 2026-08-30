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
        header: '#22d3ee'
    },

    slate: {
        label: 'Slate',
        bg: '#0f172a',
        text: '#f8fafc',
        accent: '#94a3b8',
        header: '#94a3b8'
    },

    forest: {
        label: 'Forest',
        bg: '#111f11',
        text: '#e8f5e8',
        accent: '#6abf6a',
        header: '#0d160d'
    },

    midnight: {
        // Dracula's official "Background Darker" + "Background" shades (draculatheme.com/spec),
        // used the way real Dracula-themed editors do: darker page, lighter panel/header.
        label: 'Midnight',
        bg: '#191a21',
        text: '#f8f8f2',
        accent: '#bd93f9',
        header: '#282a36'
    },

    coffee: {
        label: 'Coffee',
        bg: '#231a10',
        text: '#fdf8f0',
        accent: '#d4aa6a',
        header: '#1a1008'
    },

    gazette: {
        label: 'Gazette',
        bg: '#f2f7ff',
        text: '#000000',
        accent: '#5c5c5c',
        header: '#5c5c5c'
    },

    espresso: {
        label: 'Espresso',
        bg: '#21211f',
        text: '#d1b59a',
        accent: '#4e4e4e',
        header: '#d1b59a'
    },

    sky: {
        label: 'Sky',
        bg: '#f1f2f0',
        text: '#35342f',
        accent: '#37bbe4',
        header: '#37bbe4'
    },

    lime: {
        label: 'Lime',
        bg: '#263238',
        text: '#aabbc3',
        accent: '#aeea00',
        header: '#aeea00'
    },

    autumn: {
        label: 'Autumn',
        bg: '#704f33',
        text: '#f2e9dc',
        accent: '#f0b44c',
        header: '#f0b44c'
    }
};

module.exports = PRESETS;
