"use client";

import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const GOOGLE_MAPS_API_KEY = "AIzaSyAkaZQbcbedUJmVDIcM2lsCKiP9mL9YDFw";

const obtenerUrlMapaGoogle = (lat, lon, zoom = 14, ancho = 300, alto = 150) =>
    `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${ancho}x${alto}&markers=color:red%7Clabel:C%7C${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`;

async function cargarImagenBase64(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("No se pudo cargar la imagen del mapa");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

const GenerateReportButton = ({ data, tipoReporte = "reporte" }) => {
    const marginLeft = 20;
    const pageWidth = 210;
    const usableWidth = pageWidth - marginLeft * 2;

    const colorNaranja = [226, 88, 34];
    const colorTexto = [40, 40, 40];
    const colorGrisClaro = [247, 247, 247];
    const font = "helvetica";

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        if (!isNaN(dateStr)) return new Date(Number(dateStr));
        if (dateStr instanceof Date) return dateStr;
        return new Date(dateStr);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Alto":
            case "activo":
                return "bg-red-100 text-red-800";
            case "Mediano":
                return "bg-yellow-100 text-yellow-800";
            case "Controlado":
            case "inactivo":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const generarPDF = async () => {
        const doc = new jsPDF();

        // LOGO Y TÍTULO COMÚN
        try {
            const logoBase64 = await cargarImagenBase64("/loguito.png");
            // Opción 1: Logo más grande manteniendo proporción cuadrada
            doc.addImage(logoBase64, "PNG", marginLeft, 10, 40, 40);

        } catch {
            // Ignorar error logo
        }

        doc.setFont(font, "bold");
        doc.setFontSize(20);
        doc.setTextColor(...colorNaranja);

        const titulo = tipoReporte === "reporte" ? "Informe de Incendio" : "Informe de Equipo";
        doc.text(titulo, pageWidth / 2, 25, { align: "center" });

        doc.setFontSize(11);
        doc.setFont(font, "normal");
        doc.setTextColor(...colorTexto);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, pageWidth / 2, 52, {
            align: "center",
        });

        doc.setDrawColor(...colorNaranja);
        doc.setLineWidth(0.7);
        doc.line(marginLeft, 58, pageWidth - marginLeft, 58);

        if (tipoReporte === "reporte") {
            // REPORTE DE INCENDIO (igual que antes)
            const reporte = data;

            // SECCIÓN 1: Datos del Reportante
            const section1Top = 65;
            const sectionHeight = 32;

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...colorNaranja);
            doc.setLineWidth(0.4);
            doc.roundedRect(marginLeft, section1Top, usableWidth, sectionHeight, 4, 4, "S");

            doc.setFontSize(14);
            doc.setTextColor(...colorNaranja);
            doc.setFont(font, "bold");
            doc.text("Datos del Reportante", marginLeft + 6, section1Top + 10);

            doc.setFontSize(12);
            doc.setTextColor(...colorTexto);
            doc.setFont(font, "normal");

            doc.text(`Nombre: ${reporte.nombre_reportante || "N/A"}`, marginLeft + 6, section1Top + 20);
            doc.text(`Teléfono: ${reporte.telefono_contacto || "N/A"}`, marginLeft + 110, section1Top + 20);

            // SECCIÓN 2: Datos del Reporte
            const section2TitleY = section1Top + sectionHeight + 16;
            const section2TableStartY = section2TitleY + 7;

            doc.setFontSize(14);
            doc.setTextColor(...colorNaranja);
            doc.setFont(font, "bold");
            doc.text("Datos del Reporte de Incendio", marginLeft + 6, section2TitleY);

            const fechaReporte = parseDate(reporte.fecha_hora);
            const fechaFormateada = fechaReporte ? fechaReporte.toLocaleString() : "Fecha no disponible";

            const coordenadas = reporte.ubicacion?.coordinates
                ? `${reporte.ubicacion.coordinates[1]?.toFixed(4) || "N/A"}, ${reporte.ubicacion.coordinates[0]?.toFixed(4) || "N/A"}`
                : "N/A";

            autoTable(doc, {
                startY: section2TableStartY,
                margin: { left: marginLeft + 6, right: marginLeft + 6 },
                tableWidth: usableWidth - 12,
                head: [["Campo", "Valor"]],
                body: [
                    ["Ubicación", reporte.nombre_lugar || "N/A"],
                    ["Coordenadas", coordenadas],
                    ["Fecha/Hora", fechaFormateada],
                    ["Tipo", reporte.tipo_incendio || "Incendio"],
                    ["Gravedad", reporte.gravedad_incendio || "N/A"],
                    [
                        "Origen",
                        reporte.creado === "voluntario" ? "Reporte Voluntario" : "Reporte de Brigadista",
                    ],
                    ["Comentarios", reporte.comentario_adicional || "Ninguno"],
                ],
                headStyles: {
                    fillColor: colorNaranja,
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 12,
                },
                bodyStyles: {
                    fontSize: 11,
                    textColor: colorTexto,
                    fillColor: [255, 255, 255],
                },
                alternateRowStyles: {
                    fillColor: colorGrisClaro,
                },
                styles: {
                    cellPadding: 4,
                    valign: "middle",
                    overflow: "linebreak",
                    font: font,
                },
                columnStyles: {
                    0: { cellWidth: 50, fontStyle: "bold" },
                    1: { cellWidth: "auto" },
                },
            });

            // Equipos asignados (si existen)
            if (reporte.equiposAsignados?.length > 0) {
                let equiposTitleY = doc.lastAutoTable.finalY + 20;
                if (equiposTitleY > 260) {
                    doc.addPage();
                    equiposTitleY = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(...colorNaranja);
                doc.setFont(font, "bold");
                doc.text("Equipos Asignados al Incendio", marginLeft + 6, equiposTitleY);

                const equiposTableStartY = equiposTitleY + 7;

                const equiposData = reporte.equiposAsignados.map((miembro) => [
                    `${miembro.nombre || "N/A"} ${miembro.apellido || ""}`.trim(),
                    miembro.rol || "N/A",
                    miembro.telefono || "N/A",
                    miembro.especialidad || "N/A",
                ]);

                autoTable(doc, {
                    startY: equiposTableStartY,
                    margin: { left: marginLeft + 6, right: marginLeft + 6 },
                    tableWidth: usableWidth - 12,
                    head: [["Nombre", "Rol", "Teléfono", "Especialidad"]],
                    body: equiposData,
                    headStyles: {
                        fillColor: colorNaranja,
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                        fontSize: 12,
                    },
                    bodyStyles: {
                        fontSize: 11,
                        textColor: colorTexto,
                        fillColor: [255, 255, 255],
                    },
                    alternateRowStyles: {
                        fillColor: colorGrisClaro,
                    },
                    styles: {
                        cellPadding: 4,
                        valign: "middle",
                        overflow: "linebreak",
                        font: font,
                    },
                    columnStyles: {
                        0: { cellWidth: 55 },
                        1: { cellWidth: 35 },
                        2: { cellWidth: 40 },
                        3: { cellWidth: 55 },
                    },
                });

                const equiposRectTop = equiposTitleY - 5;
                const equiposRectHeight = doc.lastAutoTable.finalY - equiposRectTop + 5;

                doc.setDrawColor(...colorNaranja);
                doc.setLineWidth(0.4);
                doc.roundedRect(marginLeft, equiposRectTop, usableWidth, equiposRectHeight, 4, 4, "S");

                const finalY = doc.lastAutoTable.finalY + 8;
                if (finalY < 280) {
                    doc.setFontSize(11);
                    doc.setFont(font, "normal");
                    doc.setTextColor(...colorTexto);
                    doc.text(`Total de brigadistas asignados: ${reporte.equiposAsignados.length}`, marginLeft + 6, finalY);
                }
            }

            // Nueva página para mapa (igual que antes)
            if (reporte.ubicacion?.coordinates) {
                try {
                    const lat = reporte.ubicacion.coordinates[1];
                    const lon = reporte.ubicacion.coordinates[0];
                    const urlMapa = obtenerUrlMapaGoogle(lat, lon, 14, 300, 150);
                    const mapaBase64 = await cargarImagenBase64(urlMapa);

                    doc.addPage();
                    doc.setFontSize(16);
                    doc.setTextColor(...colorNaranja);
                    doc.setFont(font, "bold");
                    doc.text("Ubicación en el Mapa", marginLeft, 25);

                    doc.addImage(mapaBase64, "PNG", marginLeft, 40, 170, 120);
                } catch (error) {
                    console.error("Error cargando mapa:", error);
                }
            }
        } else if (tipoReporte === "equipo") {
            // REPORTE DE EQUIPO
            const equipo = data;

            // Datos principales
            const section1Top = 65;
            const sectionHeight = 32;

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...colorNaranja);
            doc.setLineWidth(0.4);
            doc.roundedRect(marginLeft, section1Top, usableWidth, sectionHeight, 4, 4, "S");

            doc.setFontSize(14);
            doc.setTextColor(...colorNaranja);
            doc.setFont(font, "bold");
            doc.text("Datos del Equipo", marginLeft + 6, section1Top + 10);

            doc.setFontSize(12);
            doc.setTextColor(...colorTexto);
            doc.setFont(font, "normal");

            doc.text(`Nombre: ${equipo.nombre_equipo || "N/A"}`, marginLeft + 6, section1Top + 20);
            doc.text(`Estado: ${equipo.estado || "N/A"}`, marginLeft + 110, section1Top + 20);

            // Tabla de miembros
            const miembrosTableStartY = section1Top + sectionHeight + 16;

            doc.setFontSize(14);
            doc.setTextColor(...colorNaranja);
            doc.setFont(font, "bold");
            doc.text("Miembros del Equipo", marginLeft + 6, miembrosTableStartY);

            const miembrosData = equipo.miembros?.map((miembro) => [
                miembro.id_usuario?.nombre || "N/A",
                miembro.id_usuario?.apellido || "",
            ]) || [];

            autoTable(doc, {
                startY: miembrosTableStartY + 7,
                margin: { left: marginLeft + 6, right: marginLeft + 6 },
                tableWidth: usableWidth - 12,
                head: [["Nombre", "Apellido"]],
                body: miembrosData,
                headStyles: {
                    fillColor: colorNaranja,
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 12,
                },
                bodyStyles: {
                    fontSize: 11,
                    textColor: colorTexto,
                    fillColor: [255, 255, 255],
                },
                alternateRowStyles: {
                    fillColor: colorGrisClaro,
                },
                styles: {
                    cellPadding: 4,
                    valign: "middle",
                    overflow: "linebreak",
                    font: font,
                },
                columnStyles: {
                    0: { cellWidth: 70 },
                    1: { cellWidth: 70 },
                },
            });

            // Información ubicación y líder
            const infoY = doc.lastAutoTable.finalY + 20;

            doc.setFontSize(12);
            doc.setFont(font, "normal");
            doc.setTextColor(...colorTexto);
            doc.text(`Cantidad de integrantes: ${equipo.cantidad_integrantes || 0}`, marginLeft + 6, infoY);

            const lider = equipo.id_lider_equipo;
            doc.text(
                `Líder del equipo: ${lider ? `${lider.nombre} ${lider.apellido}` : "N/A"}`,
                marginLeft + 6,
                infoY + 10
            );

            doc.text(`Email líder: ${lider?.email || "N/A"}`, marginLeft + 6, infoY + 20);

            // Mapa del equipo (si existe)
            if (equipo.ubicacion?.coordinates) {
                try {
                    const lat = equipo.ubicacion.coordinates[1];
                    const lon = equipo.ubicacion.coordinates[0];
                    const urlMapa = obtenerUrlMapaGoogle(lat, lon, 14, 300, 150);
                    const mapaBase64 = await cargarImagenBase64(urlMapa);

                    doc.addPage();
                    doc.setFontSize(16);
                    doc.setTextColor(...colorNaranja);
                    doc.setFont(font, "bold");
                    doc.text("Ubicación en el Mapa", marginLeft, 25);

                    doc.addImage(mapaBase64, "PNG", marginLeft, 40, 170, 120);
                } catch (error) {
                    console.error("Error cargando mapa:", error);
                }
            }
        }

        // PIE DE PÁGINA (común a ambos)
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setFont(font, "normal");
        doc.setTextColor(150);

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const footerY = 290;
            doc.text("Sistema de Gestión de Incendios - Alas Chiquitanas", pageWidth / 2, footerY, {
                align: "center",
            });
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginLeft, footerY, { align: "right" });
        }

        doc.save(`${tipoReporte === "reporte" ? "Reporte_Incendio" : "Reporte_Equipo"}_${data.id}.pdf`);
    };

    return (
        <button
            onClick={generarPDF}
            className="bg-[#e25822] text-white px-4 py-2 rounded-md hover:bg-[#c84315] transition-colors flex items-center gap-2 text-sm font-semibold"
            title={`Generar informe formal y profesional del ${tipoReporte === "reporte" ? "incendio" : "equipo"}`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar Informe
        </button>
    );
};

export default GenerateReportButton;
