"use client";

import React, { useState, useMemo } from "react";
import GenerateReportButton from "../../Components/GenerateReportButton";
import dynamic from "next/dynamic";
import { useQuery } from "@apollo/client";
import { OBTENER_REPORTES, OBTENER_EQUIPOS, OBTENER_RECURSOS } from "../../Endpoints/endpoints_graphql";

// Carga dinámica para el componente de mapa (evita SSR)
const MapWithMarker = dynamic(() => import("../../Components/MapWithMarker"), {
    ssr: false,
    loading: () => (
        <div className="h-48 bg-gray-100 flex items-center justify-center">Cargando mapa...</div>
    ),
});

export default function HistorialReportes() {
    // Queries GraphQL
    const {
        data: reportesData,
        loading: loadingReportes,
        error: errorReportes,
    } = useQuery(OBTENER_REPORTES, {
        fetchPolicy: "network-only",
    });

    const {
        data: equiposData,
        loading: loadingEquipos,
        error: errorEquipos,
    } = useQuery(OBTENER_EQUIPOS, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        },
        fetchPolicy: "network-only",
    });

    const {
        data: recursosData,
        loading: loadingRecursos,
        error: errorRecursos
    } = useQuery(OBTENER_RECURSOS, {
        fetchPolicy: "network-only",
    });

    // Estados para filtros
    const [search, setSearch] = useState("");
    const [dayFilter, setDayFilter] = useState("7");
    const [viewMode, setViewMode] = useState("reportes"); // 'reportes' o 'equipos' o 'recursos'

    // Filtrar reportes
    const reportesFiltrados = useMemo(() => {
        if (!reportesData?.obtenerReportes) return [];

        return reportesData.obtenerReportes.filter((r) => {
            const coincideTexto =
                r.nombre_reportante?.toLowerCase().includes(search.toLowerCase()) ||
                (r.nombre_lugar || "").toLowerCase().includes(search.toLowerCase());

            const coincideDia = dayFilter === "all" || withinLastDays(r.fecha_hora, Number(dayFilter));

            return coincideTexto && coincideDia;
        });
    }, [reportesData, search, dayFilter]);

    // Filtrar equipos
    const equiposFiltrados = useMemo(() => {
        if (!equiposData?.obtenerEquipos) return [];

        return equiposData.obtenerEquipos.filter((e) =>
            e.nombre_equipo.toLowerCase().includes(search.toLowerCase())
        );
    }, [equiposData, search]);

    // Filtrar recursos
    const recursosFiltrados = useMemo(() => {
        if (!recursosData?.obtenerRecursosCompletos) return [];

        const filtrados = recursosData.obtenerRecursosCompletos.filter((r) => {
            const coincideTexto =
                r.codigo?.toLowerCase().includes(search.toLowerCase()) ||
                r.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
                r.Equipoid?.nombre_equipo?.toLowerCase().includes(search.toLowerCase());

            const coincideDia = dayFilter === "all" || withinLastDays(r.fecha_pedido, Number(dayFilter));

            return coincideTexto && coincideDia;
        });

        // Ordenar por fecha (más recientes primero)
        return filtrados.sort((a, b) => {
            const fechaA = parseDate(a.fecha_pedido);
            const fechaB = parseDate(b.fecha_pedido);
            if (!fechaA && !fechaB) return 0;
            if (!fechaA) return 1;
            if (!fechaB) return -1;
            return fechaB.getTime() - fechaA.getTime();
        });
    }, [recursosData, search, dayFilter]);

    // Funciones utilitarias
    function parseDate(dateStr) {
        if (!dateStr) return null;
        if (!isNaN(dateStr)) return new Date(Number(dateStr));
        if (dateStr instanceof Date) return dateStr;
        return new Date(dateStr);
    }

    function withinLastDays(fechaStr, days) {
        const fecha = parseDate(fechaStr);
        if (!fecha || isNaN(fecha)) return false;
        const limite = Date.now() - days * 24 * 60 * 60 * 1000;
        return fecha.getTime() >= limite;
    }

    function getStatusColor(status) {
        switch (status) {
            case "Alto":
                return "bg-red-100 text-red-800";
            case "Mediano":
                return "bg-yellow-100 text-yellow-800";
            case "Controlado":
                return "bg-green-100 text-green-800";
            case "activo":
                return "bg-blue-100 text-blue-800";
            case "inactivo":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }

    function getApprovalStatusColor(approved) {
        return approved
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-red-100 text-red-800 border-red-200";
    }

    function getApprovalStatusText(approved) {
        return approved ? "Aprobado" : "Pendiente";
    }

    function getApprovalStatusIcon(approved) {
        return approved
            ? "✓"
            : "⏳";
    }

    // Función para parsear la descripción de recursos
    function parseRecursosDescription(descripcion) {
        if (!descripcion) return [];

        try {
            // Dividir por comas y parsear cada item
            return descripcion.split(',').map(item => {
                const [nombre, cantidad] = item.split(':');
                return {
                    nombre: nombre?.trim() || '',
                    cantidad: parseInt(cantidad?.trim()) || 0
                };
            }).filter(item => item.nombre && item.cantidad > 0);
        } catch (error) {
            console.error('Error parsing recursos:', error);
            return [];
        }
    }

    // Logo
    const LogoIcon = () => (
        <a href={"/Homepage"}>
            <div className="flex items-center">
                <svg viewBox="0 0 100 100" width="60" height="60" className="mr-3">
                    <circle cx="50" cy="50" r="45" fill="#e25822" />
                    <path d="M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20" fill="#ffcc00" />
                    <path d="M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20" fill="#ffcc00" />
                </svg>
                <span className="text-2xl text-[#e25822] font-bold">Alas Chiquitanas</span>
            </div>
        </a>
    );

    const loading = loadingReportes || loadingEquipos || loadingRecursos;
    const error = errorReportes || errorEquipos || errorRecursos;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-50">
                <LogoIcon />
            </header>

            <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#e25822]">
                        {viewMode === "reportes"
                            ? "Historial de Reportes"
                            : viewMode === "equipos"
                                ? "Listado de Equipos"
                                : "Gestión de Recursos"}
                    </h2>
                    <p className="text-gray-600 mt-2">
                        {viewMode === "reportes"
                            ? "Visualiza todos los reportes de incendios registrados en el sistema"
                            : viewMode === "equipos"
                                ? "Visualiza todos los equipos de respuesta registrados en el sistema"
                                : "Visualiza y gestiona los recursos solicitados por los equipos"}
                    </p>
                </div>

                {/* Filtros y controles */}
                <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-4 mb-6">
                    <input
                        type="text"
                        placeholder={
                            viewMode === "reportes"
                                ? "Buscar por nombre o lugar..."
                                : viewMode === "equipos"
                                    ? "Buscar por nombre de equipo..."
                                    : "Buscar por código, descripción o equipo..."
                        }
                        className="flex-grow min-w-[220px] border border-gray-300 rounded-lg px-4 py-2 focus:ring focus:ring-orange-200 focus:border-orange-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {(viewMode === "reportes" || viewMode === "recursos") && (
                        <select
                            value={dayFilter}
                            onChange={(e) => setDayFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-orange-200 focus:border-orange-500"
                        >
                            <option value="1">Últimas 24 h</option>
                            <option value="7">Últimos 7 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="all">Todo</option>
                        </select>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode("reportes")}
                            className={`px-4 py-2 rounded-full text-sm border transition ${
                                viewMode === "reportes"
                                    ? "bg-[#e25822] text-white border-[#e25822]"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                            Ver Reportes
                        </button>
                        <button
                            onClick={() => setViewMode("equipos")}
                            className={`px-4 py-2 rounded-full text-sm border transition ${
                                viewMode === "equipos"
                                    ? "bg-[#e25822] text-white border-[#e25822]"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                            Ver Equipos
                        </button>
                        <button
                            onClick={() => setViewMode("recursos")}
                            className={`px-4 py-2 rounded-full text-sm border transition ${
                                viewMode === "recursos"
                                    ? "bg-[#e25822] text-white border-[#e25822]"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                            Ver Recursos
                        </button>
                    </div>
                </div>

                {/* Tabla de contenido */}
                <div className="bg-white rounded-xl shadow overflow-x-auto">
                    {viewMode === "reportes" && (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                                <th className="px-4 py-3 text-left font-semibold">Reportante</th>
                                <th className="px-4 py-3 text-left font-semibold">Lugar</th>
                                <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                                <th className="px-4 py-3 text-left font-semibold">Gravedad</th>
                                <th className="px-4 py-3 text-left font-semibold">Origen</th>
                                <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {loadingReportes && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#e25822]"></div>
                                        </div>
                                        <p className="mt-2 text-gray-500">Cargando reportes...</p>
                                    </td>
                                </tr>
                            )}

                            {errorReportes && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-red-600">
                                        <p className="font-medium">Error al cargar datos</p>
                                        <p className="text-sm text-red-500">{errorReportes.message}</p>
                                    </td>
                                </tr>
                            )}

                            {!loadingReportes && reportesFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center">
                                        <p className="text-gray-500">No se encontraron reportes que coincidan con los filtros</p>
                                    </td>
                                </tr>
                            )}

                            {!loadingReportes &&
                                reportesFiltrados.map((r) => {
                                    const fecha = parseDate(r.fecha_hora);
                                    const fechaFormateada = fecha
                                        ? fecha.toLocaleDateString("es-ES", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                        : "Fecha no disponible";

                                    return (
                                        <tr key={r.id} className="hover:bg-orange-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">{fechaFormateada}</td>
                                            <td className="px-4 py-3">{r.nombre_reportante || "—"}</td>
                                            <td className="px-4 py-3">{r.nombre_lugar || "—"}</td>
                                            <td className="px-4 py-3">{r.tipo_incendio || "Incendio"}</td>
                                            <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(r.gravedad_incendio)}`}>
                            {r.gravedad_incendio || "N/A"}
                          </span>
                                            </td>
                                            <td className="px-4 py-3 capitalize">{r.creado === "voluntario" ? "Voluntario" : "Brigadista"}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <GenerateReportButton data={r} tipoReporte="reporte" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {viewMode === "equipos" && (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                                <th className="px-4 py-3 text-left font-semibold">Ubicación</th>
                                <th className="px-4 py-3 text-left font-semibold">Integrantes</th>
                                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                                <th className="px-4 py-3 text-left font-semibold">Líder</th>
                                <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {loadingEquipos && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#e25822]"></div>
                                        </div>
                                        <p className="mt-2 text-gray-500">Cargando equipos...</p>
                                    </td>
                                </tr>
                            )}

                            {errorEquipos && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-red-600">
                                        <p className="font-medium">Error al cargar datos</p>
                                        <p className="text-sm text-red-500">{errorEquipos.message}</p>
                                    </td>
                                </tr>
                            )}

                            {!loadingEquipos && equiposFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center">
                                        <p className="text-gray-500">No se encontraron equipos que coincidan con los filtros</p>
                                    </td>
                                </tr>
                            )}

                            {!loadingEquipos &&
                                equiposFiltrados.map((e) => (
                                    <tr key={e.id} className="hover:bg-orange-50 transition-colors">
                                        <td className="px-4 py-3">{e.nombre_equipo || "—"}</td>
                                        <td className="px-4 py-3">
                                            {e.ubicacion?.coordinates
                                                ? `${e.ubicacion.coordinates[1]?.toFixed(4)}, ${e.ubicacion.coordinates[0]?.toFixed(4)}`
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3">{e.cantidad_integrantes || 0}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(e.estado)}`}>{e.estado || "N/A"}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {e.id_lider_equipo?.nombre ? `${e.id_lider_equipo.nombre} ${e.id_lider_equipo.apellido}` : "—"}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <GenerateReportButton data={e} tipoReporte="equipo" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {viewMode === "recursos" && (
                        <div className="p-6">
                            {loadingRecursos && (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e25822]"></div>
                                    <p className="ml-4 text-gray-500">Cargando recursos...</p>
                                </div>
                            )}

                            {errorRecursos && (
                                <div className="text-center py-12">
                                    <div className="text-red-600">
                                        <p className="font-medium text-lg">Error al cargar recursos</p>
                                        <p className="text-sm text-red-500 mt-2">{errorRecursos.message}</p>
                                    </div>
                                </div>
                            )}

                            {!loadingRecursos && recursosFiltrados.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H1" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 text-lg">No se encontraron recursos que coincidan con los filtros</p>
                                </div>
                            )}

                            {!loadingRecursos && recursosFiltrados.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                                    {recursosFiltrados.map((recurso) => {
                                        const fechaPedido = parseDate(recurso.fecha_pedido);
                                        const fechaFormateada = fechaPedido
                                            ? fechaPedido.toLocaleDateString("es-ES", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "Fecha no disponible";

                                        const recursosParseados = parseRecursosDescription(recurso.descripcion);

                                        return (
                                            <div key={recurso.id} className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                                {/* Header de la card */}
                                                <div className="px-6 py-4 border-b border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                                                                <span className="text-white font-bold text-lg">
                                                                    {recurso.Equipoid?.nombre_equipo?.charAt(0) || "?"}
                                                                </span>
                                                            </div>
                                                            <div className="ml-4">
                                                                <h3 className="text-lg font-semibold text-gray-900">
                                                                    {recurso.codigo || "Sin código"}
                                                                </h3>
                                                                <p className="text-sm text-gray-500">
                                                                    {fechaFormateada}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-2 ${getApprovalStatusColor(recurso.estado_del_pedido)}`}>
                                                                <span className="mr-1 text-sm">
                                                                    {getApprovalStatusIcon(recurso.estado_del_pedido)}
                                                                </span>
                                                                {getApprovalStatusText(recurso.estado_del_pedido)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contenido principal */}
                                                <div className="px-6 py-4">
                                                    {/* Información del equipo */}
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                            <svg className="h-4 w-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            Equipo Solicitante
                                                        </h4>
                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            <p className="font-medium text-gray-900">
                                                                {recurso.Equipoid?.nombre_equipo || "Equipo no asignado"}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {recurso.Equipoid?.cantidad_integrantes || 0} integrantes • Estado: {recurso.Equipoid?.estado || "N/A"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Lista de recursos solicitados */}
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                                            <svg className="h-4 w-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                            </svg>
                                                            Recursos Solicitados ({recursosParseados.length})
                                                        </h4>
                                                        {recursosParseados.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {recursosParseados.map((item, index) => (
                                                                    <div key={index} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2 border-l-4 border-orange-400">
                                                                        <div className="flex items-center">
                                                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                                                                <span className="text-orange-600 font-medium text-sm">
                                                                                    {item.nombre.charAt(0).toUpperCase()}
                                                                                </span>
                                                                            </div>
                                                                            <span className="font-medium text-gray-900 capitalize">
                                                                                {item.nombre.toLowerCase()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center">
                                                                            <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                                                {item.cantidad} {item.cantidad === 1 ? 'unidad' : 'unidades'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                                                <p className="text-sm">No se pudieron cargar los recursos solicitados</p>
                                                                <p className="text-xs mt-1">Datos originales: {recurso.descripcion}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Información de ubicación */}
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                            <svg className="h-4 w-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            Ubicación
                                                        </h4>
                                                        <div className="bg-blue-50 rounded-lg p-3">
                                                            <p className="text-sm text-blue-800 font-mono">
                                                                {recurso.lat && recurso.lng
                                                                    ? `${recurso.lat.toFixed(6)}, ${recurso.lng.toFixed(6)}`
                                                                    : recurso.Equipoid?.ubicacion?.coordinates
                                                                        ? `${recurso.Equipoid.ubicacion.coordinates[1]?.toFixed(6)}, ${recurso.Equipoid.ubicacion.coordinates[0]?.toFixed(6)}`
                                                                        : "Ubicación no disponible"
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer con fecha de creación/actualización */}
                                                <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <div className="flex items-center">
                                                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Creado: {recurso.creado ? new Date(recurso.creado).toLocaleDateString("es-ES") : "—"}
                                                        </div>
                                                        {recurso.actualizado && (
                                                            <div className="flex items-center">
                                                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                                Actualizado: {new Date(recurso.actualizado).toLocaleDateString("es-ES")}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Resumen */}
                {!loading && (
                    <div className="mt-6 bg-white p-4 rounded-xl shadow">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {viewMode === "reportes"
                                    ? `Total Reportes: ${reportesFiltrados.length}`
                                    : viewMode === "equipos"
                                        ? `Total Equipos: ${equiposFiltrados.length}`
                                        : `Total Recursos: ${recursosFiltrados.length}`}
                            </h3>
                            {viewMode === "recursos" && (
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center">
                                        <span className="inline-block w-3 h-3 bg-green-200 rounded-full mr-2"></span>
                                        <span>Aprobados: {recursosFiltrados.filter(r => r.estado_del_pedido).length}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="inline-block w-3 h-3 bg-red-200 rounded-full mr-2"></span>
                                        <span>Pendientes: {recursosFiltrados.filter(r => !r.estado_del_pedido).length}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}