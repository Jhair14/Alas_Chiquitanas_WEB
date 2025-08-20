"use client";
import Footer from "../../Components/Footer";
import Script from "next/script";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from '@apollo/client';
import { OBTENER_REPORTES, OBTENER_USUARIO, OBTENER_FOCOS } from '../../Endpoints/endpoints_graphql';
import {FaMapMarkedAlt, FaClipboardList, FaUsers, FaChartBar } from "react-icons/fa";
import { OBTENER_EQUIPOS } from '../../Endpoints/endpoints_graphql';


const LogoIcon = () => (
    <a href={"/Homepage"}>
        <div className="flex items-center">
            <svg viewBox="0 0 100 100" width="60" height="60" className="mr-3">
                <circle cx="50" cy="50" r="45" fill="#e25822" />
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

function DashboardIncendios() {


    const [mostrarNotas, setMostrarNotas] = useState(true);

    // Mantengo tus estados
    const [filtros, setFiltros] = useState({
        focosCalor: true,
        equipos: false,
        reportesIncendio: false
    });
    const [mapaListo, setMapaListo] = useState(false);

    // Aquí se guardan todos los focos obtenidos de NASA
    const [datosCalor, setDatosCalor] = useState([]);
    const [datosEquipos, setDatosEquipos] = useState([
        { id: 1, nombre: "Equipo Alpha", lat: -17.7833, lng: -63.1823, personal: 5 },
        { id: 2, nombre: "Equipo Beta", lat: -17.8133, lng: -63.1523, personal: 3 },
        { id: 3, nombre: "Equipo Gamma", lat: -17.7633, lng: -63.2123, personal: 4 },
    ]);
    useEffect(() => {
        // Solo en cliente
        if (typeof window !== "undefined") {
            setToken(localStorage.getItem("token"));
        }
    }, []);
    const { data: userData, loading: userLoading } = useQuery(OBTENER_USUARIO, {
        variables: { token },
        skip: !token,
    });

    const [reportesIncendio, setReportesIncendio] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null); // Reporte seleccionado para asignar grupo

    // Estadísticas de ejemplo
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
        brigadasActivas: 0,
        tRespuesta: 0,
        atendidos: 0
    });
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
    const authContext = useMemo(() => (
        token ? { headers: { authorization: `Bearer ${token}` } } : undefined
    ), [token]);
    // Obtener equipos desde la API
    const {data: teamsData, loading: teamsLoading, error: teamsError} = useQuery(OBTENER_EQUIPOS, {
        context: authContext,
        fetchPolicy: 'network-only',
        skip: !token,
        onError: (error) => {
            if (error.graphQLErrors.some(e => e.message === 'No autorizado')) {
                window.location.href = '/Login';
            }
        }
    });

    useEffect(() => {
        if (teamsData && teamsData.obtenerEquipos) {
            const equiposTransformados = teamsData.obtenerEquipos.map(equipo => ({
                id: equipo.id,
                nombre: equipo.nombre_equipo,
                lat: equipo.ubicacion?.coordinates[1] || -17.7833,
                lng: equipo.ubicacion?.coordinates[0] || -63.1823,
                personal: equipo.cantidad_integrantes,
                lider: equipo.id_lider_equipo,
                miembros: equipo.miembros,
                estado: equipo.estado,
                reporteAsignado: equipo.reporteAsignado // <-- Asegúrate de incluir esto

            }));
            setDatosEquipos(equiposTransformados);
            const brigadasActivas = teamsData.obtenerEquipos.filter(e => e.estado === 'activo').length;
            setEstadisticas(prev => ({
                ...prev,
                brigadasActivas,
                tRespuesta: brigadasActivas > 0 ? Math.floor(Math.random() * 30) + 15 : 0
            }));
        }
    }, [teamsData]);


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

            // Configuración del mapa con límites (igual que en el primer código)
            mapInstanceRef.current = L.map(mapaRef.current, {
                center: [-16.5, -64.5],  // Centro en Bolivia
                zoom: 6,
                maxZoom: 12,    // Máximo nivel de zoom (acercamiento)
                minZoom: 5,     // Mínimo nivel de zoom (alejamiento)
                maxBounds: L.latLngBounds(  // Límites geográficos
                    L.latLng(-30, -80),  // Más al sur y oeste
                    L.latLng(-5, -50)    // Más al norte y este
                ),
                maxBoundsViscosity: 1.0    // Fuerza de los límites (1.0 es estricto)
            });

            // Configuración del TileLayer
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                noWrap: true  // Evita que el mapa se repita
            }).addTo(mapInstanceRef.current);

            // Inicializar capas
            markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
            heatLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
            reportesLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

            // Evento para asegurar que el mapa se mantenga dentro de los límites
            mapInstanceRef.current.on('drag', function() {
                mapInstanceRef.current.panInsideBounds(
                    L.latLngBounds(L.latLng(-30, -80), L.latLng(-5, -50)),
                    { animate: false }
                );
            });
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
            const [year, month, day] = acq_date.split('-');

            // Siempre aseguramos que `acq_time` tenga 4 dígitos (ej: "0451")
            const time = acq_time?.toString().padStart(4, '0');
            const hours = time.slice(0, 2);
            const minutes = time.slice(2);

            // Validar hora y minuto
            const hNum = parseInt(hours, 10);
            const mNum = parseInt(minutes, 10);

            const horaValida =
                !isNaN(hNum) && !isNaN(mNum) &&
                hNum >= 0 && hNum <= 23 &&
                mNum >= 0 && mNum <= 59;

            const horaFormateada = horaValida ? `${hours}:${minutes}` : '00:00';

            return `${day}/${month}/${year}, ${horaFormateada}`;
        } catch (err) {
            console.error("Error al formatear fecha NASA:", err);
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

                // Dentro de actualizarCapas(), modifica la creación de marcadores de reportes:
                const marcador = L.marker([equipo.lat, equipo.lng], { icon: icono })
                    .addTo(markersLayerRef.current)  // <-- Cambia a markersLayerRef en lugar de reportesLayerRef
                    .on('click', () => {
                        // Aquí puedes manejar el click en un equipo si lo necesitas
                        console.log("Equipo clickeado:", equipo);
                    });
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
                        color = "#ff0000"; // Rojo
                        break;
                    case "Mediano":
                        color = "#ff9900"; // Naranja
                        break;
                    case "Bajo":
                        color = "#ffcc00"; // Amarillo
                        break;
                    default:
                        color = "#ff0000"; // Por defecto rojo
                }

                // Crear un icono personalizado para el marcador
                const icono = L.divIcon({
                    html: `<div class="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold" style="background-color: ${color};">R</div>`,
                    className: "",
                    iconSize: [24, 24],
                });

                // Crear el marcador en el mapa
                const marcador = L.marker([lat, lng], { icon: icono })
                    .addTo(reportesLayerRef.current)
                    .on('click', () => {
                        setSelectedReport(reporte);

                        // Buscar equipo asignado a este reporte
                        const equipoAsignado = datosEquipos.find(equipo =>
                            equipo.reporteAsignado === reporte.id
                        );

                        console.log("Reporte seleccionado:", reporte);
                        console.log("Equipo asignado:", equipoAsignado);
                    });

                // Agregar pop-up con información del reporte
                marcador.bindPopup(`
                  <div class="contenido-popup">
                    <h4 class="font-bold">Reporte de Incendio</h4>
                    <p><strong>Lugar:</strong> ${reporte.nombre_lugar || 'No especificado'}</p>
                    <p><strong>Reportado por:</strong> ${reporte.nombre_reportante}</p>
                    <p><strong>Teléfono:</strong> ${reporte.telefono_contacto || 'No especificado'}</p>
                    <p><strong>Fecha:</strong> ${formatearFecha(reporte.fecha_hora)}</p>
                    <p><strong>Tipo:</strong> ${reporte.tipo_incendio}</p>
                    <p><strong>Gravedad:</strong> ${reporte.gravedad_incendio}</p>
                    ${reporte.cant_bomberos != null ? `<p><strong>Bomberos:</strong> ${reporte.cant_bomberos}</p>` : ''}
                    ${reporte.cant_paramedicos != null ? `<p><strong>Paramédicos:</strong> ${reporte.cant_paramedicos}</p>` : ''}
                    ${reporte.cant_veterinarios != null ? `<p><strong>Veterinarios:</strong> ${reporte.cant_veterinarios}</p>` : ''}
                    ${reporte.cant_autoridades != null ? `<p><strong>Autoridades:</strong> ${reporte.cant_autoridades}</p>` : ''}
                    <p><strong>Comentario:</strong> ${reporte.comentario_adicional || 'Ninguno'}</p>
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
            return "#FF0000"; // muy reciente => rojo
        } else if (horas < 3) {
            return "#FF4500"; // anaranjado fuerte
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


    /* estado mock para KPIs (luego lo conectas a tu backend/GraphQL) */
    const [stats, setStats] = useState({
        focos: 0,
        alta: 0,
        media: 0,
        baja: 0,
        brigadasActivas: 0,
        tRespuesta: 0,
        reportes: 0,
    });

    /* ejemplo de carga de datos: */
    useEffect(() => {
        // TODO: reemplázalo con fetch/GraphQL real
        setStats({
            focos: 257,
            alta: 63,
            media: 119,
            baja: 75,
            brigadasActivas: 14,
            tRespuesta: 42,      // minutos
            reportes: 32,
            atendidos: 212
        });
    }, [rango]);

    // New state for selected report and assigned team
    const [selectedReportTeam, setSelectedReportTeam] = useState(null);

    const PanelBrigadas = () => {
        if (!selectedReport) {
            return (
                <div className="h-full flex items-center justify-center text-gray-500">
                    <p className="text-center px-4">
                        Selecciona un reporte de incendio para visualizar a los miembros asignados a su respectivo reporte.
                    </p>
                </div>
            );
        }

        // Buscar equipo asignado a este reporte
        const equipoAsignado = datosEquipos.find(equipo =>
            equipo.reporteAsignado === selectedReport.id
        );

        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4 text-[#e25822]">Detalles del Reporte</h2>
                <div className="mb-4 bg-gray-100 p-3 rounded">
                    <p><strong>Lugar:</strong> {selectedReport.nombre_lugar || 'No especificado'}</p>
                    <p><strong>Gravedad:</strong> {selectedReport.gravedad_incendio}</p>
                    <p><strong>Reportado por:</strong> {selectedReport.nombre_reportante}</p>
                    <p><strong>Teléfono:</strong> {selectedReport.telefono_contacto || 'No especificado'}</p>
                    <p><strong>Fecha:</strong> {formatearFecha(selectedReport.fecha_hora)}</p>
                    <p><strong>Comentarios:</strong> {selectedReport.comentario_adicional || 'Ninguno'}</p>
                </div>
            </div>
        );
    };



    /* últimos reportes mock */
    const UltimosReportes = () => {
        const reportes = [
            { lugar: "Concepción", gravedad: "Alto", hora: "14:22" },
            { lugar: "San Ignacio", gravedad: "Medio", hora: "13:55" },
            { lugar: "La Guardia", gravedad: "Bajo", hora: "12:40" },
        ];
        const color = { Alto: "text-red-600", Medio: "text-orange-500", Bajo: "text-yellow-500" };

        return (
            <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Últimos reportes</h3>
                <ul className="space-y-3 text-sm">
                    {reportes.map((r, i) => (
                        <li key={i} className="flex justify-between">
                            <span>{r.lugar}</span>
                            <span className={`${color[r.gravedad]} font-semibold`}>{r.gravedad}</span>
                            <span className="text-gray-500">{r.hora}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
            {/* ═══ HEADER ═══ */}
            <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-50">
                <LogoIcon />
                <div className="flex items-center gap-4">

                </div>
            </header>

            {/* ══════════ KPI CARDS ══════════ */}
            <section className="max-w-7xl w-full mx-auto px-4 mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Focos */}
                <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-6 shadow flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#e25822] text-white flex items-center justify-center mb-4">
                        <FaMapMarkedAlt size={24} />
                    </div>
                    <h3 className="text-sm font-semibold mb-2">Focos detectados</h3>
                    <p className="text-3xl font-extrabold text-[#e25822] leading-none">
                        {estadisticas.focos}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        {rango === "today" ? "Hoy" : rango}
                    </p>
                </div>

                {/* Reportes atendidos */}
                <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-6 shadow flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#e25822] text-white flex items-center justify-center mb-4">
                        <FaClipboardList size={24} />
                    </div>
                    <h3 className="text-sm font-semibold mb-2">Reportes atendidos</h3>
                    <p className="text-3xl font-extrabold text-[#e25822] leading-none">
                        {estadisticas.atendidos}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        {rango === "today" ? "Hoy" : rango}
                    </p>
                </div>

                {/* Brigadas activas */}
                <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-6 shadow flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#e25822] text-white flex items-center justify-center mb-4">
                        <FaUsers size={24} />
                    </div>
                    <h3 className="text-sm font-semibold mb-2">Brigadas activas</h3>
                    <p className="text-3xl font-extrabold text-[#e25822] leading-none">
                        {estadisticas.brigadasActivas}
                    </p>
                </div>

                {/* Tiempo de respuesta */}
                <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-6 shadow flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#e25822] text-white flex items-center justify-center mb-4">
                        <FaChartBar size={24} />
                    </div>
                    <h3 className="text-sm font-semibold mb-2">Tiempo de respuesta</h3>
                    <p className="text-3xl font-extrabold text-[#e25822] leading-none">
                        {estadisticas.tRespuesta}
                        <span className="text-base font-medium"> min</span>
                    </p>
                </div>
            </section>


            {/* ═══ PANEL PRINCIPAL (brigadas + mapa) ═══ */}
            <section className="max-w-7xl w-full mx-auto px-4 mt-10 lg:flex gap-6">
                <div className="flex-1 bg-white rounded-2xl shadow-md p-6 min-h-[500px] mb-5">
                    <PanelBrigadas />
                </div>
                <div className="flex-[1.5]">
                    <div className="flex flex-col min-h-screen bg-[#f5f5f5] text-gray-800">
                        {/* Cargar Leaflet desde CDN */}
                        <Script
                            src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                            onLoad={() => setMapaListo(true)}
                        />
                        <link
                            rel="stylesheet"
                            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                        />





                        <main className="flex-grow p-6 max-w-6xl mx-auto w-full">
                            <h2 className="text-3xl font-bold text-[#e25822] mb-2 text-center">
                                Mapa de Focos de Calor en Bolivia
                            </h2>
                            <p className="text-center text-gray-600 mb-6">
                                Visualiza los focos de calor detectados por satélites en territorio boliviano.
                            </p>

                            {/* Filtros: Time Range, Focos/Equipos, Botón */}
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


                            {/* Mensajes de estado */}
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                    <p>{error}</p>
                                </div>
                            )}

                            {(!datosCalor || datosCalor.length === 0) && !error && !cargando && (
                                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                                    <p>No se detectaron focos de calor activos en Bolivia para el rango seleccionado.</p>
                                </div>
                            )}

                            {/* Mapa con Leaflet */}
                            <div className="relative h-[500px] rounded-lg overflow-hidden shadow border border-gray-300 mb-0">
                                {/* Aquí SOLO el mapa */}
                                <div
                                    ref={mapaRef}
                                    className="absolute inset-0 z-0"
                                >
                                    {!mapaListo && (
                                        <div className="h-full flex items-center justify-center bg-gray-100">
                                            <p className="text-gray-500">Cargando mapa...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Leyenda */}
                                <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-lg p-3 shadow-md text-xs z-10 pointer-events-none">
                                    <p className="font-bold text-gray-800 mb-2">Nivel de Incendio</p>
                                    <div className="flex flex-col gap-1 text-left">
                                        <span className="text-yellow-500 flex items-center gap-1">🟡 Bajo</span>
                                        <span className="text-orange-500 flex items-center gap-1">🟠 Medio</span>
                                        <span className="text-red-500 flex items-center gap-1">🔴 Alto</span>
                                        <span className="flex items-center gap-1">⚫ Incendios Antiguos</span>
                                    </div>
                                </div>
                            </div>



                            {/* Tarjetas informativas (mantengo tu diseño) */}
                            {/* ---------- CARDS ---------- */}

                            <button
                                onClick={() => setMostrarNotas(true)}
                                className="fixed bottom-6 right-6 z-50 bg-[#e56938] text-white rounded-full p-4 shadow-lg hover:bg-[#c84315] transition-all"
                                aria-label="Ver notas explicativas"
                            >
                                <Image
                                    src="/legend.png" // ← sin 'public/'
                                    alt="Ícono de información"
                                    width={20}
                                    height={20}
                                />

                            </button>
                        </main>
                        {mostrarNotas && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                                <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg text-sm text-gray-800 relative">

                                    <h3 className="text-lg font-bold mb-3">ℹ️ Notas sobre los datos</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-gray-700">
                                        <li>Los datos provienen de NASA FIRMS (Fire Information for Resource Management System).</li>
                                        <li>La detección se realiza mediante satélites y puede haber falsos positivos.</li>
                                        <li>Si no aparecen focos de calor en el mapa, puede significar que actualmente no hay incendios detectados en Bolivia.</li>
                                    </ul>
                                    <div className="text-center">
                                        <button
                                            onClick={() => setMostrarNotas(false)}
                                            className="bg-[#e25822] text-white px-6 py-2 rounded-md hover:bg-[#c84315] transition-all"
                                        >
                                            Entendido
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </section>
            {/* ═══ SECCIÓN DE ESTADÍSTICAS NIVELADA ═══ */}
            <section className="max-w-7xl w-full mx-auto px-4 mt-6 mb-6">
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
                </div>
            </section>



            <Footer />
        </div>
    );
}


export default DashboardIncendios
