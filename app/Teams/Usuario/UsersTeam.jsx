"use client";
import React, { useState, useEffect } from "react";
import Footer from "../../Components/Footer";
import TeamHeader from "../TeamHeader";
import { useQuery, useMutation } from '@apollo/client';
import { OBTENER_USUARIO_POR_TOKEN, ACTUALIZAR_USUARIO, SOLICITAR_ELIMINACION } from '../../Endpoints/endpoints_graphql';

const UserProfile = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ show: false, message: "", type: "" });
    const [updating, setUpdating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteRequestSent, setDeleteRequestSent] = useState(false);

    // Query para obtener datos del usuario por token
    const { loading, error } = useQuery(OBTENER_USUARIO_POR_TOKEN, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        },
        onCompleted: (data) => {

            if (data?.obtenerUsuarioPorToken) {
                setCurrentUser(data.obtenerUsuarioPorToken);
            }
        },
        onError: (error) => {
            console.error("Error al obtener usuario:", error);
            setStatusMessage({
                show: true,
                message: "Error al cargar el perfil",
                type: "error"
            });
        }
    });

    const [actualizarUsuario] = useMutation(ACTUALIZAR_USUARIO, {
        refetchQueries: [
            {
                query: OBTENER_USUARIO_POR_TOKEN,
                context: {
                    headers: {
                        authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            }
        ],
        awaitRefetchQueries: true
    });

    const [solicitarEliminacion] = useMutation(SOLICITAR_ELIMINACION);

    // Función para actualizar el estado del usuario
    const updateUserStatus = async (nuevoEstado) => {
        if (!currentUser) return;

        setUpdating(true);
        try {
            const { data } = await actualizarUsuario({
                context: {
                    headers: {
                        authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                },
                variables: {
                    actualizarUsuarioId: currentUser.id,
                    input: {
                        estado: nuevoEstado
                    }
                }
            });

            // Actualizar el estado local
            if (data?.actualizarUsuario) {
                setCurrentUser(data.actualizarUsuario);
            }

            setStatusMessage({
                show: true,
                message: `Estado actualizado a ${nuevoEstado ? "Activo" : "Inactivo"}`,
                type: "success"
            });
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            setStatusMessage({
                show: true,
                message: "Error al actualizar el estado",
                type: "error"
            });
        } finally {
            setUpdating(false);
            setTimeout(() => {
                setStatusMessage({ show: false, message: "", type: "" });
            }, 3000);
        }
    };

    // Función para actualizar información del perfil
    const handleProfileUpdate = async (updatedData) => {
        if (!currentUser) return;

        setUpdating(true);
        try {
            const { data } = await actualizarUsuario({
                context: {
                    headers: {
                        authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                },
                variables: {
                    actualizarUsuarioId: currentUser.id,
                    input: updatedData
                }
            });

            // Actualizar el estado local con los nuevos datos
            if (data?.actualizarUsuario) {
                setCurrentUser(data.actualizarUsuario);
            }

            setShowEditModal(false);
            setStatusMessage({
                show: true,
                message: "Perfil actualizado correctamente",
                type: "success"
            });
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            setStatusMessage({
                show: true,
                message: "Error al actualizar el perfil",
                type: "error"
            });
        } finally {
            setUpdating(false);
            setTimeout(() => {
                setStatusMessage({ show: false, message: "", type: "" });
            }, 3000);
        }
    };

    // Función para solicitar eliminación de cuenta
    const handleDeleteAccountRequest = async () => {
        if (!currentUser) return;

        try {
            setUpdating(true);
            await solicitarEliminacion({
                variables: {
                    usuarioId: currentUser.id
                }
            });

            setDeleteRequestSent(true);
            setTimeout(() => {
                setDeleteRequestSent(false);
                setShowDeleteModal(false);
                setStatusMessage({
                    show: true,
                    message: "Solicitud de eliminación enviada correctamente",
                    type: "success"
                });
                setTimeout(() => {
                    setStatusMessage({ show: false, message: "", type: "" });
                }, 3000);
            }, 3000);
        } catch (error) {
            console.error("Error al solicitar eliminación:", error);
            setStatusMessage({
                show: true,
                message: "Error al enviar solicitud de eliminación",
                type: "error"
            });
        } finally {
            setUpdating(false);
        }
    };

    // Obtener el color del estado
    const getStatusColor = (estado) => {
        return estado ? "bg-green-500" : "bg-red-500";
    };

    // Obtener el texto del estado
    const getStatusText = (estado) => {
        return estado ? "Activo" : "Inactivo";
    };

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
    const formatearFechaNacimiento = (timestamp) => {
        const fecha = new Date(Number(timestamp));
        const dia = fecha.getUTCDate().toString().padStart(2, '0');
        const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getUTCFullYear();
        return `${dia}/${mes}/${año}`;
    };


    // Función para obtener las iniciales de manera segura
    const getInitials = () => {
        if (!currentUser) return '';
        const first = currentUser.nombre?.charAt(0) || '';
        const last = currentUser.apellido?.charAt(0) || '';
        return `${first}${last}`;
    };

    // Componente de formulario para editar perfil
    const EditProfileForm = ({ user, onUpdate, onCancel }) => {
        const [formData, setFormData] = useState({
            nombre: user.nombre || '',
            apellido: user.apellido || '',
            telefono: user.telefono || '',
            email: user.email || '',
            tipo_de_sangre: user.tipo_de_sangre || '',
            nivel_de_entrenamiento: user.nivel_de_entrenamiento || '',
            entidad_perteneciente: user.entidad_perteneciente || '',
            estado: user.estado || false
        });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onUpdate(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nombre" className="block font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="apellido" className="block font-medium text-gray-700 mb-1">Apellido</label>
                        <input
                            type="text"
                            id="apellido"
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="telefono" className="block font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                        type="text"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="tipo_de_sangre" className="block font-medium text-gray-700 mb-1">Tipo de sangre</label>
                        <select
                            id="tipo_de_sangre"
                            name="tipo_de_sangre"
                            value={formData.tipo_de_sangre}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="nivel_de_entrenamiento" className="block font-medium text-gray-700 mb-1">Nivel de entrenamiento</label>
                        <select
                            id="nivel_de_entrenamiento"
                            name="nivel_de_entrenamiento"
                            value={formData.nivel_de_entrenamiento}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="Básico">Básico</option>
                            <option value="Intermedio">Intermedio</option>
                            <option value="Avanzado">Avanzado</option>
                            <option value="Experto">Experto</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="entidad_perteneciente" className="block font-medium text-gray-700 mb-1">Entidad</label>
                    <input
                        type="text"
                        id="entidad_perteneciente"
                        name="entidad_perteneciente"
                        value={formData.entidad_perteneciente}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                    />
                </div>

                <div className="pt-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="estado"
                            checked={formData.estado}
                            onChange={(e) => setFormData({...formData, estado: e.target.checked})}
                            className="rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span>Usuario activo</span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1">Desmarca esta casilla para desactivar temporalmente el usuario</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={updating}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={updating}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                        {updating ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>
        );
    };

    // Estado de carga de la consulta
    if (loading) {
        return (
            <>
                <TeamHeader />
                <main className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-md p-6 flex justify-center items-center h-64">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
                            <p className="text-gray-500 text-lg">Cargando perfil de usuario...</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    // Estado de error
    if (error) {
        return (
            <>
                <TeamHeader />
                <main className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar el perfil</h2>
                        <p className="text-gray-600 mb-4">{error.message}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                        >
                            Reintentar
                        </button>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    // Si no hay usuario
    if (!currentUser) {
        return (
            <>
                <TeamHeader />
                <main className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">No se encontró el perfil</h2>
                        <p className="text-gray-600 mb-4">Por favor inicia sesión para ver tu perfil</p>
                        <a
                            href="/login"
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 inline-block"
                        >
                            Ir a inicio de sesión
                        </a>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <TeamHeader />
            <main className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
                {/* Mensaje de estado */}
                {statusMessage.show && (
                    <div className={`fixed top-5 right-5 z-50 p-4 rounded-md shadow-md ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {statusMessage.message}
                    </div>
                )}

                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-orange-600 mb-8 text-center">Mi Perfil</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Columna izquierda - Información del perfil */}
                        <div className="bg-white rounded-lg shadow-md p-8 lg:col-span-1">
                            <div className="text-center mb-6">
                                <div className="inline-block relative mb-4">
                                    <div className="w-32 h-32 rounded-full mx-auto bg-orange-100 flex items-center justify-center text-orange-600 text-4xl font-bold">
                                        {getInitials()}
                                    </div>
                                    <span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white ${getStatusColor(currentUser.estado)}`}></span>
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-800">
                                    {currentUser.nombre} {currentUser.apellido}
                                </h2>
                                <p className="text-gray-600">{currentUser.rol}</p>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">Estado actual</h3>
                                <div className="flex items-center gap-4">
                                    <span className={`inline-block w-4 h-4 rounded-full ${getStatusColor(currentUser.estado)}`}></span>
                                    <span className="font-medium">{getStatusText(currentUser.estado)}</span>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => updateUserStatus(true)}
                                        disabled={updating || currentUser.estado}
                                        className={`px-4 py-2 rounded-md ${currentUser.estado ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'} disabled:opacity-50`}
                                    >
                                        {updating ? "Actualizando..." : "Marcar como Activo"}
                                    </button>
                                    <button
                                        onClick={() => updateUserStatus(false)}
                                        disabled={updating || !currentUser.estado}
                                        className={`px-4 py-2 rounded-md ${!currentUser.estado ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'} disabled:opacity-50`}
                                    >
                                        {updating ? "Actualizando..." : "Marcar como Inactivo"}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">CI:</span>
                                    <span>{currentUser.ci || "No especificado"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Fecha de nacimiento:</span>
                                    <span>{formatearFechaNacimiento(currentUser.fecha_nacimiento)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Género:</span>
                                    <span>{currentUser.genero || "No especificado"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Teléfono:</span>
                                    <span>{currentUser.telefono || "No especificado"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Email:</span>
                                    <span>{currentUser.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Tipo de sangre:</span>
                                    <span>{currentUser.tipo_de_sangre || "No especificado"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Nivel de entrenamiento:</span>
                                    <span>{currentUser.nivel_de_entrenamiento || "No especificado"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Entidad:</span>
                                    <span>{currentUser.entidad_perteneciente || "No especificado"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Estado:</span>
                                    <span>{getStatusText(currentUser.estado)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Miembro desde:</span>
                                    <span>{formatearFecha(currentUser.creado)}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
                                >
                                    Editar perfil
                                </button>
                            </div>

                            <div className="mt-4">
                                {/*<button*/}
                                {/*    onClick={() => setShowDeleteModal(true)}*/}
                                {/*    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"*/}
                                {/*>*/}
                                {/*    Solicitar Eliminación de Cuenta*/}
                                {/*</button>*/}
                            </div>
                        </div>

                        {/* Columna derecha - Información adicional */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Información de emergencia */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Información de emergencia</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-orange-50 p-4 rounded-md">
                                        <h3 className="font-medium text-orange-800 mb-2">Tipo de sangre</h3>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {currentUser.tipo_de_sangre || "No especificado"}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-md">
                                        <h3 className="font-medium text-blue-800 mb-2">Nivel de entrenamiento</h3>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {currentUser.nivel_de_entrenamiento || "No especificado"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Datos de contacto */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos de contacto</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-1">Teléfono</h3>
                                        <p className="text-gray-800">{currentUser.telefono || "No especificado"}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-1">Correo electrónico</h3>
                                        <p className="text-gray-800">{currentUser.email}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-1">Entidad</h3>
                                        <p className="text-gray-800">{currentUser.entidad_perteneciente || "No especificado"}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700 mb-1">Rol</h3>
                                        <p className="text-gray-800">
                                            {currentUser.rol === 'admin'
                                                ? 'Comunario'
                                                : currentUser.rol === 'usuario'
                                                    ? 'Voluntario'
                                                    : 'No especificado'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal de edición de perfil */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        Editar perfil
                                    </h2>
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            ></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <EditProfileForm
                                    user={currentUser}
                                    onUpdate={handleProfileUpdate}
                                    onCancel={() => setShowEditModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de confirmación para eliminar cuenta */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                            <div className="p-6 border-b">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        Eliminar cuenta
                                    </h2>
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                        disabled={deleteRequestSent}
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            ></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {!deleteRequestSent ? (
                                    <>
                                        <p className="text-gray-700 mb-6">
                                            ¿Estás seguro de que deseas solicitar la eliminación de tu cuenta? Esta acción requiere la aprobación de un administrador.
                                        </p>
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => setShowDeleteModal(false)}
                                                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleDeleteAccountRequest}
                                                disabled={updating}
                                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                            >
                                                {updating ? "Enviando..." : "Confirmar solicitud"}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center py-8">
                                        <div className="relative w-24 h-24 mb-6">
                                            <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <svg
                                                    className="w-16 h-16 text-green-500"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M5 13l4 4L19 7"
                                                        className="animate-check"
                                                    ></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-medium text-gray-900 mb-2">¡Solicitud enviada!</h3>
                                        <p className="text-gray-600 text-center">
                                            Tu solicitud ha sido enviada al administrador para su revisión.
                                            Te notificaremos cuando sea procesada.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
};

export default UserProfile;