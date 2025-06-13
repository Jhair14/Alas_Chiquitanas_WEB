export const calcularConfianza = (bright_ti4, bright_ti5, frp) => {
    const max_bright_ti4 = 350;
    const max_bright_ti5 = 350;
    const max_frp = 10;

    const normalized_bright_ti4 = Math.min(bright_ti4 / max_bright_ti4, 1);
    const normalized_bright_ti5 = Math.min(bright_ti5 / max_bright_ti5, 1);
    const normalized_frp = Math.min(frp / max_frp, 1);

    const confianza = (normalized_bright_ti4 * 0.3) + (normalized_bright_ti5 * 0.3) + (normalized_frp * 0.4);
    return parseFloat((confianza * 100).toFixed(2));
};

export const formatearFechaNASA = (acq_date, acq_time) => {
    if (!acq_date) return "Fecha no disponible";

    try {
        const [year, month, day] = acq_date.split('-').map(Number);

        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return "Fecha inválida";
        }

        const time = acq_time?.toString().padStart(4, '0');
        const hours = time.slice(0, 2);
        const minutes = time.slice(2);

        const hNum = parseInt(hours, 10);
        const mNum = parseInt(minutes, 10);

        const horaValida = !isNaN(hNum) && !isNaN(mNum) && hNum >= 0 && hNum <= 23 && mNum >= 0 && mNum <= 59;
        const horaFormateada = horaValida ? `${hours}:${minutes}` : '00:00';

        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}, ${horaFormateada}`;
    } catch {
        return "Fecha inválida";
    }
};

export const determinarColorPorHoras = (horas) => {
    if (horas < 0) return "#999999";
    if (horas < 1) return "#B20000";
    if (horas < 3) return "#B20000";
    if (horas < 6) return "#FFA500";
    if (horas < 12) return "#FFC800";
    if (horas < 24) return "#FFFF00";
    return "#000000";
};
