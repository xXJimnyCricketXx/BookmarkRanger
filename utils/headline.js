function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Greeting order mirrors the Custom greetings field: evening;afternoon;morning;night.
// {username} in the custom text is swapped for the account's name, highlighted via CSS.
function greetingFor(settings, username, now = new Date()) {
    const [evening, afternoon, morning, night] = settings.customGreetings.split(';').map((s) => s.trim());
    const hour = now.getHours();

    let text;
    if (hour >= 5 && hour < 12) text = morning;
    else if (hour >= 12 && hour < 18) text = afternoon;
    else if (hour >= 18 && hour < 22) text = evening;
    else text = night;

    const highlighted = `<span class="username-highlight">${escapeHtml(username)}</span>`;
    return text.replace(/\{username\}/g, highlighted);
}

function formattedDateFor(settings, now = new Date()) {
    const weekdayNames = settings.customWeekdayNames.split(';').map((s) => s.trim());
    const monthNames = settings.customMonthNames.split(';').map((s) => s.trim());
    const weekday = weekdayNames[now.getDay()];
    const month = monthNames[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();

    return settings.dateFormat === 'month-first'
        ? `${weekday}, ${month} ${day} ${year}`
        : `${weekday}, ${day} ${month} ${year}`;
}

module.exports = { greetingFor, formattedDateFor };
