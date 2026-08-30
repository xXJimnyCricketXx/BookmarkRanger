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
        // Fall foliage: chestnut bark, rust-red header, burnt-orange accent.
        label: 'Autumn',
        bg: '#2c1810',
        text: '#f5e6d3',
        accent: '#d9822b',
        header: '#8c2f1c'
    },

    sunset: {
        // Dusk: deep plum sky, magenta sunset band, glowing orange sun.
        label: 'Sunset',
        bg: '#2b1e3d',
        text: '#fdece0',
        accent: '#ff8c42',
        header: '#d1477a'
    },

    nord: {
        // Official Nord palette (nordtheme.com): Polar Night bg/panel, Frost accent, Snow Storm text.
        label: 'Nord',
        bg: '#2e3440',
        text: '#eceff4',
        accent: '#88c0d0',
        header: '#3b4252'
    },

    catppuccin: {
        // Official Catppuccin Mocha palette (catppuccin.com/palette).
        label: 'Catppuccin',
        bg: '#1e1e2e',
        text: '#cdd6f4',
        accent: '#cba6f7',
        header: '#313244'
    },

    solarized: {
        // Official Solarized Dark palette (ethanschoonover.com/solarized).
        label: 'Solarized',
        bg: '#002b36',
        text: '#839496',
        accent: '#268bd2',
        header: '#073642'
    },

    gruvbox: {
        // Official Gruvbox Dark, medium contrast (github.com/morhetz/gruvbox).
        label: 'Gruvbox',
        bg: '#282828',
        text: '#ebdbb2',
        accent: '#fe8019',
        header: '#3c3836'
    }
};

module.exports = PRESETS;
