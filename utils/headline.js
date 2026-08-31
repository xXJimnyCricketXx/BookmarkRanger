// Greeting order mirrors the Custom greetings field: evening;afternoon;morning;night.
function greetingFor(settings, now = new Date()) {
    const [evening, afternoon, morning, night] = settings.customGreetings.split(';').map((s) => s.trim());
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return morning;
    if (hour >= 12 && hour < 18) return afternoon;
    if (hour >= 18 && hour < 22) return evening;
    return night;
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
