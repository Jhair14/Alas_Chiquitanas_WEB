"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HomeHeader from '../Homepage/HomeHeader';
import Footer from '../Components/Footer';
import { FaChartBar, FaUsers, FaMapMarkedAlt, FaClipboardList,FaAppleAlt, FaFirstAid,FaEllipsisH } from 'react-icons/fa';
import { useQuery } from '@apollo/client';
import { OBTENER_USUARIO } from '../Endpoints/endpoints_graphql';
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
    const router = useRouter();
    const [token, setToken] = useState(null);
    const [abierto, setAbierto] = useState(false);

    // Obtener token del localStorage una vez montado
    useEffect(() => {
        const tokenLocal = localStorage.getItem('token');
        if (!tokenLocal) {
            router.push('/Login');
        } else {
            setToken(tokenLocal);
        }
    }, [router]);

    // Ejecutar la query solo cuando tengamos el token
    const { data, loading, error } = useQuery(OBTENER_USUARIO, {
        variables: { token },
        skip: !token // Evita ejecutar la query si aún no hay token
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-600">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <p className="text-xl text-orange-600 font-medium">Cargando...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-600">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <p className="text-xl text-red-600 font-medium">Error: {error.message}</p>
            </div>
        </div>
    );

    const isAdmin = data?.obtenerUsuario?.rol === 'admin';
    const teamsRoute = isAdmin ? "/Teams" : "/Teams/Usuario";
    const datosEstadisticosRoute = isAdmin ? "/Estadisticas/Admin" : "/Estadisticas";

    return (
        <div className="flex flex-col min-h-screen">
            <HomeHeader />

            {/* Hero section con overlay para mejorar legibilidad */}
            <div className="relative py-12 bg-orange-600">
                <div
                    className="absolute inset-0 z-0 opacity-20"
                    style={{
                        backgroundImage: 'url("/images/forest-fire-background.jpg")', // Recomiendo usar una imagen local
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="relative z-10 container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Panel de Usuario</h2>
                    <p className="text-xl text-white font-light">
                        Bienvenido, <span className="font-semibold">{data?.obtenerUsuario?.nombre}</span>
                    </p>
                </div>
            </div>

            {/* Contenido principal */}
            <main className="flex-grow bg-gray-50 py-16 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Card 1 - Datos Estadísticos con hover ultra profesional */}
                        <a
                            href={datosEstadisticosRoute}
                            className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-700 overflow-hidden transform hover:-translate-y-3 hover:scale-[1.02] cursor-pointer"
                        >
                            {/* Efecto de brillo diagonal que se mueve */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out"></div>

                            {/* Borde animado */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-0.5">
                                <div className="bg-white rounded-xl h-full w-full"></div>
                            </div>

                            {/* Contenido principal */}
                            <div className="relative z-10">
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 group-hover:from-orange-600 group-hover:to-red-500 p-4 flex items-center transition-all duration-500 rounded-t-xl relative overflow-hidden">
                                    {/* Partículas flotantes */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                                        <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                        <div className="absolute top-6 right-8 w-1 h-1 bg-white/70 rounded-full animate-pulse delay-300"></div>
                                        <div className="absolute bottom-3 left-12 w-1 h-1 bg-white/50 rounded-full animate-pulse delay-700"></div>
                                    </div>

                                    <div className="bg-white/20 group-hover:bg-white/30 p-3 rounded-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                                        <FaChartBar className="text-white text-2xl group-hover:text-white group-hover:drop-shadow-lg transition-all duration-300" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white ml-4 group-hover:text-white group-hover:tracking-wide transition-all duration-300">
                                        {isAdmin ? "Datos Estadísticos Administrador" : "Datos Estadísticos Usuario"}
                                    </h3>
                                </div>

                                <div className="p-6 bg-white group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-orange-50 transition-all duration-500 rounded-b-xl">
                                    <p className="text-gray-700 group-hover:text-gray-800 leading-relaxed transition-all duration-300">
                                        Visualiza estadísticas completas de incendios y recursos desplegados en diferentes regiones.
                                    </p>
                                    <div className="mt-4 text-orange-600 group-hover:text-orange-700 font-medium flex items-center justify-end group-hover:translate-x-2 group-hover:scale-105 transition-all duration-300">
                                        <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">✨</span>
                                        Ver detalles
                                        <span className="ml-1 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                                    </div>
                                </div>
                            </div>
                        </a>

                        {/* Card 2 - Gestión de Equipos con hover ultra profesional */}
                        <a
                            href={teamsRoute}
                            className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-700 overflow-hidden transform hover:-translate-y-3 hover:scale-[1.02] cursor-pointer"
                        >
                            {/* Efecto de brillo diagonal que se mueve */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out delay-100"></div>

                            {/* Borde animado */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-0.5">
                                <div className="bg-white rounded-xl h-full w-full"></div>
                            </div>

                            {/* Contenido principal */}
                            <div className="relative z-10">
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 group-hover:from-orange-600 group-hover:to-red-500 p-4 flex items-center transition-all duration-500 rounded-t-xl relative overflow-hidden">
                                    {/* Partículas flotantes */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                                        <div className="absolute top-3 left-6 w-1 h-1 bg-white rounded-full animate-pulse delay-100"></div>
                                        <div className="absolute top-5 right-10 w-1 h-1 bg-white/70 rounded-full animate-pulse delay-500"></div>
                                        <div className="absolute bottom-2 left-16 w-1 h-1 bg-white/50 rounded-full animate-pulse delay-800"></div>
                                    </div>

                                    <div className="bg-white/20 group-hover:bg-white/30 p-3 rounded-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                                        <FaUsers className="text-white text-2xl group-hover:text-white group-hover:drop-shadow-lg transition-all duration-300" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white ml-4 group-hover:text-white group-hover:tracking-wide transition-all duration-300">
                                        {isAdmin ? "Gestión de Equipos" : "Perfil Usuario"}
                                    </h3>
                                </div>

                                <div className="p-6 bg-white group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-orange-50 transition-all duration-500 rounded-b-xl">
                                    <p className="text-gray-700 group-hover:text-gray-800 leading-relaxed transition-all duration-300">
                                        Coordina brigadas, recursos y gestiona zonas afectadas con herramientas especializadas.
                                    </p>
                                    <div className="mt-4 text-orange-600 group-hover:text-orange-700 font-medium flex items-center justify-end group-hover:translate-x-2 group-hover:scale-105 transition-all duration-300">
                                        <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">👥</span>
                                        Ver detalles
                                        <span className="ml-1 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                                    </div>
                                </div>
                            </div>
                        </a>

                        {/* Card 3 - Mapa en Tiempo Real con hover ultra profesional */}
                        <a
                            href="/Maps"
                            className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-700 overflow-hidden transform hover:-translate-y-3 hover:scale-[1.02] cursor-pointer"
                        >
                            {/* Efecto de brillo diagonal que se mueve */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out delay-200"></div>

                            {/* Borde animado */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-0.5">
                                <div className="bg-white rounded-xl h-full w-full"></div>
                            </div>

                            {/* Contenido principal */}
                            <div className="relative z-10">
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 group-hover:from-orange-600 group-hover:to-red-500 p-4 flex items-center transition-all duration-500 rounded-t-xl relative overflow-hidden">
                                    {/* Partículas flotantes */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                                        <div className="absolute top-1 left-8 w-1 h-1 bg-white rounded-full animate-pulse delay-200"></div>
                                        <div className="absolute top-7 right-6 w-1 h-1 bg-white/70 rounded-full animate-pulse delay-600"></div>
                                        <div className="absolute bottom-4 left-20 w-1 h-1 bg-white/50 rounded-full animate-pulse delay-900"></div>
                                    </div>

                                    <div className="bg-white/20 group-hover:bg-white/30 p-3 rounded-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                                        <FaMapMarkedAlt className="text-white text-2xl group-hover:text-white group-hover:drop-shadow-lg transition-all duration-300" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white ml-4 group-hover:text-white group-hover:tracking-wide transition-all duration-300">
                                        Mapa en Tiempo Real
                                    </h3>
                                </div>

                                <div className="p-6 bg-white group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-orange-50 transition-all duration-500 rounded-b-xl">
                                    <p className="text-gray-700 group-hover:text-gray-800 leading-relaxed transition-all duration-300">
                                        Monitorea los incendios activos en Bolivia con actualizaciones en tiempo real y alertas tempranas.
                                    </p>
                                    <div className="mt-4 text-orange-600 group-hover:text-orange-700 font-medium flex items-center justify-end group-hover:translate-x-2 group-hover:scale-105 transition-all duration-300">
                                        <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">🗺️</span>
                                        Ver detalles
                                        <span className="ml-1 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                                    </div>
                                </div>
                            </div>
                        </a>

                        {/* Card 4 - Reporte de Usuarios con hover ultra profesional */}
                        <a
                            href="/Reporte/Usuario"
                            className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-700 overflow-hidden transform hover:-translate-y-3 hover:scale-[1.02] cursor-pointer"
                        >
                            {/* Efecto de brillo diagonal que se mueve */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out delay-300"></div>

                            {/* Borde animado */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-0.5">
                                <div className="bg-white rounded-xl h-full w-full"></div>
                            </div>

                            {/* Contenido principal */}
                            <div className="relative z-10">
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 group-hover:from-orange-600 group-hover:to-red-500 p-4 flex items-center transition-all duration-500 rounded-t-xl relative overflow-hidden">
                                    {/* Partículas flotantes */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                                        <div className="absolute top-4 left-10 w-1 h-1 bg-white rounded-full animate-pulse delay-300"></div>
                                        <div className="absolute top-2 right-12 w-1 h-1 bg-white/70 rounded-full animate-pulse delay-700"></div>
                                        <div className="absolute bottom-1 left-24 w-1 h-1 bg-white/50 rounded-full animate-pulse delay-1000"></div>
                                    </div>

                                    <div className="bg-white/20 group-hover:bg-white/30 p-3 rounded-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                                        <FaClipboardList className="text-white text-2xl group-hover:text-white group-hover:drop-shadow-lg transition-all duration-300" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white ml-4 group-hover:text-white group-hover:tracking-wide transition-all duration-300">
                                        Reporte de Usuarios
                                    </h3>
                                </div>

                                <div className="p-6 bg-white group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-orange-50 transition-all duration-500 rounded-b-xl">
                                    <p className="text-gray-700 group-hover:text-gray-800 leading-relaxed transition-all duration-300">
                                        Envía formularios de incidentes y genera reportes detallados sobre situaciones detectadas.
                                    </p>
                                    <div className="mt-4 text-orange-600 group-hover:text-orange-700 font-medium flex items-center justify-end group-hover:translate-x-2 group-hover:scale-105 transition-all duration-300">
                                        <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">📋</span>
                                        Ver detalles
                                        <span className="ml-1 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                                    </div>
                                </div>
                            </div>
                        </a>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Home;