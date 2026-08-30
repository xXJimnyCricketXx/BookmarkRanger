function hexToRgb(hex) {
    const clean = (hex || '').replace('#', '');
    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
    };
}

function toHex(n) {
    return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

function mix(hexA, hexB, weightB) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const r = a.r + (b.r - a.r) * weightB;
    const g = a.g + (b.g - a.g) * weightB;
    const bl = a.b + (b.b - a.b) * weightB;
    return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

function lighten(hex, amount) {
    return mix(hex, '#ffffff', amount);
}

function darken(hex, amount) {
    return mix(hex, '#000000', amount);
}

function luminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Which logo file suffix reads best on top of the given background color:
// "dark" = the light-text logo variant (for dark/saturated backgrounds),
// "light" = the dark-text logo variant (for pale backgrounds).
function logoVariantFor(hex) {
    return luminance(hex) < 0.5 ? 'dark' : 'light';
}

// A readable text color (near-white or near-black) for the given background.
function contrastText(hex) {
    return luminance(hex) < 0.5 ? '#f5f5f7' : '#14161a';
}

// Expands a theme's 4 base colors (bg, text, accent, header) into the full
// set of surface/contrast colors the UI needs, so a new theme only has to
// define those 4 values and everything else stays visually consistent.
function resolveTheme(base) {
    const isDarkBg = luminance(base.bg) < 0.5;
    const card = isDarkBg ? lighten(base.bg, 0.05) : mix(base.bg, '#ffffff', 0.85);
    const footer = darken(base.bg, 0.15);
    const subtext = mix(base.text, base.bg, 0.45);

    return {
        label: base.label,
        bg: base.bg,
        card,
        navbar: base.header,
        footer,
        text: base.text,
        subtext,
        highlight: base.accent,
        highlightText: contrastText(base.accent),
        navText: contrastText(base.header),
        footerText: contrastText(footer),
        accentText: base.accent,
        isDarkBg
    };
}

module.exports = { mix, lighten, darken, luminance, logoVariantFor, contrastText, resolveTheme };
