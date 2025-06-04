"use client";
import React, { useEffect, useState } from "react";
import Footer from '../Components/Footer';
import { FaFireAlt, FaMapMarkedAlt, FaClock, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import { useQuery } from '@apollo/client';
import { OBTENER_FOCOS, OBTENER_REPORTES } from '../Endpoints/endpoints_graphql';


const determinarDepartamento = (lat, lng) => {
    // Coordenadas precisas que cubren todo el territorio boliviano
    const departamentos = [
        { nombre: "Pando", minLat: -11.5, maxLat: -9.5, minLng: -70, maxLng: -65 },
        { nombre: "Beni", minLat: -15, maxLat: -9.5, minLng: -68, maxLng: -63 },
        { nombre: "SantaCruz", minLat: -22, maxLat: -14, minLng: -65, maxLng: -57 },
        { nombre: "LaPaz", minLat: -17, maxLat: -13, minLng: -72, maxLng: -65 },
        { nombre: "Cochabamba", minLat: -19, maxLat: -15.5, minLng: -67, maxLng: -63 },
        { nombre: "Oruro", minLat: -19.5, maxLat: -17, minLng: -68.5, maxLng: -66 },
        { nombre: "Potosi", minLat: -22.5, maxLat: -18.5, minLng: -68, maxLng: -64.5 },
        { nombre: "Chuquisaca", minLat: -21.5, maxLat: -18.5, minLng: -65.5, maxLng: -62 },
        { nombre: "Tarija", minLat: -22.5, maxLat: -20.5, minLng: -65, maxLng: -62.5 }
    ];

    const dentroDeBolivia = (
        lat >= -22.9 && lat <= -9.5 &&
        lng >= -72 && lng <= -57
    );

    if (!dentroDeBolivia) {
        console.warn(`Punto fuera de Bolivia: Lat ${lat}, Lng ${lng}`);
        return "SantaCruz";
    }

    // Buscar departamento
    for (const depto of departamentos) {
        if (
            lat >= depto.minLat &&
            lat <= depto.maxLat &&
            lng >= depto.minLng &&
            lng <= depto.maxLng
        ) {
            return depto.nombre;
        }
    }

    // Si no se encontró pero está dentro de Bolivia, asignar a Santa Cruz (mayor territorio)
    console.warn(`Punto no clasificado dentro de Bolivia: Lat ${lat}, Lng ${lng}`);
    return "SantaCruz";
};

function DatosEstadisticos() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState("No disponible");

    // Consultas GraphQL
    const { data: dataFocos, loading: loadingFocos, error: errorFocos, refetch: refetchFocos } = useQuery(OBTENER_FOCOS, {
        variables: { range: "today" },
        fetchPolicy: "network-only"
    });

    const { data: dataReportes, loading: loadingReportes, error: errorReportes, refetch: refetchReportes } = useQuery(OBTENER_REPORTES, {
        fetchPolicy: "network-only"
    });

    // Estado inicial sin "Desconocido"
    const [estadisticas, setEstadisticas] = useState({
        focos: 0,
        totalReportes: 0,
        reportesAlta: 0,
        reportesMedia: 0,
        reportesBaja: 0,
        departamentos: {
            Pando: 0,
            Beni: 0,
            SantaCruz: 0,
            LaPaz: 0,
            Cochabamba: 0,
            Oruro: 0,
            Potosi: 0,
            Chuquisaca: 0,
            Tarija: 0
        }
    });

    // Estado para animación
    const [counts, setCounts] = useState({
        focos: 0,
        totalReportes: 0,
        reportesAlta: 0,
        reportesMedia: 0,
        reportesBaja: 0,
        departamentos: {
            Pando: 0,
            Beni: 0,
            SantaCruz: 0,
            LaPaz: 0,
            Cochabamba: 0,
            Oruro: 0,
            Potosi: 0,
            Chuquisaca: 0,
            Tarija: 0
        }
    });

    // Procesar datos de la API
    useEffect(() => {
        if (dataFocos || dataReportes) {
            const nuevosDepartamentos = {
                Pando: 0,
                Beni: 0,
                SantaCruz: 0,
                LaPaz: 0,
                Cochabamba: 0,
                Oruro: 0,
                Potosi: 0,
                Chuquisaca: 0,
                Tarija: 0
            };

            let nuevosFocos = 0;

            if (dataFocos?.focosDeCalor) {
                nuevosFocos = dataFocos.focosDeCalor.length || 0;

                dataFocos.focosDeCalor.forEach(foco => {
                    const lat = parseFloat(foco.latitude);
                    const lng = parseFloat(foco.longitude);
                    const depto = determinarDepartamento(lat, lng);

                    if (nuevosDepartamentos.hasOwnProperty(depto)) {
                        nuevosDepartamentos[depto]++;
                    } else {
                        // Esto no debería ocurrir, pero si pasa, lo asignamos a Santa Cruz
                        nuevosDepartamentos.SantaCruz++;
                        console.warn(`Punto asignado a SantaCruz por fallo: Lat ${lat}, Lng ${lng}`);
                    }
                });
            }

            // Procesar reportes
            let totalReportes = 0;
            let reportesAlta = 0;
            let reportesMedia = 0;
            let reportesBaja = 0;

            if (dataReportes?.obtenerReportes) {
                totalReportes = dataReportes.obtenerReportes.length || 0;
                dataReportes.obtenerReportes.forEach(reporte => {
                    switch(reporte.gravedad_incendio) {
                        case "Alto": reportesAlta++; break;
                        case "Mediano": reportesMedia++; break;
                        case "Bajo": reportesBaja++; break;
                    }
                });
            }

            setEstadisticas({
                focos: nuevosFocos,
                totalReportes,
                reportesAlta,
                reportesMedia,
                reportesBaja,
                departamentos: nuevosDepartamentos
            });

            setUltimaActualizacion(new Date().toLocaleString('es-BO', {
                timeZone: 'America/La_Paz',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }));
        }
    }, [dataFocos, dataReportes]);

    // Animación de números
    useEffect(() => {
        const duration = 1500;
        const frameRate = 60;
        const totalFrames = duration / (1000 / frameRate);

        const targets = {
            focos: estadisticas.focos,
            totalReportes: estadisticas.totalReportes,
            reportesAlta: estadisticas.reportesAlta,
            reportesMedia: estadisticas.reportesMedia,
            reportesBaja: estadisticas.reportesBaja,
            departamentos: {...estadisticas.departamentos}
        };

        let frame = 0;
        const interval = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;

            if (frame === totalFrames) {
                setCounts(targets);
                clearInterval(interval);
                return;
            }

            const easeOutProgress = 1 - Math.pow(1 - progress, 3);

            const newCounts = {
                focos: Math.round(easeOutProgress * targets.focos),
                totalReportes: Math.round(easeOutProgress * targets.totalReportes),
                reportesAlta: Math.round(easeOutProgress * targets.reportesAlta),
                reportesMedia: Math.round(easeOutProgress * targets.reportesMedia),
                reportesBaja: Math.round(easeOutProgress * targets.reportesBaja),
                departamentos: {}
            };

            for (const depto in targets.departamentos) {
                newCounts.departamentos[depto] = Math.round(easeOutProgress * targets.departamentos[depto]);
            }

            setCounts(newCounts);
        }, 1000 / frameRate);

        return () => clearInterval(interval);
    }, [estadisticas]);

    const recargarDatos = () => {
        refetchFocos();
        refetchReportes();
    };

    const LogoIcon = () => (
        <a href={isAuthenticated ? "/Homepage" : "/"}>
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

    // Calcular el total de focos por departamento para los porcentajes
    const totalFocosDepartamentos = Object.values(counts.departamentos).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white shadow p-4 flex items-center justify-between">
                <LogoIcon />
                <button
                    onClick={recargarDatos}
                    className="bg-[#e25822] hover:bg-[#d04712] text-white py-2 px-4 rounded-full transition-colors duration-300"
                >
                    Actualizar Datos
                </button>
            </header>

            <div className="relative py-16 mb-8">
                <div
                    className="absolute inset-0 z-0 opacity-30"
                    style={{
                        backgroundImage: 'url("/images/forest-fire-background.jpg")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="relative z-10 container mx-auto px-6 text-center">
                    <h1 className="text-4xl font-bold text-[#e25822] mb-4">Estadísticas de Incendios</h1>
                    <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                        Panel de monitoreo e información estadística sobre focos de incendio y reportes activos
                    </p>
                </div>
            </div>

            <main className="flex-grow container mx-auto px-6 py-6 mb-8">
                <section className="bg-white rounded-xl p-8 shadow-md mb-10 border-t-4 border-[#e25822]">
                    <h2 className="text-2xl text-[#e25822] mb-8 text-center font-bold flex items-center justify-center">
                        <FaFireAlt className="mr-3" />
                        Resumen Actual de Incendios
                    </h2>

                    {(loadingFocos || loadingReportes) && (
                        <div className="text-center py-4">
                            <p className="text-orange-500">Cargando datos más recientes...</p>
                        </div>
                    )}

                    {errorFocos && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            Error al cargar datos de focos de calor: {errorFocos.message}
                        </div>
                    )}
                    {errorReportes && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            Error al cargar reportes: {errorReportes.message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-orange-200">
                            <div className="flex flex-col items-center text-center h-full justify-center">
                                <div className="bg-orange-500 text-white p-3 rounded-full mb-4">
                                    <FaClock className="text-2xl" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Última Actualización</h3>
                                <p className="text-lg font-bold text-[#e25822]">{ultimaActualizacion}</p>
                                <div className="mt-2 flex items-center px-3 py-1 bg-orange-100 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                                    <p className="text-xs text-gray-600">Fuente: NASA FIRMS</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:row-span-2 bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-orange-200">
                            <div className="flex flex-col items-center text-center h-full">
                                <div className="bg-orange-500 text-white p-3 rounded-full mb-4">
                                    <FaMapMarkedAlt className="text-2xl" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Distribución por Departamentos</h3>
                                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(counts.departamentos)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([depto, cantidad]) => (
                                            <div key={depto} className="bg-white p-3 rounded-lg shadow-sm">
                                                <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-700 font-medium capitalize">
                            {depto.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase())}
                          </span>
                                                    <span className="font-bold text-[#e25822]">{cantidad}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-orange-500 h-2 rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, (cantidad / (totalFocosDepartamentos + 0.0001)) * 100)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-orange-200">
                            <div className="flex flex-col items-center text-center h-full justify-center">
                                <div className="bg-orange-500 text-white p-3 rounded-full mb-4">
                                    <FaFireAlt className="text-2xl" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Focos Activos</h3>
                                <p className="text-5xl font-bold text-[#e25822]">
                                    {counts.focos}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">Detectados vía satélite</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-orange-200">
                            <div className="flex flex-col items-center text-center h-full justify-center">
                                <div className="bg-orange-500 text-white p-3 rounded-full mb-4">
                                    <FaUsers className="text-2xl" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Reportes Ciudadanos</h3>
                                <p className="text-4xl font-bold text-[#e25822]">{counts.totalReportes}</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-orange-200">
                            <div className="flex flex-col items-center text-center h-full justify-center">
                                <div className="bg-orange-500 text-white p-3 rounded-full mb-4">
                                    <FaExclamationTriangle className="text-2xl" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Gravedad Reportada</h3>
                                <div className="w-full">
                                    <div className="mb-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-red-600 font-medium">Alta</span>
                                            <span className="font-semibold text-gray-800">{counts.reportesAlta}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-red-500 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, (counts.reportesAlta / (counts.totalReportes + 0.0001)) * 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-yellow-600 font-medium">Media</span>
                                            <span className="font-semibold text-gray-800">{counts.reportesMedia}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-yellow-500 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, (counts.reportesMedia / (counts.totalReportes + 0.0001)) * 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-green-600 font-medium">Baja</span>
                                            <span className="font-semibold text-gray-800">{counts.reportesBaja}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, (counts.reportesBaja / (counts.totalReportes + 0.0001)) * 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 shadow-md text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-6 md:mb-0 md:w-2/3">
                            <h2 className="text-2xl font-bold mb-3">¿Quieres colaborar?</h2>
                            <p className="mb-2">
                                Mantén actualizados los datos enviando reportes desde el terreno o colaborando
                                con nuestro equipo de monitoreo.
                            </p>
                        </div>
                        <div className="flex space-x-4">
                            <a href="/Reporte/Invitado" className="bg-white text-orange-600 py-2 px-6 rounded-full font-medium hover:bg-orange-100 transition-colors duration-300">
                                Enviar reporte
                            </a>
                            <a href="/Homepage" className="bg-transparent border-2 border-white text-white py-2 px-6 rounded-full font-medium hover:bg-white/10 transition-colors duration-300">
                                Volver al panel
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default DatosEstadisticos;