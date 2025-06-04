"use client";
import React, { useEffect, useRef } from "react";
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const OBTENER_FOCOS = gql`
  query FocosDeCalor($range: String) {
    focosDeCalor(range: $range) {
      latitude
      longitude
      confidence
      acq_date
      acq_time
      bright_ti4
      bright_ti5
      frp
    }
  }
`;

const OBTENER_REPORTES = gql`
  query ObtenerReportes {
    obtenerReportes {
      id
      nombre_lugar
      ubicacion {
        coordinates
      }
      gravedad_incendio
    }
  }
`;

const calcularConfianza = (bright_ti4, bright_ti5, frp) => {
    const max_bright_ti4 = 350;
    const max_bright_ti5 = 350;
    const max_frp = 10;

    const normalized_bright_ti4 = Math.min(bright_ti4 / max_bright_ti4, 1);
    const normalized_bright_ti5 = Math.min(bright_ti5 / max_bright_ti5, 1);
    const normalized_frp = Math.min(frp / max_frp, 1);

    const confianza = (normalized_bright_ti4 * 0.3) +
        (normalized_bright_ti5 * 0.3) +
        (normalized_frp * 0.4);
    return (confianza * 100).toFixed(2);
};

const calcularHorasDesdeDeteccion = (acq_date, acq_time) => {
    if (!acq_date) return -1;
    try {
        const [year, month, day] = acq_date.split('-').map(Number);
        const time = acq_time?.toString().padStart(4, '0') || "0000";
        const hours = parseInt(time.substring(0, 2), 10);
        const minutes = parseInt(time.substring(2, 4), 10);

        const detectionDate = new Date(year, month - 1, day, hours, minutes);
        const now = new Date();
        const diffMs = now - detectionDate;
        return diffMs / (1000 * 3600);
    } catch (err) {
        console.error("Error al calcular horas:", err);
        return -1;
    }
};

const determinarColorPorHoras = (horas) => {
    if (horas < 0) return "#999999";
    if (horas < 1) return "#FF0000";
    if (horas < 3) return "#FF4500";
    if (horas < 6) return "#FFA500";
    if (horas < 12) return "#FFC800";
    if (horas < 24) return "#FFFF00";
    return "#000000";
};

const Map = ({ center, markers = [], selectedLocation, onMapClick, onMarkerClick }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const heatLayerRef = useRef(null);
    const reportesLayerRef = useRef(null);

    const { data: focosData } = useQuery(OBTENER_FOCOS, {
        variables: { range: "today" }
    });

    const { data: reportesData } = useQuery(OBTENER_REPORTES);

    useEffect(() => {
        const L = require('leaflet');
        require('leaflet/dist/leaflet.css');

        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current, {
                center,
                zoom: 6,
                minZoom: 3,
                maxZoom: 13,
                worldCopyJump: false,
                maxBounds: [[-30, -80], [-5, -50]],
                maxBoundsViscosity: 0.7
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(mapInstanceRef.current);

            markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
            heatLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
            reportesLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

            mapInstanceRef.current.on('click', (e) => {
                if (onMapClick) onMapClick(e);
            });
        }

        if (selectedLocation && mapInstanceRef.current) {
            const L = require('leaflet');
            markersLayerRef.current.clearLayers();

            L.circleMarker(selectedLocation, {
                radius: 8,
                fillColor: "#3388ff",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(markersLayerRef.current);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [center, selectedLocation]);

    useEffect(() => {
        if (!mapInstanceRef.current) return;
        const L = require('leaflet');

        markersLayerRef.current.clearLayers();
        heatLayerRef.current.clearLayers();
        reportesLayerRef.current.clearLayers();

        if (focosData?.focosDeCalor) {
            focosData.focosDeCalor.forEach(foco => {
                const lat = parseFloat(foco.latitude);
                const lng = parseFloat(foco.longitude);
                const conf = calcularConfianza(foco.bright_ti4, foco.bright_ti5, foco.frp);
                const horasDesde = calcularHorasDesdeDeteccion(foco.acq_date, foco.acq_time);
                const color = determinarColorPorHoras(horasDesde);

                const circulo = L.circle([lat, lng], {
                    color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    radius: 1000,
                }).addTo(heatLayerRef.current);

                circulo.bindPopup(`
                    <div class="p-2">
                        <h4 class="font-bold">Foco de calor</h4>
                        <p>Confianza: ${conf}%</p>
                        <p>Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                    </div>
                `);
            });
        }

        if (reportesData?.obtenerReportes) {
            reportesData.obtenerReportes.forEach(reporte => {
                const lat = reporte.ubicacion?.coordinates[1] || -16.5;
                const lng = reporte.ubicacion?.coordinates[0] || -64.5;

                let color;
                switch (reporte.gravedad_incendio) {
                    case "Alto": color = "#ff0000"; break;
                    case "Mediano": color = "#ff9900"; break;
                    case "Bajo": color = "#ffcc00"; break;
                    default: color = "#ff0000";
                }

                const isSelected = selectedLocation && lat === selectedLocation[0] && lng === selectedLocation[1];

                const icono = L.divIcon({
                    html: `<div class="rounded-full w-6 h-6 flex items-center justify-center font-bold ${isSelected ? 'ring-4 ring-blue-500' : ''}" style="background-color: ${color}; color: white;">R</div>`,
                    className: "",
                    iconSize: [24, 24],
                });

                const marcador = L.marker([lat, lng], { icon: icono })
                    .addTo(reportesLayerRef.current)
                    .bindPopup(`
                        <div class="p-2">
                          <h4 class="font-bold">Reporte de incendio</h4>
                          <p>Lugar: ${reporte.nombre_lugar || 'No especificado'}</p>
                          <p>Gravedad: ${reporte.gravedad_incendio || 'No especificada'}</p>
                          <p>Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                        </div>
                    `);

                marcador.on('click', () => {
                    if (onMapClick) {
                        onMapClick({ latlng: { lat, lng } });
                    }
                });
            });
        }

        markers.forEach(marker => {
            const customIcon = L.divIcon({
                html: `<div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">${marker.type === 'reporte' ? 'R' : 'F'}</div>`,
                className: '',
                iconSize: [24, 24]
            });

            const m = L.marker([marker.position[0], marker.position[1]], { icon: customIcon })
                .addTo(markersLayerRef.current)
                .bindPopup(`<b>${marker.title}</b>`);

            m.on('click', () => {
                if (onMarkerClick) onMarkerClick(marker);
            });
        });

        if (selectedLocation) {
            L.circleMarker(selectedLocation, {
                radius: 8,
                fillColor: "#3388ff",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(markersLayerRef.current);
        }

    }, [focosData, reportesData, markers, selectedLocation]);

    return <div ref={mapRef} className="w-full h-full" />;
};

export default Map;
