function luminance(hex) {
    const clean = (hex || '').replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Which logo file suffix reads best on top of the given background color:
// "dark" = the light-text logo variant (for dark/saturated backgrounds),
// "light" = the dark-text logo variant (for pale backgrounds).
function logoVariantFor(hex) {
    return luminance(hex) < 0.5 ? 'dark' : 'light';
}

module.exports = { luminance, logoVariantFor };
