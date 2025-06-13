"use client";
import Image from 'next/image';
import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useQuery} from '@apollo/client';
import { OBTENER_FOCOS, OBTENER_REPORTES, OBTENER_USUARIO, OBTENER_EQUIPOS } from '../Endpoints/endpoints_graphql';


function MapaDeSeguimiento() {
    // Obtener nombre del lugar usando la API de geocodificación inversa (ahora solo se llama al hacer click)
    const obtenerNombreLugar = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await response.json();
            return data?.address?.city || data?.address?.town || data?.address?.village || "Desconocido";
        } catch (error) {
            console.error("Error al obtener el nombre del lugar:", error);
            return "Desconocido";
        }
    };

    const [mostrarNotas, setMostrarNotas] = useState(true);

    // Mantengo tus estados
    const [filtros, setFiltros] = useState({
        focosCalor: true,
        equipos: false,
        reportesIncendio: false
    });
    const [mapaListo, setMapaListo] = useState(false);
    const [datosCalor, setDatosCalor] = useState([]);
    const [datosEquipos, setDatosEquipos] = useState([]);

    const [reportesIncendio, setReportesIncendio] = useState([]);

    const [estadisticas, setEstadisticas] = useState({
        focos: 0,
        altaConfianza: 0,
        mediaConfianza: 0,
        bajaConfianza: 0,
        areasMonitoreadas: 18,
        beni: 5,
        santaCruz: 7,
        laPaz: 6,
        totalReportes: 0,
        reportesAlta: 0,
        reportesMedia: 0,
        reportesBaja: 0,
    });
    const {data: teamsData, loading: teamsLoading, error: teamsError} = useQuery(OBTENER_EQUIPOS, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        },
        fetchPolicy: 'network-only', // Evita usar cache
        onError: (error) => {
            if (error.graphQLErrors.some(e => e.message === 'No autorizado')) {
                // Redirigir a login si no está autenticado
                window.location.href = '/Login';
            }
        }
    });
    useEffect(() => {
        if (teamsData && teamsData.obtenerEquipos) {
            const equiposTransformados = teamsData.obtenerEquipos.map(equipo => ({
                id: equipo.id,
                nombre: equipo.nombre_equipo,
                lat: equipo.ubicacion?.coordinates[1] || -17.7833, // Latitud
                lng: equipo.ubicacion?.coordinates[0] || -63.1823, // Longitud
                personal: equipo.cantidad_integrantes,
                lider: equipo.id_lider_equipo,
                miembros: equipo.miembros,
                estado: equipo.estado
            }));
            setDatosEquipos(equiposTransformados);
        }
    }, [teamsData]);

    const formatearFecha = (timestamp) => {
        const fecha = new Date(Number(timestamp));
        return fecha.toLocaleString('es-BO', {
            timeZone: 'America/La_Paz',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    const reportesLayerRef = useRef(null);

    //logeeado
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [token, setToken] = useState(null);


    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState("No disponible");

    // Nuevo: rango de tiempo
    const [rango, setRango] = useState("today"); // "today", "24h", "7d"

    const mapaRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const heatLayerRef = useRef(null);


    // Ejecutar la query solo cuando tengamos el token
    const {data, loading} = useQuery(OBTENER_USUARIO, {
        variables: {token},
        skip: !token // Evita ejecutar la query si aún no hay token
    });

    const isAdmin = data?.obtenerUsuario?.rol === 'admin' ? true : false;


    //logueado
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
            setToken(token);
        }
    }, []);

    // Al montar, si el mapa no existe, creamos Leaflet
    useEffect(() => {
        if (!mapaListo || !mapaRef.current) return;
        if (!mapInstanceRef.current) {
            const L = window.L;

            // Crear el mapa con límites de zoom
            mapInstanceRef.current = L.map(mapaRef.current, {
                maxZoom: 12,  // Máximo nivel de zoom (acercamiento)
                minZoom: 5,   // Mínimo nivel de zoom (alejamiento)
                maxBounds: L.latLngBounds(  // Límites geográficos
                    L.latLng(-30, -80),  // Más al sur y oeste
                    L.latLng(-5, -50)    // Más al norte y este
                ),
                maxBoundsViscosity: 1.0    // Fuerza de los límites
            }).setView([-16.5, -64.5], 6);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                noWrap: true  // Evita que el mapa se repita
            }).addTo(mapInstanceRef.current);

            // Resto del código de inicialización...
            markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
            heatLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
            reportesLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
        }

        actualizarCapas();
    }, [mapaListo, filtros, datosCalor, reportesIncendio]);

    const handleCheckboxChange = (e) => {
        const {name, checked} = e.target;
        setFiltros((prev) => ({...prev, [name]: checked}));
    };

    const handleChangeRango = async (e) => {
        setRango(e.target.value);
        refetchFocos({range: e.target.value});
        refetchReportes();
    };

    const {
        data: datosFocos,
        loading: cargandoFocos,
        error: errorFocos,
        refetch: refetchFocos
    } = useQuery(OBTENER_FOCOS, {
        variables: {range: rango},
        fetchPolicy: "network-only"
    });
    useEffect(() => {
        if (datosFocos && datosFocos.focosDeCalor) {
            const focos = datosFocos.focosDeCalor;

            setDatosCalor(focos);

            // Calcular confianza y clasificar focos según los rangos
            const total = focos.length;
            const alta = focos.filter(f => {
                const conf = calcularConfianza(f.bright_ti4, f.bright_ti5, f.frp);
                return conf > 80;
            }).length;

            const media = focos.filter(f => {
                const conf = calcularConfianza(f.bright_ti4, f.bright_ti5, f.frp);
                return conf >= 40 && conf <= 80;
            }).length;

            const baja = focos.filter(f => {
                const conf = calcularConfianza(f.bright_ti4, f.bright_ti5, f.frp);
                return conf < 40;
            }).length;

            setEstadisticas(prev => ({
                ...prev,
                focos: total,
                altaConfianza: alta,
                mediaConfianza: media,
                bajaConfianza: baja
            }));

            setUltimaActualizacion(new Date().toLocaleString());
        }
    }, [datosFocos]);


    // Mostrar Reportes rapidos
    const {
        data: dataReportes,
        loading: loadingReportes,
        error: errorReportes,
        refetch: refetchReportes
    } = useQuery(OBTENER_REPORTES, {
        fetchPolicy: "network-only"
    });
    useEffect(() => {
        if (dataReportes && dataReportes.obtenerReportes) {
            const reportes = dataReportes.obtenerReportes.map(reporte => ({
                ...reporte,
                lat: reporte.latitud || -16.5,
                lng: reporte.longitud || -64.5
            }));
            console.log(dataReportes);
            console.log(reportes);
            setReportesIncendio(reportes);

            const totalReportes = reportes.length;
            const reportesAlta = reportes.filter(r => r.gravedad_incendio === "Alto").length;
            const reportesMedia = reportes.filter(r => r.gravedad_incendio === "Mediano").length;
            const reportesBaja = reportes.filter(r => r.gravedad_incendio === "Bajo").length;

            setEstadisticas(prev => ({
                ...prev,
                totalReportes,
                reportesAlta,
                reportesMedia,
                reportesBaja
            }));
        }
    }, [dataReportes]);

    //hasta aqui
    const calcularConfianza = (bright_ti4, bright_ti5, frp) => {
        // Asignar valores máximos para normalizar (puedes ajustar estos valores según tu conjunto de datos)
        const max_bright_ti4 = 350;  // Asumiendo que este es el máximo posible para bright_ti4
        const max_bright_ti5 = 350;  // Lo mismo para bright_ti5
        const max_frp = 10;          // Y para FRP (puedes ajustar según el máximo observado)

        // Normalizamos y calculamos un valor de confianza
        const normalized_bright_ti4 = Math.min(bright_ti4 / max_bright_ti4, 1);  // Aseguramos que no se pase de 1
        const normalized_bright_ti5 = Math.min(bright_ti5 / max_bright_ti5, 1);
        const normalized_frp = Math.min(frp / max_frp, 1);

        // Fórmula de confianza ponderada
        const confianza = (normalized_bright_ti4 * 0.3) + (normalized_bright_ti5 * 0.3) + (normalized_frp * 0.4);

        return (confianza * 100).toFixed(2);  // Lo devolvemos como porcentaje con dos decimales
    };

    // Al hacer clic en "Actualizar datos"
    const recargarDatos = async () => {
        setCargando(true);

        try {
            // Realizamos las solicitudes de recarga de datos
            await Promise.all([
                refetchFocos({ range: rango }),
                refetchReportes()
            ]);
        } catch (error) {
            console.error("Error al recargar datos:", error);
        } finally {
            // Aseguramos que el estado de carga se desactive después de completar
            setTimeout(() => {
                setCargando(false);
            }, 500); // Pequeño retraso para asegurar que la animación sea visible
        }
    };


    const formatearFechaNASA = (acq_date, acq_time) => {
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


    const actualizarCapas = () => {
        if (!mapInstanceRef.current) return;
        const L = window.L;

        // Limpia capas
        markersLayerRef.current.clearLayers();
        heatLayerRef.current.clearLayers();
        reportesLayerRef.current.clearLayers();

        // 1) Si "focosCalor" está activo, dibujamos los focos
        if (filtros.focosCalor && datosCalor.length > 0) {
            for (const p of datosCalor) {
                // Calcular cuántas horas desde detección
                const horasDesde = calcularHorasDesdeDeteccion(p.acq_date, p.acq_time);
                const color = determinarColorPorHoras(horasDesde);

                // Creamos círculo
                const lat = parseFloat(p.latitude);
                const lng = parseFloat(p.longitude);
                const conf = calcularConfianza(p.bright_ti4, p.bright_ti5, p.frp);

                const circulo = L.circle([lat, lng], {
                    color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    radius: 1000,
                }).addTo(heatLayerRef.current);

                // Pop-up con info básica (sin nombre del lugar inicialmente)
                const popupContent = document.createElement('div');
                popupContent.className = 'p-2';
                popupContent.innerHTML = `
                    <h4 class="font-bold">Foco de calor</h4>
                    <p>Detectado: ${formatearFechaNASA(p.acq_date, p.acq_time)}</p>
                    <p>Confianza: ${conf}%</p>
                    <p>Horas transcurridas: ${horasDesde >= 0 ? horasDesde.toFixed(0) : "N/A"}</p>
                    <p>Ubicación: <span class="nombre-lugar">Cargando...</span></p>
                    <p>Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                    ${isAdmin ? `
                        <a
                            href="/Teams?lat=${lat}&lng=${lng}"
                            class="bg-[#e25822] text-white px-2 py-1 text-sm rounded hover:bg-[#d04712] inline-block"
                            style="color: white; text-decoration: none;">
                            Asignar Grupo
                        </a>` : ''}
                `;

                circulo.bindPopup(popupContent);

                // Agregar evento para cargar el nombre del lugar solo cuando se haga click
                circulo.on('click', async () => {
                    const nombreLugar = await obtenerNombreLugar(lat, lng);
                    const nombreElement = popupContent.querySelector('.nombre-lugar');
                    if (nombreElement) {
                        nombreElement.textContent = nombreLugar;
                    }
                });
            }
        }

        // 2) Si "equipos" está activo, mostramos tus equipos
        if (filtros.equipos && datosEquipos.length > 0) {
            datosEquipos.forEach((equipo) => {
                // Determinar color según estado del equipo
                let color;
                switch (equipo.estado) {
                    case 'activo':
                        color = 'bg-blue-600';
                        break;
                    case 'en_camino':
                        color = 'bg-green-600';
                        break;
                    case 'inactivo':
                        color = 'bg-gray-600';
                        break;
                    case 'en_emergencia':
                        color = 'bg-red-600';
                        break;
                    default:
                        color = 'bg-blue-600';
                }

                const icono = L.divIcon({
                    html: `
                <div class="${color} text-black rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  ${equipo.nombre}
                </div>
              `,
                    className: "",
                    iconSize: [24, 24],
                });

                const marcador = L.marker([equipo.lat, equipo.lng], {
                    icon: icono
                }).addTo(markersLayerRef.current);

                // Construir información de miembros
                const miembrosInfo = equipo.miembros?.map(m =>
                    `${m.id_usuario.nombre} ${m.id_usuario.apellido}`
                ).join(', ') || 'Sin miembros';

                marcador.bindPopup(`
                <div class="p-2">
                    <h4 class="font-bold">${equipo.nombre}</h4>
                    <p><strong>Líder:</strong> ${equipo.lider?.nombre || 'No asignado'}</p>
                    <p><strong>Integrantes:</strong> ${miembrosInfo}</p>
                    <p><strong>Estado:</strong> ${equipo.estado?.replace('_', ' ') || 'Desconocido'}</p>
                    <p><strong>Coordenadas:</strong> ${equipo.lat.toFixed(4)}, ${equipo.lng.toFixed(4)}</p>
                </div>
            `);
            });
        }

        // 3) Si "reportesIncendio" está activo, mostramos los reportes de incendios
        if (filtros.reportesIncendio && reportesIncendio.length > 0) {
            reportesIncendio.forEach(reporte => {
                // Extraer latitud y longitud
                const lat = reporte.ubicacion?.coordinates[1] || -16.5; // Latitud
                const lng = reporte.ubicacion?.coordinates[0] || -64.5; // Longitud

                // Asegurarse de que las coordenadas son válidas
                if (!lat || !lng) return; // Si no hay coordenadas, no dibujamos el marcador

                // Determinar color según gravedad
                let color;
                switch (reporte.gravedad_incendio) {
                    case "Alto":
                        color = "#B20000"; // Rojo
                        break;
                    case "Mediano":
                        color = "#ff9900"; // Naranja
                        break;
                    case "Bajo":
                        color = "#ffcc00"; // Amarillo
                        break;
                    default:
                        color = "#B20000"; // Por defecto rojo
                }

                // Crear un icono personalizado para el marcador
                const icono = L.divIcon({
                    html: `<div class="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold" style="background-color: ${color};">R</div>`,
                    className: "",
                    iconSize: [24, 24],
                });

                // Crear el marcador en el mapa
                const marcador = L.marker([lat, lng], { icon: icono })
                    .addTo(reportesLayerRef.current);

                // Agregar pop-up con información del reporte
                marcador.bindPopup(`
                <div class="contenido-popup">
                    <h4 class="font-bold">Reporte de Incendio</h4>
                    <p>Lugar: ${reporte.nombre_lugar || 'No especificado'}</p>
                    <p>Reportado por: ${reporte.nombre_reportante}</p>
                    <p>Fecha: ${formatearFecha(reporte.fecha_hora)}</p>
                    <p>Tipo: ${reporte.tipo_incendio}</p>
                    <p>Gravedad: ${reporte.gravedad_incendio}</p>
                    <p>Comentario: ${reporte.comentario_adicional || 'Ninguno'}</p>
                    ${reporte.cant_bomberos != null ? `<p><strong>Bomberos:</strong> ${reporte.cant_bomberos}</p>` : ''}
                    ${reporte.cant_paramedicos != null ? `<p><strong>Paramédicos:</strong> ${reporte.cant_paramedicos}</p>` : ''}
                    ${reporte.cant_veterinarios != null ? `<p><strong>Veterinarios:</strong> ${reporte.cant_veterinarios}</p>` : ''}
                    ${reporte.cant_autoridades != null ? `<p><strong>Autoridades:</strong> ${reporte.cant_autoridades}</p>` : ''}
                    ${isAdmin ? `
                      <a
                        href="/Teams?lat=${lat}&lng=${lng}"
                        class="bg-[#e25822] text-white px-2 py-1 text-sm rounded hover:bg-[#d04712] inline-block"
                        style="color: white; text-decoration: none;">
                        Asignar Grupo
                      </a>` : ''}
                </div>
            `, {
                    className: `popup-${reporte.gravedad_incendio.toLowerCase()}`
                });
            });
        }
    };


    // Calcula horas entre [acq_date + acq_time] y ahora
    const calcularHorasDesdeDeteccion = (acq_date, acq_time) => {
        if (!acq_date) return -1;

        try {
            const [year, month, day] = acq_date.split('-').map(Number);
            const time = acq_time?.toString().padStart(4, '0') || "0000";
            const hours = parseInt(time.substring(0, 2), 10);
            const minutes = parseInt(time.substring(2, 4), 10);

            // Crear fecha en zona Bolivia manualmente
            const localString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${time.substring(0, 2)}:${time.substring(2)}:00`;
            const detectionDate = new Date(new Date(localString).toLocaleString("en-US", { timeZone: "America/La_Paz" }));
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" }));

            const diffMs = now - detectionDate;
            return diffMs / (1000 * 3600); // horas
        } catch (err) {
            console.error("Error al calcular horas desde detección:", err);
            return -1;
        }
    };



    // Determina color según horas transcurridas (similar a “Time Based” de FIRMS)
    // e.g. <1=rojo, 1-3=anaranjado, 3-6=amarillo, etc.
    const determinarColorPorHoras = (horas) => {
        if (horas < 0) {
            // No se pudo calcular => gris
            return "#999999";
        }
        if (horas < 1) {
            return "#B20000"; // muy reciente => rojo
        } else if (horas < 3) {
            return "#B20000"; // anaranjado fuerte
        } else if (horas < 6) {
            return "#FFA500"; // naranja
        } else if (horas < 12) {
            return "#FFC800"; // amarillo oscuro
        } else if (horas < 24) {
            return "#FFFF00"; // amarillo
        } else {
            return "#000000"; // verde-amarillo si >24h (o cambiar a un color gris si prefieres)
        }
    };

    const LogoIcon = () => (
        <a href={isAuthenticated ? "/Homepage" : "/"}>
            <div className="flex items-center">
                <svg viewBox="0 0 100 100" width="60" height="60" className="mr-3">
                    <circle cx="50" cy="50" r="45" fill="#e25822"/>
                    <path
                        d="M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20"
                        fill="#ffcc00"/>
                    <path d="M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20"
                          fill="#ffcc00"/>
                </svg>
                <span className="text-2xl text-[#e25822] font-bold">
                    Alas Chiquitanas
                </span>
            </div>
        </a>
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#f5f5f5] text-gray-800">
            {/* -------- Leaflet CDN -------- */}
            <Script
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                onLoad={() => setMapaListo(true)}
            />
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />

            {/* ------------------ HEADER ------------------ */}
            <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-50">
                <LogoIcon />

            </header>

            {/* ------------------ MAIN -------------------- */}
            <main className="flex-grow px-4 py-8 md:py-12 max-w-6xl mx-auto w-full">
                {/* ---------- TITLE ---------- */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#e25822]">
                        Mapa de Focos de Calor en Bolivia
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Visualiza los focos de calor detectados por satélites en territorio boliviano.
                    </p>
                </div>

                {/* ---------- CONTROLES ---------- */}
                <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
                        {/* Select de rango */}
                        <label className="flex items-center gap-2">
                            <span className="text-gray-700 font-medium">Rango:</span>
                            <select
                                value={rango}
                                onChange={handleChangeRango}
                                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="today">Hoy</option>
                                <option value="24h">24 Hrs</option>
                                <option value="7d">7 Días</option>
                            </select>
                        </label>

                        {/* Checkbox para Focos de calor */}
                        <label className="relative flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="focosCalor"
                                checked={filtros.focosCalor}
                                onChange={handleCheckboxChange}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e25822]"></div>
                            <span className="ml-2 text-sm font-medium text-gray-700">Focos de calor</span>
                        </label>

                        {/* Checkbox para Equipos */}
                        {isAuthenticated && (
                            <label className="relative flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="equipos"
                                    checked={filtros.equipos}
                                    onChange={handleCheckboxChange}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e25822]"></div>
                                <span className="ml-2 text-sm font-medium text-gray-700">Equipos en camino</span>
                            </label>
                        )}

                        {/* Checkbox para Reportes */}
                        {isAuthenticated && (
                            <label className="relative flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="reportesIncendio"
                                    checked={filtros.reportesIncendio}
                                    onChange={handleCheckboxChange}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e25822]"></div>
                                <span className="ml-2 text-sm font-medium text-gray-700">Reportes de incendios</span>
                            </label>
                        )}

                        {/* Botón de actualización - Alineado correctamente */}
                        <button
                            onClick={recargarDatos}
                            disabled={cargando}
                            className="bg-[#e25822] text-white px-4 py-1.5 rounded-md hover:bg-[#d04712] disabled:bg-gray-400 transition-colors flex items-center gap-2"
                        >
                            {cargando ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Cargando...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Actualizar datos
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* ---------- MENSAJES ---------- */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}
                {!error && !cargando && (!datosCalor || datosCalor.length === 0) && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                        No se detectaron focos de calor activos en el rango seleccionado.
                    </div>
                )}

                {/* ---------- MAPA ---------- */}
                <div
                    className="relative h-[450px] md:h-[500px] rounded-xl overflow-hidden shadow-md border border-gray-300 mb-12">
                    <div ref={mapaRef} className="absolute inset-0">
                        {!mapaListo && (
                            <div className="h-full flex items-center justify-center bg-gray-100">
                                <p className="text-gray-500">Cargando mapa ...</p>
                            </div>
                        )}
                    </div>

                    {/* ---------- MAPA CON LEAFLET ---------- */}
                    <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-lg border border-gray-300 mb-12">
                        {/* fondo animado de carga */}
                        {!mapaListo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 z-10">
                                <svg
                                    className="animate-spin h-8 w-8 text-[#e25822]"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                            </div>
                        )}

                        {/* Contenedor mapa */}
                        <div ref={mapaRef} className="absolute inset-0 z-0" />

                        {/* Leyenda flotante */}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg text-sm z-20 pointer-events-auto">
                            <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-[#e25822]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v6h20V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H6z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M22 11H2v9a2 2 0 002 2h16a2 2 0 002-2v-9z"
                                    />
                                </svg>
                                Nivel de incendio
                            </p>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-yellow-400 animate-pulse" />
                                    Bajo
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
                                    Medio
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
                                    Alto
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-black animate-pulse" />
                                    Incendios Antiguos
                                </div>
                            </div>
                        </div>


                    </div>



                </div>

                {/* ---------- CARDS ---------- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Focos */}
                    <div className="bg-gray-50 p-6 rounded-2xl shadow flex flex-col">
                        <h4 className="text-lg font-semibold mb-1 flex items-center gap-2">
                            🔥 Focos detectados (VIIRS)
                        </h4>
                        <p className="text-3xl font-bold text-[#e25822]">
                            {estadisticas.focos}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                            {rango === "today" ? "Hoy" : rango === "24h" ? "Últimas 24 h" : "Últimos 7 días"}
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1 mt-auto">
                            <li className="flex justify-between">
                                <span>Alta confianza:</span> <span>{estadisticas.altaConfianza}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Media confianza:</span> <span>{estadisticas.mediaConfianza}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Baja confianza:</span> <span>{estadisticas.bajaConfianza}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Áreas */}
                    <div className="bg-gray-50 p-6 rounded-2xl shadow flex flex-col">
                        <h4 className="text-lg font-semibold mb-1 flex items-center gap-2">
                            🗺️ Áreas monitoreadas
                        </h4>
                        <p className="text-3xl font-bold text-orange-500">
                            {estadisticas.areasMonitoreadas}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">Zonas críticas</p>
                        <ul className="text-sm text-gray-700 space-y-1 mt-auto">
                            <li className="flex justify-between">
                                <span>Beni:</span> <span>{estadisticas.beni}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Santa Cruz:</span> <span>{estadisticas.santaCruz}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>La Paz:</span> <span>{estadisticas.laPaz}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Rango temporal */}
                    <div className="bg-gray-50 p-6 rounded-2xl shadow flex flex-col">
                        <h4 className="text-lg font-semibold mb-1 flex items-center gap-2">
                            ⏱️ Rango temporal
                        </h4>
                        <p className="text-3xl font-bold text-[#e25822]">
                            {rango === "today" ? "Hoy" : rango === "24h" ? "24 h" : "7 d"}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">Fuente: NASA&nbsp;FIRMS</p>
                        <ul className="text-sm text-gray-700 space-y-1 mt-auto">
                            <li className="flex justify-between">
                                <span>Satélite:</span> <span>VIIRS&nbsp;NOAA-20</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Últ. actualización:</span> <span>{ultimaActualizacion}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Reportes (solo auth) */}
                    {isAuthenticated && (
                        <div className="bg-gray-50 p-6 rounded-2xl shadow flex flex-col">
                            <h4 className="text-lg font-semibold mb-1 flex items-center gap-2">
                                📝 Reportes de incendios
                            </h4>
                            <p className="text-3xl font-bold text-red-600">
                                {estadisticas.totalReportes}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">Reportes ciudadanos</p>
                            <ul className="text-sm text-gray-700 space-y-1 mt-auto">
                                <li className="flex justify-between">
                                    <span>Alta gravedad:</span>
                                    <span>{estadisticas.reportesAlta}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Media gravedad:</span>
                                    <span>{estadisticas.reportesMedia}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Baja gravedad:</span>
                                    <span>{estadisticas.reportesBaja}</span>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* ---------- FAB NOTAS ---------- */}
                <button
                    onClick={() => setMostrarNotas(true)}
                    className="fixed bottom-6 right-6 z-50 bg-[#e56938] hover:bg-[#c84315] text-white rounded-full p-4 shadow-lg transition"
                    aria-label="Ver notas explicativas"
                >
                    <Image src="/legend.png" alt="Ícono de información" width={24} height={24}/>
                </button>
            </main>

            {/* ---------- MODAL NOTAS ---------- */}
            {mostrarNotas && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            ℹ️ Notas sobre los datos
                        </h3>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm mb-6">
                            <li>Los datos provienen de NASA&nbsp;FIRMS.</li>
                            <li>La detección se realiza mediante satélites y puede haber falsos positivos.</li>
                            <li>Si no aparecen focos de calor, puede significar que no hay incendios detectados.</li>
                        </ul>
                        <div className="text-center">
                            <button
                                onClick={() => setMostrarNotas(false)}
                                className="bg-[#e25822] hover:bg-[#c84315] text-white font-medium px-8 py-2 rounded-lg shadow transition"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MapaDeSeguimiento