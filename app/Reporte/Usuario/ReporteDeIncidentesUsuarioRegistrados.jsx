"use client"
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useFormik } from "formik";
import * as Yup from 'yup';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../../globals.css';
import { useRouter } from 'next/navigation';
import { CREAR_REPORTE_INCENDIO, OBTENER_EQUIPOS, OBTENER_USUARIO_POR_TOKEN, CREAR_COMUNARIO_APOYO } from '../../Endpoints/endpoints_graphql';



delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const ConfirmReportModal = ({
                                isOpen,
                                onClose,
                                onConfirm,
                                formData,
                                loading,
                                selectedClima,
                                selectedEquipos,
                                apiError
                            }) => {
    if (!isOpen) return null;

    // Función para obtener ícono de estado del incendio
    const getControlIcon = (controlado) => {
        return controlado ? '🟢' : '🔴';
    };

    // Función para obtener ícono de necesidad de bomberos
    const getBomberosIcon = (necesita) => {
        return necesita ? '🆘' : '✅';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden animate-scale-in">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-gray-800">Confirmar Reporte de Incendio</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            disabled={loading}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <h4 className="font-medium text-orange-800 mb-3">Resumen del Reporte</h4>

                            <div className="grid gap-4">
                                {/* Nombre del Incidente */}
                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-40">Incidente:</span>
                                    <span className="font-semibold">{formData.nombreIncidente}</span>
                                </div>

                                {/* Estado del Incendio */}
                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-40">Estado:</span>
                                    <span>
                    {getControlIcon(formData.controlado)} {formData.controlado ? 'Controlado' : 'Fuera de control'}
                  </span>
                                </div>

                                {/* Extensión */}
                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-40">Extensión:</span>
                                    <span>{formData.extension || 'No especificado'}</span>
                                </div>

                                {/* Condiciones del Clima */}
                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-40">Clima:</span>
                                    <span>{selectedClima.join(', ') || 'No especificado'}</span>
                                </div>

                                {/* Equipos en Uso */}
                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-40">Equipos:</span>
                                    <span>{selectedEquipos.join(', ') || 'Ninguno'}</span>
                                </div>

                                {/* Bomberos */}
                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-40">Bomberos:</span>
                                    <span>
                    {formData.numeroBomberos} {formData.numeroBomberos === 1 ? 'bombero' : 'bomberos'}
                  </span>
                                </div>

                                {/* Necesidad de más bomberos */}
                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-40">Refuerzos:</span>
                                    <span>
                    {getBomberosIcon(formData.necesitaMasBomberos)} {formData.necesitaMasBomberos ? 'Se necesitan más' : 'Suficientes'}
                  </span>
                                </div>

                                {/* Apoyo Externo */}
                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-40">Apoyo externo:</span>
                                    <span>{formData.apoyoExterno || 'Ninguno'}</span>
                                </div>

                                {/* Comentario Adicional */}
                                {formData.comentarioAdicional && (
                                    <div className="flex items-start">
                                        <span className="font-medium text-gray-700 w-40">Comentario:</span>
                                        <span className="text-gray-600">{formData.comentarioAdicional}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm">
                            Por favor verifica que toda la información sea correcta antes de enviar el reporte.
                        </p>
                    </div>

                    {apiError && (
                        <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                            <p className="font-medium">Error al enviar el reporte:</p>
                            <p>{apiError}</p>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Revisar de nuevo
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Enviando...
                            </>
                        ) : (
                            'Confirmar y Enviar'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
const UsuariosIncidentForm = () => {
    const router = useRouter();
    const [createFireReport, {loading}] = useMutation(CREAR_REPORTE_INCENDIO);
    const [position, setPosition] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [selectedClima, setSelectedClima] = useState([]);
    const [selectedEquipos, setSelectedEquipos] = useState([]);
    const [equipoQuantities, setEquipoQuantities] = useState({});
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Inventario de recursos
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);

    // Comunarios locales
    const [communities, setCommunities] = useState([]);

    // Datos del usuario y su equipo asignado
    const { data: userData } = useQuery(OBTENER_USUARIO_POR_TOKEN, {
        context: {
            headers: { authorization: `Bearer ${localStorage.getItem('token')}` }
        }
    });

    const { data: teamsData } = useQuery(OBTENER_EQUIPOS, {
        context: {
            headers: { authorization: `Bearer ${localStorage.getItem('token')}` }
        }
    });

    const userId = userData?.obtenerUsuarioPorToken?.id;
    const [userTeamId, setUserTeamId] = useState(null);

    useEffect(() => {
        if (userId && teamsData?.obtenerEquipos) {
            // Buscar el equipo donde el usuario es miembro
            const equipoEncontrado = teamsData.obtenerEquipos.find(team => 
                team.miembros?.some(miembro => 
                    miembro.id_usuario?.id === userId
                )
            );

            if (equipoEncontrado) {
                console.log('Equipo encontrado:', equipoEncontrado);
                setUserTeamId(equipoEncontrado.id);
            } else {
                console.log('Usuario no encontrado en ningún equipo');
            }
        }
    }, [userId, teamsData]);

    const [createComunario] = useMutation(CREAR_COMUNARIO_APOYO, {
        context: {
            headers: { authorization: `Bearer ${localStorage.getItem('token')}` }
        }
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            // No está autenticado
            router.push('/');
        } else {
            setIsAuthenticated(true);
        }
    }, []);
    // Clean up Leaflet on component unmount
    useEffect(() => {
        return () => {
            const mapContainer = document.querySelector('.leaflet-container');
            if (mapContainer && mapContainer._leaflet_id) {
                mapContainer._leaflet_id = null;
            }
        };
    }, []);

    // Cargar inventario al montar el componente
    useEffect(() => {
        const fetchInventory = async () => {
            setLoadingInventory(true);
            try {
                const response = await fetch('/api/inventario/stock');
                if (!response.ok) throw new Error('Error al cargar inventario');
                const data = await response.json();
                setInventory(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingInventory(false);
            }
        };
        fetchInventory();
    }, []);

    // Helpers para comunarios locales
    const addCommunity = () => setCommunities(prev => [...prev, { nombre: '', edad: '' }]);
    const removeCommunity = (index) => setCommunities(prev => prev.filter((_, i) => i !== index));
    const updateCommunity = (index, field, value) => setCommunities(prev => {
        const arr = [...prev];
        arr[index][field] = value;
        return arr;
    });

    // Handle checkbox change for climate conditions
    const handleClimaChange = (e) => {
        const value = e.target.value;
        if (e.target.checked) {
            const newClima = [...selectedClima, value];
            setSelectedClima(newClima);
            formik.setFieldValue('condicionesClima', newClima.join(', '));
        } else {
            const newClima = selectedClima.filter(item => item !== value);
            setSelectedClima(newClima);
            formik.setFieldValue('condicionesClima', newClima.join(', '));
        }
    };

    // Handle checkbox change for equipment
    const handleEquipoChange = (e) => {
        const value = e.target.value;
        if (e.target.checked) {
            const newEquipos = [...selectedEquipos, value];
            setSelectedEquipos(newEquipos);
            formik.setFieldValue('equiposEnUso', newEquipos);
            // Initialize quantity to 0 when selecting an item
            setEquipoQuantities(prev => ({
                ...prev,
                [value]: 0
            }));
        } else {
            const newEquipos = selectedEquipos.filter(item => item !== value);
            setSelectedEquipos(newEquipos);
            formik.setFieldValue('equiposEnUso', newEquipos);
            // Remove quantity when deselecting an item
            setEquipoQuantities(prev => {
                const newQuantities = { ...prev };
                delete newQuantities[value];
                return newQuantities;
            });
        }
    };

    // Handle quantity change
    const handleQuantityChange = (itemName, quantity) => {
        setEquipoQuantities(prev => ({
            ...prev,
            [itemName]: parseInt(quantity) || 0
        }));
    };

    // Validation schema using Yup
    const validationSchema = Yup.object({
        nombreIncidente: Yup.string()
            .max(100, 'El nombre no debe exceder los 100 caracteres')
            .required('El nombre del incidente es obligatorio'),
        controlado: Yup.boolean()
            .required('Debes indicar si el incendio está controlado'),
        extension: Yup.string()
            .required('La extensión del área es obligatoria'),
        condicionesClima: Yup.string()
            .required('Selecciona al menos una condición climática'),
        numeroBomberos: Yup.number()
            .required('El número de bomberos es obligatorio')
            .min(0, 'No puede ser un número negativo'),
        necesitaMasBomberos: Yup.boolean()
            .required('Debes indicar si necesitas más bomberos'),
        apoyoExterno: Yup.string()
            .required('Selecciona el tipo de apoyo externo recibido')
    });


    // Initialize Formik
    const formik = useFormik({
        initialValues: {
            nombreIncidente: '',
            controlado: undefined,
            extension: '',
            condicionesClima: '',
            equiposEnUso: [],
            numeroBomberos: 0,
            necesitaMasBomberos: undefined,
            apoyoExterno: '',
            comentarioAdicional: ''
        },
        validationSchema,
        onSubmit: async (values) => {
            if (!values.apoyoExterno) {
                setError('Debes seleccionar el tipo de apoyo externo');
                return;
            }
            setError('');
            setShowConfirmModal(true);
        }
    });

    // Función para enviar datos a la API REST
    const enviarReporteAPI = async (datosReporte) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No se encontró el token de autenticación');
            }

            console.log('Enviando reporte a la API:', datosReporte);

            const response = await fetch('http://localhost:5000/api/reportes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datosReporte)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            console.log('Respuesta del servidor (reporte):', data);

            if (!data.success) {
                throw new Error(data.message || 'Error al crear el reporte');
            }

            // Validación específica del ID del reporte
            if (!data.data || typeof data.data.reporte_id === 'undefined') {
                console.error('Respuesta del servidor sin ID de reporte:', data);
                throw new Error('La respuesta del servidor no incluye el ID del reporte');
            }

            const reporteId = Number(data.data.reporte_id);
            if (isNaN(reporteId) || reporteId <= 0) {
                console.error('ID de reporte inválido:', reporteId);
                throw new Error('ID de reporte inválido recibido del servidor');
            }

            console.log('ID del reporte creado:', reporteId);
            return {
                ...data.data,
                reporte_id: reporteId
            };
        } catch (error) {
            console.error('Error en enviarReporteAPI:', error);
            throw error;
        }
    };

    const enviarRecursosAPI = async (recursos, reporte_id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No se encontró el token de autenticación');
            }

            console.log('Enviando recursos:', recursos);

            const recursosCreados = await Promise.all(recursos.map(async (recurso) => {
                const response = await fetch('http://localhost:5000/api/recursos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        nombre: recurso.nombre_articulo,
                        cantidad: recurso.cantidad
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Error al crear el recurso ${recurso.nombre_articulo}`);
                }

                const data = await response.json();
                console.log('Respuesta del servidor (recurso):', data);

                if (!data.success) {
                    throw new Error(data.message || `Error al crear el recurso ${recurso.nombre_articulo}`);
                }

                // Asegurarse de que tenemos un ID válido
                const recursoId = data.data.recurso_id;
                if (!recursoId) {
                    throw new Error(`No se recibió recurso_id para el recurso ${recurso.nombre_articulo}`);
                }

                return {
                    ...data.data,
                    nombre_articulo: recurso.nombre_articulo,
                    cantidad: recurso.cantidad,
                    recurso_id: Number(recursoId)
                };
            }));

            return recursosCreados;
        } catch (error) {
            console.error('Error en enviarRecursosAPI:', error);
            throw error;
        }
    };

    const asignarRecursosAReporte = async (reporte_id, recursos) => {
        try {
            console.log('Asignando recursos al reporte:', { reporte_id, recursos });

            const relaciones = await Promise.all(recursos.map(async (recurso) => {
                // Asegurarse de que tenemos los IDs necesarios
                const recursoId = recurso.recurso_id;
                if (!recursoId || !reporte_id) {
                    console.error('Datos de relación inválidos:', { recurso, reporte_id });
                    throw new Error(`Faltan IDs necesarios para la relación: reporte_id=${reporte_id}, recurso_id=${recursoId}`);
                }

                const relacionData = {
                    reporte_id: Number(reporte_id),
                    recurso_id: Number(recursoId)
                };

                console.log('Enviando relación:', relacionData);

                const response = await fetch('http://localhost:5000/api/reporte-recurso', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(relacionData)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Error al crear la relación reporte-recurso');
                }

                const data = await response.json();
                console.log('Respuesta del servidor (relación):', data);

                if (!data.success) {
                    throw new Error(data.message || 'Error al crear la relación reporte-recurso');
                }

                return data.data;
            }));

            return relaciones;
        } catch (error) {
            console.error('Error en asignarRecursosAReporte:', error);
            throw error;
        }
    };

    const prepararDatosReporte = () => {
        try {
            // Validar datos requeridos
            if (!userId || !formik.values.nombreIncidente || !formik.values.extension || 
                !selectedClima || selectedClima.length === 0 || !formik.values.apoyoExterno ||
                formik.values.controlado === undefined || formik.values.controlado === null) {
                throw new Error('Faltan campos requeridos');
            }

            // Preparar recursos seleccionados
            const recursos = selectedEquipos
                .filter(nombre => equipoQuantities[nombre] > 0)
                .map(nombre => ({
                    nombre_articulo: nombre,
                    cantidad: equipoQuantities[nombre] || 0
                }));

            const datosPreparados = {
                usuario_id: userId,
                nombre_incidente: formik.values.nombreIncidente,
                controlado: formik.values.controlado,
                extension: formik.values.extension,
                condiciones_clima: selectedClima.join(', '),
                numero_bomberos: parseInt(formik.values.numeroBomberos) || 0,
                necesita_mas_bomberos: formik.values.necesitaMasBomberos || false,
                apoyo_externo: formik.values.apoyoExterno,
                comentario_adicional: formik.values.comentarioAdicional || '',
                recursos: recursos
            };

            console.log('Datos preparados:', datosPreparados);
            return datosPreparados;
        } catch (error) {
            console.error('Error al preparar datos:', error);
            throw new Error(`Error al preparar datos: ${error.message}`);
        }
    };

    const confirmSubmit = async () => {
        try {
            setApiError(null);
            
            // Verificar autenticación
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No se encontró token de autenticación. Por favor inicie sesión nuevamente.');
                setShowConfirmModal(false);
                router.push('/');
                return;
            }

            // Validar formulario
            try {
                const errors = await formik.validateForm();
                if (Object.keys(errors).length > 0) {
                    setError('Por favor complete todos los campos requeridos correctamente');
                    setShowConfirmModal(false);
                    return;
                }
            } catch (validationError) {
                console.error('Error en la validación del formulario:', validationError);
                setError('Error al validar el formulario');
                setShowConfirmModal(false);
                return;
            }

            // Validaciones adicionales
            if (!selectedClima || selectedClima.length === 0) {
                setError('Debe seleccionar al menos una condición climática');
                setShowConfirmModal(false);
                return;
            }

            if (isNaN(formik.values.numeroBomberos) || formik.values.numeroBomberos < 0) {
                setError('El número de bomberos debe ser un número válido mayor o igual a 0');
                setShowConfirmModal(false);
                return;
            }

            // Preparar datos
            let datosCompletos;
            try {
                datosCompletos = prepararDatosReporte();
            } catch (prepError) {
                console.error('Error al preparar datos:', prepError);
                setError(prepError.message);
                setShowConfirmModal(false);
                return;
            }

            const { recursos, ...datosReporte } = datosCompletos;

            // Enviar reporte
            let reporteCreado;
            try {
                reporteCreado = await enviarReporteAPI(datosReporte);
                if (!reporteCreado || !reporteCreado.reporte_id) {
                    throw new Error('No se recibió un reporte_id válido del reporte creado');
                }
                console.log('Reporte creado exitosamente con ID:', reporteCreado.reporte_id);
            } catch (reporteError) {
                console.error('Error al crear reporte:', reporteError);
                setError(`Error al crear reporte: ${reporteError.message}`);
                setShowConfirmModal(false);
                return;
            }

            // Procesar recursos si existen
            if (recursos && recursos.length > 0) {
                try {
                    // Crear recursos
                    const recursosCreados = await enviarRecursosAPI(recursos, reporteCreado.reporte_id);
                    console.log('Recursos creados:', recursosCreados);

                    // Verificar que los recursos se crearon correctamente
                    if (!recursosCreados || !Array.isArray(recursosCreados) || recursosCreados.length === 0) {
                        throw new Error('No se pudieron crear los recursos');
                    }

                    // Verificar que cada recurso tenga un ID válido
                    const recursosValidos = recursosCreados.every(r => r && r.recurso_id);
                    if (!recursosValidos) {
                        throw new Error('Algunos recursos no tienen recurso_id válido');
                    }

                    // Crear relaciones
                    const relaciones = await asignarRecursosAReporte(reporteCreado.reporte_id, recursosCreados);
                    console.log('Relaciones creadas:', relaciones);
                } catch (recursosError) {
                    console.error('Error al procesar recursos:', recursosError);
                    setError(`Reporte creado pero hubo un error con los recursos: ${recursosError.message}`);
                    setShowConfirmModal(false);
                    return;
                }
            }

            // Crear comunarios si existen
            if (communities.length > 0) {
                try {
                    console.log('Verificando equipo del usuario:', { userId, userTeamId });
                    
                    if (!userTeamId) {
                        const error = new Error('No se pueden registrar comunarios porque el usuario no pertenece a ningún equipo');
                        console.log('Error: Usuario sin equipo', { userId, teamsData });
                        throw error;
                    }

                    console.log('Iniciando creación de comunarios para el equipo:', userTeamId);

                    const results = await Promise.all(
                        communities.map(async (comunario) => {
                            if (!comunario.nombre || !comunario.edad) {
                                console.log('Saltando comunario con datos incompletos:', comunario);
                                return null;
                            }
                            
                            try {
                                console.log('Intentando crear comunario:', {
                                    nombre: comunario.nombre,
                                    edad: comunario.edad,
                                    equipoId: userTeamId
                                });

                                const response = await createComunario({
                                    variables: {
                                        input: {
                                            nombre: comunario.nombre,
                                            edad: parseInt(comunario.edad),
                                            Equipoid: userTeamId
                                        }
                                    }
                                });

                                console.log('Comunario creado exitosamente:', response.data);
                                return response.data;
                            } catch (error) {
                                console.log('Error al crear comunario individual:', {
                                    nombre: comunario.nombre,
                                    error: error.message
                                });
                                return null;
                            }
                        })
                    );

                    const createdComunarios = results.filter(result => result !== null);
                    console.log('Resumen de creación de comunarios:', {
                        total: communities.length,
                        creados: createdComunarios.length,
                        fallidos: communities.length - createdComunarios.length
                    });

                    if (createdComunarios.length === 0 && communities.length > 0) {
                        throw new Error('No se pudo crear ningún comunario');
                    }

                } catch (error) {
                    console.log('Error en el proceso de creación de comunarios:', {
                        message: error.message,
                        stack: error.stack
                    });
                    setError(error.message || 'Se creó el reporte pero hubo un error al registrar los comunarios');
                    setShowConfirmModal(false);
                    return;
                }
            }

            // Éxito
            setSuccess(true);
            setMensaje("Reporte y recursos enviados exitosamente");
            setShowConfirmModal(false);

            // Resetear formulario
            formik.resetForm();
            setPosition(null);
            setSelectedClima([]);
            setSelectedEquipos([]);
            setEquipoQuantities({});
            setCommunities([]);

            // Redireccionar
            setTimeout(() => {
                setMensaje(null);
                router.push('/Homepage');
            }, 2000);

        } catch (error) {
            console.error('Error general en confirmSubmit:', error);
            setError(error.message || 'Error inesperado al enviar el reporte');
            setShowConfirmModal(false);
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-md py-4 px-5 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center space-x-2">
                    <LogoIcon />

                </div>

            </header>

            {/* ---------- MAIN ---------- */}
            <main className="flex-1 p-6 md:py-12">
                <ConfirmReportModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmSubmit}
                    formData={formik.values}
                    loading={loading}
                    selectedClima={selectedClima}
                    selectedEquipos={selectedEquipos}
                    apiError={apiError}
                />
                {/* ---------- HERO ---------- */}
                <div className="relative rounded-xl overflow-hidden mb-8 max-w-4xl mx-auto">
                    <div className="absolute inset-0 bg-orange-600 opacity-90" />
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage:
                                'url("https://images.unsplash.com/photo-1601059405510-bfbadd3bf7c3")',
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    />
                    <div className="relative py-8 px-6 text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">Reporte de Estado de Incendio</h2>
                        <p className="text-amber-100">
                            Completa este formulario como Usuario para reportar un incendio en curso
                        </p>
                    </div>
                </div>

                {/* ---------- ALERTAS ---------- */}
                <section className="max-w-4xl mx-auto">
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm flex items-start">
                            <svg
                                className="h-5 w-5 mr-2 text-red-500"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-sm flex items-start">
                            <svg
                                className="h-5 w-5 mr-2 text-green-500"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p>Reporte enviado con éxito. Redirigiendo…</p>
                        </div>
                    )}

                    {/* ---------- FORM ---------- */}
                    <form
                        onSubmit={formik.handleSubmit}
                        className="bg-white rounded-xl shadow-lg overflow-hidden"
                    >
                        {/* ----- FORM HEADER ----- */}
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                            <h3 className="text-xl font-semibold">Formulario de Reporte</h3>
                            <p className="text-sm text-amber-100 mt-1">
                                Todos los campos marcados con * son obligatorios
                            </p>
                        </div>

                        {/* ----- FORM BODY ----- */}
                        <div className="p-6 space-y-10">
                            {/* === DATOS DEL INCIDENTE === */}
                            <section>
                                <header className="flex items-center mb-4">
                                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                                        {/* ícono */}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-orange-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-800">
                                        Datos del Incidente
                                    </h3>
                                </header>

                                {/* Nombre incidente */}
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">
                                        Nombre del Incidente *
                                    </label>
                                    <input
                                        type="text"
                                        id="nombreIncidente"
                                        name="nombreIncidente"
                                        maxLength={100}
                                        placeholder="Ej: Incendio en la Comunidad X"
                                        className={`w-full border rounded-lg p-3 focus:ring focus:ring-orange-200 focus:border-orange-500 transition-all ${
                                            formik.touched.nombreIncidente && formik.errors.nombreIncidente
                                                ? "border-red-300 bg-red-50"
                                                : "border-gray-300"
                                        }`}
                                        {...formik.getFieldProps("nombreIncidente")}
                                    />
                                    <div className="flex justify-between">
                                        {formik.touched.nombreIncidente && formik.errors.nombreIncidente ? (
                                            <p className="text-red-500 text-sm mt-1">
                                                {formik.errors.nombreIncidente}
                                            </p>
                                        ) : <div />} {/* Espacio vacío para mantener el layout */}
                                        <p className="text-gray-500 text-sm mt-1 text-right">
                                            {formik.values.nombreIncidente.length}/100
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* === ESTADO DEL INCENDIO === */}
                            <section>
                                <header className="flex items-center mb-4">
                                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-orange-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-800">
                                        Estado del Incendio
                                    </h3>
                                </header>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Extensión */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <label className="block font-medium text-gray-700 mb-1">
                                                Extensión del área afectada *
                                            </label>
                                            <select
                                                id="extension"
                                                name="extension"
                                                className={`w-full border rounded-lg p-3 bg-white focus:ring focus:ring-orange-200 focus:border-orange-500 transition-all ${
                                                    formik.touched.extension && formik.errors.extension
                                                        ? "border-red-300 bg-red-50"
                                                        : "border-gray-300"
                                                }`}
                                                {...formik.getFieldProps("extension")}
                                            >
                                                <option value="">Seleccione uno</option>
                                                <option value="Muy pequeño (menos de 1 hectárea)">
                                                    Muy pequeño (menos de 1 ha)
                                                </option>
                                                <option value="Mediano (1-5 hectáreas)">
                                                    Mediano (1-5 ha)
                                                </option>
                                                <option value="Grande (más de 5 hectáreas)">
                                                    Grande (más de 5 ha)
                                                </option>
                                            </select>
                                            {formik.touched.extension && formik.errors.extension ? (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {formik.errors.extension}
                                                </p>
                                            ) : null}
                                        </div>

                                        {/* Condiciones del clima */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <label className="block font-medium text-gray-700 mb-2">Condiciones del clima *</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <label className="flex items-center bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        name="clima"
                                                        value="Calor"
                                                        className="mr-2 text-orange-500"
                                                        onChange={handleClimaChange}
                                                        checked={selectedClima.includes("Calor")}
                                                    />
                                                    <span>Calor</span>
                                                </label>
                                                <label className="flex items-center bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        name="clima"
                                                        value="Viento fuerte"
                                                        className="mr-2 text-orange-500"
                                                        onChange={handleClimaChange}
                                                        checked={selectedClima.includes("Viento fuerte")}
                                                    />
                                                    <span>Viento</span>
                                                </label>
                                                <label className="flex items-center bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        name="clima"
                                                        value="Lluvia"
                                                        className="mr-2 text-orange-500"
                                                        onChange={handleClimaChange}
                                                        checked={selectedClima.includes("Lluvia")}
                                                    />
                                                    <span>Lluvia</span>
                                                </label>
                                            </div>
                                            {formik.touched.condicionesClima && formik.errors.condicionesClima ? (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {formik.errors.condicionesClima}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <label className="block font-medium text-gray-700 mb-3">
                                            ¿Está controlado el incendio? *
                                        </label>
                                        <div className="grid grid-cols-1 gap-4">
                                            <label className="flex items-center justify-center w-full bg-white p-4 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="controlado"
                                                    value="true"
                                                    className="mr-3 text-orange-500 focus:ring-orange-500"
                                                    onChange={() => formik.setFieldValue("controlado", true)}
                                                    checked={formik.values.controlado === true}
                                                />
                                                <span className="font-medium text-center">
                                                    Sí, está bajo control
                                                </span>
                                            </label>

                                            <label className="flex items-center justify-center w-full bg-white p-4 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="controlado"
                                                    value="false"
                                                    className="mr-3 text-orange-500 focus:ring-orange-500"
                                                    onChange={() => formik.setFieldValue("controlado", false)}
                                                    checked={formik.values.controlado === false}
                                                />
                                                <span className="font-medium text-center">
                                                    No, fuera de control
                                                </span>
                                            </label>
                                        </div>
                                        {formik.touched.controlado && formik.errors.controlado ? (
                                            <p className="text-red-500 text-sm mt-2">
                                                {formik.errors.controlado}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </section>

                            {/* === RECURSOS DISPONIBLES === */}
                            <section>
                                <header className="flex items-center mb-4">
                                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-orange-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-800">
                                        Recursos Disponibles
                                    </h3>
                                </header>

                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <div className="grid grid-cols-1 gap-4">
                                        {loadingInventory ? (
                                            <div className="flex items-center justify-center py-8">
                                                <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        ) : inventory.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4">No hay recursos disponibles</p>
                                        ) : (
                                            inventory.map(item => (
                                                <div key={item.id_articulo} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <input
                                                                type="checkbox"
                                                                name="equipo"
                                                                value={item.nombre_articulo}
                                                                className="h-5 w-5 text-orange-500 focus:ring-orange-500 rounded"
                                                                onChange={handleEquipoChange}
                                                                checked={selectedEquipos.includes(item.nombre_articulo)}
                                                            />
                                                            <span className="font-medium text-gray-700">{item.nombre_articulo}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(item.nombre_articulo, Math.max(0, (equipoQuantities[item.nombre_articulo] || 0) - 1))}
                                                                disabled={!selectedEquipos.includes(item.nombre_articulo)}
                                                                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-orange-100 disabled:opacity-50 disabled:hover:bg-gray-100 transition-colors"
                                                            >
                                                                <span className="text-xl font-bold">−</span>
                                                            </button>
                                                            <span className="w-8 text-center font-medium text-gray-700">
                                                                {equipoQuantities[item.nombre_articulo] || 0}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(item.nombre_articulo, (equipoQuantities[item.nombre_articulo] || 0) + 1)}
                                                                disabled={!selectedEquipos.includes(item.nombre_articulo)}
                                                                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-orange-100 disabled:opacity-50 disabled:hover:bg-gray-100 transition-colors"
                                                            >
                                                                <span className="text-xl font-bold">+</span>
                                                            </button>
                                                            <span className="text-sm text-gray-500 min-w-[3rem]">{item.medida_abreviada}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* === BOMBEROS Y NECESIDAD === */}
                            <section>
                                <header className="flex items-center mb-4">
                                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-orange-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-800">
                                        Bomberos y Necesidad
                                    </h3>
                                </header>

                                <div className="mt-6 space-y-6">
                                    {/* Número de bomberos */}
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">
                                            Número de bomberos presentes *
                                        </label>
                                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                            {/* ícono */}
                              <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                              >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </span>
                                            <input
                                                type="number"
                                                id="numeroBomberos"
                                                name="numeroBomberos"
                                                min="0"
                                                className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-r-lg border focus:ring focus:ring-orange-200 focus:border-orange-500 ${
                                                    formik.touched.numeroBomberos &&
                                                    formik.errors.numeroBomberos
                                                        ? "border-red-300 bg-red-50"
                                                        : "border-gray-300"
                                                }`}
                                                {...formik.getFieldProps("numeroBomberos")}
                                            />
                                        </div>
                                        {formik.touched.numeroBomberos &&
                                        formik.errors.numeroBomberos ? (
                                            <p className="text-red-500 text-sm mt-1">
                                                {formik.errors.numeroBomberos}
                                            </p>
                                        ) : null}
                                    </div>

                                    {/* Necesita más bomberos */}
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-2">
                                            ¿Necesita más bomberos? *
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Sí */}
                                            <label className="flex items-center justify-center bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="necesitaMasBomberos"
                                                    value="true"
                                                    className="mr-2 text-orange-500"
                                                    onChange={() =>
                                                        formik.setFieldValue("necesitaMasBomberos", true)
                                                    }
                                                    checked={formik.values.necesitaMasBomberos === true}
                                                />
                                                <span className="font-medium text-center">
                                          Sí, se necesita apoyo
                                        </span>
                                            </label>

                                            {/* No */}
                                            <label className="flex items-center justify-center bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="necesitaMasBomberos"
                                                    value="false"
                                                    className="mr-2 text-orange-500"
                                                    onChange={() =>
                                                        formik.setFieldValue("necesitaMasBomberos", false)
                                                    }
                                                    checked={formik.values.necesitaMasBomberos === false}
                                                />
                                                <span className="font-medium text-center">
                                          No, suficiente personal
                                        </span>
                                            </label>
                                        </div>
                                        {formik.touched.necesitaMasBomberos &&
                                        formik.errors.necesitaMasBomberos ? (
                                            <p className="text-red-500 text-sm mt-1">
                                                {formik.errors.necesitaMasBomberos}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </section>

                            {/* === COMENTARIO ADICIONAL === */}
                            <section>
                                <label className="block font-medium text-gray-700 mb-1">
                                    Comentario adicional (opcional)
                                </label>
                                <div className="relative">
                <textarea
                    id="comentarioAdicional"
                    name="comentarioAdicional"
                    rows="4"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring focus:ring-orange-200 focus:border-orange-500"
                    placeholder="Información adicional relevante sobre el incidente"
                    maxLength="300"
                    {...formik.getFieldProps("comentarioAdicional")}
                />
                <span className="absolute bottom-3 right-3 text-gray-400 text-sm">
                  {formik.values.comentarioAdicional.length} / 300
                </span>
                                </div>
                            </section>

                            {/* === APOYO EXTERNO === */}
                            <section>
                                <label className="block font-medium text-gray-700 mb-2">
                                    ¿Qué tipo de apoyo externo recibe? *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="flex items-center justify-center bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="apoyoExterno"
                                            value="Ninguno"
                                            className="mr-2 text-orange-500"
                                            onChange={formik.handleChange}
                                            checked={formik.values.apoyoExterno === "Ninguno"}
                                        />
                                        <span className="font-medium">Ninguno</span>
                                    </label>

                                    <label className="flex items-center justify-center bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="apoyoExterno"
                                            value="Policía"
                                            className="mr-2 text-orange-500"
                                            onChange={formik.handleChange}
                                            checked={formik.values.apoyoExterno === "Policía"}
                                        />
                                        <span className="font-medium">Policía</span>
                                    </label>

                                    <label className="flex items-center justify-center bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="apoyoExterno"
                                            value="Ejército"
                                            className="mr-2 text-orange-500"
                                            onChange={formik.handleChange}
                                            checked={formik.values.apoyoExterno === "Ejército"}
                                        />
                                        <span className="font-medium">Ejército</span>
                                    </label>

                                    <label className="flex items-center justify-center bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-orange-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="apoyoExterno"
                                            value="Otros"
                                            className="mr-2 text-orange-500"
                                            onChange={formik.handleChange}
                                            checked={formik.values.apoyoExterno === "Otros"}
                                        />
                                        <span className="font-medium">Otros</span>
                                    </label>
                                </div>
                                {formik.touched.apoyoExterno && formik.errors.apoyoExterno ? (
                                    <p className="text-red-500 text-sm mt-1">{formik.errors.apoyoExterno}</p>
                                ) : null}
                            </section>
                                    
                            {/* === COMUNARIOS LOCALES === */}
                            <section>
                                <header className="flex items-center mb-4">
                                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-orange-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-800">
                                        Comunarios Locales
                                    </h3>
                                </header>
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <p className="text-gray-600 mb-4">Registre a los comunarios que se unirán al equipo en campo (opcional)</p>
                                    {communities.map((comm, idx) => (
                                        <div key={idx} className="flex items-end gap-3 mb-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre del comunario"
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    value={comm.nombre}
                                                    onChange={(e) => updateCommunity(idx, 'nombre', e.target.value)}
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    placeholder="Edad"
                                                    value={comm.edad}
                                                    onChange={(e) => updateCommunity(idx, 'edad', e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCommunity(idx)}
                                                className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addCommunity}
                                        className="mt-2 flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Añadir comunario
                                    </button>
                                </div>
                            </section>

                            {/* === BOTONES === */}
                            <div className="flex flex-wrap justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => router.push("/Homepage")}
                                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center mb-4 md:mb-0"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 17l-5-5m0 0l5-5m-5 5h12"
                                        />
                                    </svg>
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Enviando…
                                        </>
                                    ) : (
                                        <>
                                            Enviar Reporte
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 ml-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                                />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </section>
            </main>

            {/* ---------- FOOTER ---------- */}
            <footer className="bg-gray-800 text-white py-6">
                <div className="container mx-auto px-6 text-center text-sm">
                    © {new Date().getFullYear()} Alas Chiquitanas. Todos los derechos
                    reservados.
                </div>
            </footer>

            {/* ---------- MODAL ÉXITO ---------- */}
            {mensaje && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white border-l-4 border-green-500 text-green-700 px-8 py-6 rounded-xl shadow-2xl animate-fade-in-out max-w-sm w-full">
                        <div className="flex items-center">
                            <div className="bg-green-100 p-2 rounded-full mr-3">
                                <svg
                                    className="h-6 w-6 text-green-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <p className="text-lg font-medium">{mensaje}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}

export default UsuariosIncidentForm;