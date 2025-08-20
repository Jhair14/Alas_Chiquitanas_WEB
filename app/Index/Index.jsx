"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from "../Components/Footer";
import { useRouter } from "next/navigation";
import { useQuery } from '@apollo/client';
import { OBTENER_NOTICIAS } from '../Endpoints/endpoints_graphql';


const MonitoringIcon = () => (
    <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
        <path fill="#e25822" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path fill="#e25822" d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
        <circle cx="12" cy="12" r="2" fill="#e25822"/>
    </svg>
);

const StatsIcon = () => (
    <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
        <path fill="#e25822" d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
    </svg>
);

const TeamIcon = () => (
    <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
        <path fill="#e25822" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
);

const LogoIcon = () => (
    <a>
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

function Home() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [newsUpdates, setNewsUpdates] = useState([]); // Estado para almacenar las noticias
    const [loading, setLoading] = useState(true); // Estado de carga
    const [usingDefaultNews, setUsingDefaultNews] = useState(false); // Nuevo estado para rastrear la fuente de datos

    // Usamos la consulta de Apollo para obtener las noticias desde la API GraphQL
    const { data, loading: queryLoading, error } = useQuery(OBTENER_NOTICIAS);

    useEffect(() => {
        // Verificar token
        try {
            const token = localStorage.getItem("token");
            if (token) {
                router.push("/"); // Si el token existe, redirige a la página de inicio
            }
        } catch (error) {
            console.error("Error al verificar el token:", error);
        }

        // Si las noticias fueron cargadas, se actualiza el estado
        if (!queryLoading && data) {
            const news = data.noticiasIncendios; // Obtener noticias de la API
            setNewsUpdates(news);

            // Verificar si estamos usando noticias por defecto
            const defaultTitles = ['Incendio en Chiquitania', 'Brigada de Emergencia', 'Actualización de Recursos'];
            const isUsingDefault = news.every(item => defaultTitles.includes(item.title));

            setUsingDefaultNews(isUsingDefault);
            if (isUsingDefault) {
                console.log("⚠️ Usando noticias de respaldo");
            } else {
                console.log("✅ Usando noticias reales de la API");
            }

            setLoading(false);
        }
    }, [data, queryLoading, router]);

    // Datos de respaldo por si falla la carga de noticias
    const fallbackUpdates = [
        { title: 'Incendio en Chiquitania', date: '27 Mar 2025', description: 'Nuevo reporte de incendio activo en la región de San Javier.' },
        { title: 'Brigada de Emergencia', date: '25 Mar 2025', description: 'Equipo de rescate desplegado para combatir el fuego en Santa Cruz.' },
        { title: 'Actualización de Recursos', date: '22 Mar 2025', description: 'Nuevos equipos y vehículos añadidos a la flota de emergencia.' }
    ];

    // Usar datos de respaldo si no hay noticias cargadas
    const updates = newsUpdates.length > 0 ? newsUpdates : fallbackUpdates;

    const navLinks = [
        { href: "/Register", label: "Registrate" },
        { href: "/Login", label: "Inicio Sesión" }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header mejorado con gradiente sutil */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-9xl mx-auto flex items-center justify-between px-4 py-3 md:px-6">
                    <div className="flex items-center space-x-2">
                        <LogoIcon />
                    </div>

                    {/* Botón de menú móvil mejorado */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-[#e25822] hover:bg-orange-50 transition-colors"
                    >
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {open ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>

                    {/* Navegación mejorada con efectos de transición */}
                    <nav className="hidden md:flex space-x-4">
                        {navLinks.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className="px-4 py-2 rounded-md text-gray-700 font-medium hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:text-white transition-all duration-300"
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Menú móvil mejorado */}
                {open && (
                    <div className="md:hidden bg-white shadow-lg rounded-b-lg overflow-hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navLinks.map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:text-white transition-all duration-300"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-grow">
                {/* Hero section mejorado con overlay y animación */}
                <section
                    className="relative bg-cover bg-center text-white py-32 mb-12"
                    style={{
                        backgroundImage: 'url("/hero-background.jpg")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Overlay con gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60 z-0"></div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="text-center max-w-4xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight animate__animated animate__fadeInDown">
                                Sistema de Seguimiento y Colaboración en Incendios
                            </h2>
                            <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto text-gray-100 animate__animated animate__fadeIn animate__delay-1s">
                                Coordinando equipos de auxilio y brigadas de ayuda para zonas afectadas por incendios en Bolivia
                            </p>
                            <div className="flex flex-wrap justify-center gap-5 animate__animated animate__fadeInUp animate__delay-2s">
                                <Link
                                    href="/Maps"
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-1"
                                >
                                    Ver mapa en tiempo real
                                </Link>
                                <Link
                                    href="/Reporte/Invitado"
                                    className="bg-white text-orange-600 border-2 border-orange-500 font-medium py-3 px-8 rounded-lg transition-all duration-300 hover:bg-orange-50 hover:shadow-lg transform hover:-translate-y-1"
                                >
                                    Reporte Rápido
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sección de características con iconos */}
                <section className="container mx-auto px-6 py-12 mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">
                        Nuestras <span className="text-orange-600">Soluciones</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Característica 1 */}
                        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300">
                            <div className="bg-orange-100 p-4 rounded-full mb-4">
                                <MonitoringIcon />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Monitoreo en Tiempo Real</h3>
                            <p className="text-gray-600">Visualización de incendios activos en Bolivia con actualizaciones constantes y datos precisos.</p>
                        </div>

                        {/* Característica 2 */}
                        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300">
                            <div className="bg-orange-100 p-4 rounded-full mb-4">
                                <StatsIcon />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Análisis Estadístico</h3>
                            <p className="text-gray-600">Datos históricos y predicciones para mejorar la respuesta ante emergencias por incendios.</p>
                        </div>

                        {/* Característica 3 */}
                        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300">
                            <div className="bg-orange-100 p-4 rounded-full mb-4">
                                <TeamIcon />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Coordinación de Equipos</h3>
                            <p className="text-gray-600">Gestión eficiente de brigadas y recursos para responder rápidamente a zonas afectadas.</p>
                        </div>
                    </div>
                </section>

                {/* Noticias de incendios mejoradas */}
                <section className="container mx-auto px-6 py-12 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">
                            Últimas <span className="text-orange-600">Noticias</span>
                        </h2>

                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="relative w-20 h-20">
                                <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-200 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {updates.map((update, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg"
                                >
                                    {update.image && (
                                        <div className="relative h-48 w-full">
                                            <img
                                                src={update.image}
                                                alt={update.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {update.date}
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">{update.title}</h3>
                                        <p className="text-gray-600 mb-4">{update.description}</p>
                                        {update.url && update.url !== '#' && (
                                            <a
                                                href={update.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-orange-600 hover:text-orange-700 font-medium inline-flex items-center"
                                            >
                                                Leer más
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Banner CTA */}
                <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-16 mt-12">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">¿Quieres ser parte de nuestro esfuerzo?</h2>
                        <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                            Únete a la comunidad de voluntarios y profesionales comprometidos con la protección del medio ambiente y la prevención de incendios.
                        </p>
                        <Link
                            href="/Register"
                            className="bg-white text-orange-600 font-medium py-3 px-8 rounded-lg transition-all duration-300 hover:bg-orange-50 hover:shadow-lg inline-block"
                        >
                            Regístrate Ahora
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default Home;



