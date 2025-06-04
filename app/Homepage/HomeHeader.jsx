"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useQuery, useMutation } from '@apollo/client';
import {
    OBTENER_USUARIO,
    OBTENER_USUARIOS_PENDIENTES,
    ACTIVAR_CUENTA_USUARIO
} from '../Endpoints/endpoints_graphql';

const HomeHeader = () => {
    const [open, setOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/");
    };

    const [token, setToken] = useState(null);

    useEffect(() => {
        const tokenLocal = localStorage.getItem('token');
        if (!tokenLocal) {
            router.push('/Login');
        } else {
            setToken(tokenLocal);
        }
    }, [router]);

    // Query para obtener datos del usuario logueado
    const {
        data: userData,
        loading: userLoading,
        error: userError
    } = useQuery(OBTENER_USUARIO, {
        variables: { token },
        skip: !token,
        onError: (error) => {
            console.error("Error al obtener usuario:", error);
            setErrorMessage("Error al cargar datos de usuario");
        }
    });

    // Query para obtener usuarios pendientes con polling
    const {
        data: pendingUsersData,
        loading: pendingLoading,
        error: pendingError,
        refetch: refetchPendingUsers,
        startPolling,
        stopPolling
    } = useQuery(OBTENER_USUARIOS_PENDIENTES, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        },
        fetchPolicy: 'network-only',
        pollInterval: 30000, // Actualiza cada 30 segundos
        onError: (error) => {
            if (error.graphQLErrors.some(e => e.message === 'No autorizado')) {
                window.location.href = '/Login';
            }
        }
    });

    // Mutation para activar cuentas
    const [activarCuenta, { error: activationError }] = useMutation(ACTIVAR_CUENTA_USUARIO, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        },
        onError: (error) => {
            console.error("Error al activar cuenta:", error);
            setErrorMessage("Error al activar la cuenta");
        }
    });

    const isAdmin = userData?.obtenerUsuario?.rol === 'admin';
    const pendingUsers = pendingUsersData?.obtenerUsuariosPendientes || [];
    const pendingCount = pendingUsers.length;

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

    const handleToggleModal = async () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        if (!showModal && isAdmin) {
            try {
                setIsRefreshing(true);
                await refetchPendingUsers();
            } catch (error) {
                console.error("Error al refetch:", error);
                setErrorMessage("Error al cargar solicitudes");
            } finally {
                setIsRefreshing(false);
            }
        }
        setShowModal(!showModal);
    };

    // Controlar el polling cuando el modal está abierto/cerrado
    useEffect(() => {
        if (showModal) {
            startPolling(30000); // Iniciar polling cada 30 segundos
        } else {
            stopPolling(); // Detener polling cuando el modal se cierra
        }

        return () => {
            stopPolling(); // Limpiar al desmontar
        };
    }, [showModal, startPolling, stopPolling]);

    const formatDate = (dateString) => {
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('es-BO', options);
        } catch {
            return dateString;
        }
    };

    const handleActivateAccount = async (userId) => {
        try {
            setIsRefreshing(true);
            const { data } = await activarCuenta({
                variables: { id_usuario: userId }
            });

            if (data?.activarCuentaUsuario) {
                setSuccessMessage("Cuenta activada exitosamente");
                // Refrescar inmediatamente después de activar
                await refetchPendingUsers();
            } else {
                setErrorMessage("No se pudo activar la cuenta");
            }
        } catch (error) {
            console.error('Error completo al activar cuenta:', error);
            setErrorMessage(error.message || "Error al activar la cuenta");
        } finally {
            setIsRefreshing(false);
        }
    };

    // Efecto para limpiar mensajes después de un tiempo
    useEffect(() => {
        const timer = setTimeout(() => {
            if (errorMessage) setErrorMessage(null);
            if (successMessage) setSuccessMessage(null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [errorMessage, successMessage]);

    return (
        <header className="bg-white shadow-md py-4 px-5 flex justify-between items-center sticky top-0 z-50">
            <a href={"/"}>
                <div className="flex items-center">
                    <svg className="mr-3" viewBox="0 0 100 100" width="60" height="60">
                        <circle cx="50" cy="50" r="45" fill="#e25822" />
                        <path d="M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20" fill="#ffcc00" />
                        <path d="M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20" fill="#ffcc00" />
                    </svg>
                    <span className="text-2xl text-[#e25822] font-bold">
                        Alas Chiquitanas
                    </span>
                </div>
            </a>

            {/* Botón hamburguesa para móviles */}
            <button
                onClick={() => setOpen(!open)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-[#e25822] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#e25822]"
                aria-label="Abrir menú"
            >
                <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    {open ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Menú horizontal para desktop */}
            <nav className="hidden md:flex items-center space-x-6">
                {isAdmin && (
                    <>
                        <Link href="/Reporte/Historial">
                            <button className="text-gray-700 hover:bg-[#e25822] hover:text-white px-3 py-2 rounded-md transition-colors">
                                Historial de Reportes
                            </button>
                        </Link>
                        <button
                            onClick={handleToggleModal}
                            className="text-gray-700 hover:bg-[#e25822] hover:text-white px-3 py-2 rounded-md transition-colors relative"
                        >
                            Solicitudes
                            {pendingCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    </>
                )}
                <Link href="/Reporte/Invitado">
                    <button className="text-gray-700 hover:bg-[#e25822] hover:text-white px-3 py-2 rounded-md transition-colors">
                        Reporte Rápido
                    </button>
                </Link>
                <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:bg-[#e25822] hover:text-white px-3 py-2 rounded-md transition-colors"
                >
                    Cerrar Sesión
                </button>
            </nav>

            {/* Menú desplegable para móviles */}
            {open && (
                <nav className="md:hidden absolute top-full left-0 right-0 border-t border-gray-200 bg-white z-50">
                    <ul className="list-none px-2 pt-2 pb-3 space-y-1">
                        {isAdmin && (
                            <>
                                <li>
                                    <Link href="/Reporte/Historial">
                                        <button
                                            className="text-gray-700 hover:bg-[#e25822] hover:text-white px-3 py-2 rounded-md transition-colors w-full text-left"
                                            onClick={() => setOpen(false)}
                                        >
                                            Historial de Reportes
                                        </button>
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={handleToggleModal}
                                        className="text-gray-700 hover:bg-[#e25822] hover:text-white px-3 py-2 rounded-md transition-colors w-full text-left flex justify-between items-center"
                                    >
                                        <span>Solicitudes</span>
                                        {pendingCount > 0 && (
                                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                {pendingCount}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            </>
                        )}
                        <li>
                            <Link href="/Reporte/Invitado">
                                <button
                                    className="text-gray-700 hover:bg-[#e25822] hover:text-white px-3 py-2 rounded-md transition-colors w-full text-left"
                                    onClick={() => setOpen(false)}
                                >
                                    Reporte Rápido
                                </button>
                            </Link>
                        </li>
                        <li>
                            <button
                                onClick={handleLogout}
                                className="text-gray-700 hover:bg-[#e25822] hover:text-white px-3 py-2 rounded-md transition-colors w-full text-left"
                            >
                                Cerrar Sesión
                            </button>
                        </li>
                    </ul>
                </nav>
            )}

            {/* Modal de Solicitudes */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-lg text-sm text-gray-800 relative max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-center mb-6">Solicitudes de Cuentas Pendientes</h3>

                        {/* Mensajes de estado */}
                        {errorMessage && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                                {errorMessage}
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                                {successMessage}
                            </div>
                        )}

                        {/* Loading state */}
                        {(pendingLoading || isRefreshing) && (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e25822]"></div>
                            </div>
                        )}

                        {/* Contenido principal */}
                        {!(pendingLoading || isRefreshing) && (
                            <>
                                {pendingCount === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No hay solicitudes pendientes</p>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingUsers.map(user => (
                                            <div key={user.id} className="bg-gray-50 p-4 rounded-md shadow-md transition-all hover:shadow-lg">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="text-lg font-semibold text-gray-800">
                                                            {user.nombre} {user.apellido}
                                                        </span>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Registrado: {formatearFecha(user.creado)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleActivateAccount(user.id)}
                                                        disabled={isRefreshing}
                                                        className={`bg-[#e25822] text-white px-3 py-1 rounded-md text-sm hover:bg-[#c14a1c] transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {isRefreshing ? 'Procesando...' : 'Activar Cuenta'}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                    <p><span className="font-medium">CI:</span> {user.ci}</p>
                                                    <p><span className="font-medium">Teléfono:</span> {user.telefono}</p>
                                                    <p><span className="font-medium">Email:</span> {user.email}</p>
                                                    {/*<p><span className="font-medium">Entidad:</span> {user.entidad_perteneciente || 'No especificado'}</p>*/}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            onClick={handleToggleModal}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                            disabled={isRefreshing}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="h-6 w-6"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default HomeHeader;