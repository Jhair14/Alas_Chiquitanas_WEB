"use client"
import React, {useState, useEffect, useRef} from 'react';
import { useMutation } from '@apollo/client';
import { useFormik } from "formik";
import * as Yup from 'yup';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../../globals.css';
import { useRouter } from 'next/navigation';
import { CREAR_REPORTE } from '../../Endpoints/endpoints_graphql';

// Configuración de IndexedDB
const DB_NAME = 'AlasChiquitanasDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingReports';

// Función para inicializar IndexedDB
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

// Función para guardar reporte en IndexedDB
const saveReportOffline = async (report) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add({
            ...report,
            timestamp: new Date().toISOString(),
            synced: false
        });

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Función para obtener reportes pendientes
const getPendingReports = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Función para eliminar un reporte sincronizado
const deleteReport = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

let ColorIcon = L.Icon.extend({
    options: {
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        shadowSize: [41, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }
});

const yellowIcon = new ColorIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png'
});

const orangeIcon = new ColorIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png'
});

const redIcon = new ColorIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
});

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const tiposIncendio = [
    { value: "Incendio de pastizales", label: "Pastizal", color: "bg-white-50", icon: "🌾" },
    { value: "Incendio en una casa", label: "Casa", color: "bg-white-50", icon: "🏠" },
    { value: "Incendio forestal", label: "Forestal", color: "bg-white-50", icon: "🌲" }
];



function MapClickHandler({ onPick }) {
    useMapEvents({
        click: (e) => onPick(e.latlng),
    });
    return null;
}


function DynamicMarker({ position, gravedadSeleccionada }) {
    // Determinar qué icono usar según la gravedad seleccionada
    const getIconForSeverity = (severity) => {
        switch(severity) {
            case 'Bajo':
                return yellowIcon;
            case 'Mediano':
                return orangeIcon;
            case 'Alto':
                return redIcon;
            default:
                return new L.Icon.Default(); // Icono predeterminado si no hay selección
        }
    };

    return (
        <Marker
            position={position}
            icon={getIconForSeverity(gravedadSeleccionada)}
        />
    );
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, formData, position, loading }) => {
    if (!isOpen) return null;

    // Función para obtener el icono según la gravedad
    const getSeverityIcon = (severity) => {
        switch(severity) {
            case 'Bajo': return '🟡';
            case 'Mediano': return '🟠';
            case 'Alto': return '🔴';
            default: return '⚪';
        }
    };

    // Función para obtener el tipo de incendio con icono
    const getFireType = (type) => {
        const tipo = tiposIncendio.find(t => t.value === type);
        return tipo ? `${tipo.icon} ${tipo.label}` : type;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-scale-in">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-gray-800">Confirmar Reporte</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <h4 className="font-medium text-orange-800 mb-2">Resumen del Reporte</h4>

                            <div className="grid gap-3">
                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-32">Reportante:</span>
                                    <span>{formData.nombre_reportante}</span>
                                </div>

                                {formData.telefono_contacto && (
                                    <div className="flex items-start">
                                        <span className="font-medium text-gray-700 w-32">Teléfono:</span>
                                        <span>{formData.telefono_contacto}</span>
                                    </div>
                                )}

                                {formData.nombre_lugar && (
                                    <div className="flex items-start">
                                        <span className="font-medium text-gray-700 w-32">Lugar:</span>
                                        <span>{formData.nombre_lugar}</span>
                                    </div>
                                )}

                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-32">Tipo:</span>
                                    <span>{getFireType(formData.tipo_incendio)}</span>
                                </div>

                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-32">Gravedad:</span>
                                    <span>{getSeverityIcon(formData.gravedad_incendio)} {formData.gravedad_incendio}</span>
                                </div>

                                {formData.comentario_adicional && (
                                    <div className="flex items-start">
                                        <span className="font-medium text-gray-700 w-32">Comentario:</span>
                                        <span className="text-gray-600">{formData.comentario_adicional}</span>
                                    </div>
                                )}

                                <div className="flex items-start">
                                    <span className="font-medium text-gray-700 w-32">Ubicación:</span>
                                    <span>
                    {position ?
                        `Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}` :
                        'No especificada'}
                  </span>
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm">
                            Por favor verifica que toda la información sea correcta antes de enviar.
                        </p>
                    </div>
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

const IncidentForm = () => {
    const router = useRouter();
    const [position, setPosition] = useState(null);
    const [isOnline, setIsOnline] = useState(window.navigator.onLine);
    const [syncInProgress, setSyncInProgress] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const handleLocationPick = async (latlng) => {
        setPosition(latlng);                              // coloca el marcador
        if (isOnline) {
            const nombre = await obtenerNombreLugar(latlng.lat, latlng.lng);
            formik.setFieldValue("nombre_lugar", nombre);     // rellena el input
        } else {
            formik.setFieldValue("nombre_lugar", "Sin conexión - Ubicación pendiente");
        }
    };

    const mapaRef = useRef(null);
    const mapInstanceRef = useRef(null);

    const [mensaje, setMensaje] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // Obtiene el nombre de la población más cercana con Nominatim
    const obtenerNombreLugar = async (lat, lng) => {
        try {
            if (!isOnline) {
                return "Sin conexión - Ubicación pendiente";
            }
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await res.json();
            return (
                data?.address?.city ||
                data?.address?.town ||
                data?.address?.village ||
                data?.address?.hamlet ||
                "Desconocido"
            );
        } catch (err) {
            return "Ubicación Desconocida";
        }
    };


    // Mutación Apollo Client
    const [crearReporte, { loading }] = useMutation(CREAR_REPORTE);

    useEffect(() => {
        // Cleanup map initialization on unmount to avoid reinitialization
        return () => {
            const mapContainer = document.getElementById("map");
            if (mapContainer) {
                mapContainer._leaflet_id = null;  // Reset the map container
            }
        };
    }, []);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    //logeeado
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    // Esquema de validación con Yup
    const validationSchema = Yup.object({
        nombre_reportante: Yup.string()
            .required('El nombre del reportante es obligatorio'),
        telefono_contacto: Yup.string()
            .matches(/^[0-9]*$/, 'Solo se permiten números')
            .nullable(),
        nombre_lugar: Yup.string(),
        tipo_incendio: Yup.string()
            .required('Debe seleccionar un tipo de incendio'),
        gravedad_incendio: Yup.string()
            .required('Debe seleccionar la gravedad del incendio'),
        comentario_adicional: Yup.string()
    });

    // Formik para manejar el formulario
    const formik = useFormik({
        initialValues: {
            nombre_reportante: '',
            telefono_contacto: '',
            nombre_lugar: '',
            tipo_incendio: '',
            gravedad_incendio: '',
            comentario_adicional: '',
        },
        validationSchema,
        onSubmit: async valores => {
            if (!position) {
                setMensaje('Por favor, marca la ubicación del incidente en el mapa');
                setTimeout(() => setMensaje(null), 3000);
                return;
            }
            setShowConfirmModal(true);
        }
    });

    // Función para sincronizar reportes pendientes
    const syncPendingReports = async () => {
        if (syncInProgress) return;
        
        // Evitar sincronizaciones muy frecuentes (mínimo 5 segundos entre cada intento)
        if (lastSyncTime && Date.now() - lastSyncTime < 5000) {
            console.log('Sincronización omitida: muy pronto desde la última sincronización');
            return;
        }
        
        try {
            setSyncInProgress(true);
            setLastSyncTime(Date.now());
            const pendingReports = await getPendingReports();
            
            for (const report of pendingReports) {
                try {
                    await crearReporte({
                        variables: {
                            input: {
                                nombre_reportante: report.nombre_reportante,
                                telefono_contacto: report.telefono_contacto,
                                nombre_lugar: report.nombre_lugar,
                                tipo_incendio: report.tipo_incendio,
                                gravedad_incendio: report.gravedad_incendio,
                                comentario_adicional: report.comentario_adicional,
                                lat: report.lat,
                                lng: report.lng,
                                fecha_hora: report.fecha_hora
                            }
                        }
                    });
                    
                    await deleteReport(report.id);
                    console.log('Reporte sincronizado exitosamente:', report.id);
                } catch (error) {
                }
            }
        } catch (error) {
            console.error('Error durante la sincronización:', error);
        } finally {
            setSyncInProgress(false);
        }
    };

    // Monitorear el estado de la conexión
    useEffect(() => {
        let mounted = true;
        let syncTimeout;
        
        const handleOnline = () => {
            if (!mounted) return;
            setIsOnline(true);
            // Solo sincronizar si no hay una sincronización en progreso
            if (!syncInProgress) {
                clearTimeout(syncTimeout);
                syncTimeout = setTimeout(() => {
                    if (mounted && !syncInProgress) {
                        syncPendingReports();
                    }
                }, 1000);
            }
        };
        
        const handleOffline = () => {
            if (!mounted) return;
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Intentar sincronizar al cargar solo si:
        // 1. Estamos online
        // 2. No hay una sincronización en progreso
        // 3. No se ha sincronizado recientemente
        if (window.navigator.onLine && !syncInProgress && !lastSyncTime) {
            syncTimeout = setTimeout(() => {
                if (mounted && !syncInProgress) {
                    syncPendingReports();
                }
            }, 1000);
        }

        return () => {
            mounted = false;
            clearTimeout(syncTimeout);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []); // Removemos lastSyncTime como dependencia para evitar re-suscripciones innecesarias

    // Modificar la función confirmSubmit
    const confirmSubmit = async () => {
        const reportData = {
            ...formik.values,
            lat: position.lat,
            lng: position.lng,
            fecha_hora: new Date().toISOString()
        };

        try {
            if (!isOnline) {
                // Guardar offline
                await saveReportOffline(reportData);
                setMensaje('Reporte guardado localmente. Se enviará cuando haya conexión.');
                setShowConfirmModal(false);
                formik.resetForm();
                setPosition(null);

                setTimeout(() => {
                    const token = localStorage.getItem("token");
                    router.push(token ? '/Homepage' : '/');
                    setMensaje(null);
                }, 2000);
                return;
            }

            // Enviar online
            const { data } = await crearReporte({
                variables: {
                    input: reportData
                }
            });

            setMensaje('Reporte enviado correctamente');
            setShowConfirmModal(false);
            formik.resetForm();
            setPosition(null);

            setTimeout(() => {
                const token = localStorage.getItem("token");
                router.push(token ? '/Homepage' : '/');
                setMensaje(null);
            }, 2000);

        } catch (error) {
            // Si hay error al enviar, intentar guardar offline
            try {
                await saveReportOffline(reportData);
                setMensaje('Reporte guardado localmente. Se enviará cuando haya conexión.');
                setShowConfirmModal(false);
                formik.resetForm();
                setPosition(null);

                setTimeout(() => {
                    const token = localStorage.getItem("token");
                    router.push(token ? '/Homepage' : '/');
                    setMensaje(null);
                }, 2000);
            } catch (offlineError) {
                setMensaje('Error al guardar el reporte: ' + offlineError.message);
                setTimeout(() => setMensaje(null), 3000);
            }
        }
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
            {/* ---------- HEADER ---------- */}
            <header className="bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-50">
                <LogoIcon />
            </header>

            {/* ---------- MAIN ---------- */}
            <main className="flex-1 p-6 md:py-12">
                <ConfirmModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmSubmit}
                    formData={formik.values}
                    position={position}
                    loading={loading}
                />

                {/* ---------- CARD FORM ---------- */}
                <section className="mx-auto w-full max-w-3xl bg-white p-8 rounded-2xl shadow-xl relative z-10 border border-orange-100">
                    {/* Title with decorative element */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e25822] to-[#ff7e47] flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <header className="text-center mb-8 relative">

                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-8 mb-1">
                            Reporte Rápido de Incendios
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-[#e25822] to-[#ff7e47] mx-auto mb-3"></div>
                        <p className="text-gray-600">
                            Para apoyo externo o testigos no registrados
                        </p>
                    </header>

                    {/* ---------- FORM ---------- */}
                    <form onSubmit={formik.handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Nombre */}
                            <div className="md:col-span-1">
                                <label className="block font-medium text-gray-700 mb-1">
                                    Nombre del reportante <span className="text-[#e25822]">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="nombre_reportante"
                                        type="text"
                                        placeholder="Ingrese su nombre completo"
                                        className={`w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all ${
                                            formik.touched.nombre_reportante &&
                                            formik.errors.nombre_reportante
                                                ? "border-red-400 bg-red-50"
                                                : "border-gray-300"
                                        }`}
                                        {...formik.getFieldProps("nombre_reportante")}
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                {formik.touched.nombre_reportante &&
                                    formik.errors.nombre_reportante && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formik.errors.nombre_reportante}
                                        </p>
                                    )}
                            </div>

                            {/* Teléfono */}
                            <div className="md:col-span-1">
                                <label className="block font-medium text-gray-700 mb-1">
                                    Teléfono de contacto
                                </label>
                                <div className="relative">
                                    <input
                                        id="telefono_contacto"
                                        type="tel"
                                        placeholder="Número de teléfono"
                                        className={`w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all ${
                                            formik.touched.telefono_contacto &&
                                            formik.errors.telefono_contacto
                                                ? "border-red-400 bg-red-50"
                                                : "border-gray-300"
                                        }`}
                                        {...formik.getFieldProps("telefono_contacto")}
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                    </div>
                                </div>
                                {formik.touched.telefono_contacto &&
                                    formik.errors.telefono_contacto && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formik.errors.telefono_contacto}
                                        </p>
                                    )}
                            </div>
                        </div>

                        {/* Nombre lugar */}
                        <div>
                            <label className="block font-medium text-gray-700 mb-1">
                                Nombre del lugar / comunidad
                            </label>
                            <div className="relative">
                                <input
                                    id="nombre_lugar"
                                    type="text"
                                    placeholder="Nombre del lugar o comunidad"
                                    className="w-full border p-3 pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all"
                                    {...formik.getFieldProps("nombre_lugar")}
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Mapa */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <label className="block font-medium text-gray-700 mb-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#e25822] mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                Ubicación del incendio <span className="text-[#e25822]">*</span>
                            </label>
                            <p className="text-sm text-gray-500 mb-2">Haz clic en el mapa para marcar la ubicación exacta</p>
                            <div className="h-72 w-full border rounded-lg overflow-hidden mb-2 shadow-inner">
                                <MapContainer
                                    center={[-17.8, -63.2]}
                                    zoom={6}
                                    id="map"
                                    style={{ height: "100%", width: "100%" }}
                                    minZoom={5}
                                    maxZoom={12}
                                    maxBounds={[
                                        [-30, -80],  // Suroeste
                                        [-5, -50]    // Noreste
                                    ]}
                                    maxBoundsViscosity={1.0}
                                    whenCreated={(map) => {
                                        // Asegurar que el mapa no se salga de los límites
                                        map.on('drag', function() {
                                            map.panInsideBounds([
                                                [-30, -80],
                                                [-5, -50]
                                            ], { animate: false });
                                        });
                                    }}
                                >
                                    <TileLayer
                                        attribution="&copy; OpenStreetMap"
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        noWrap={true}  // Evita que el mapa se repita
                                    />
                                    <MapClickHandler onPick={handleLocationPick} />
                                    {position && (
                                        <DynamicMarker
                                            position={position}
                                            gravedadSeleccionada={formik.values.gravedad_incendio}
                                        />
                                    )}
                                </MapContainer>
                            </div>
                            {position && (
                                <div className="text-sm text-green-600 flex items-center mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Ubicación marcada correctamente</span>
                                    <span className="ml-2 text-gray-700">
      ({position.lat.toFixed(4)}, {position.lng.toFixed(4)})
    </span>
                                </div>
                            )}

                            {!position && formik.submitCount > 0 && (
                                <p className="text-red-500 text-sm mt-1 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Debe marcar la ubicación en el mapa
                                </p>
                            )}
                        </div>

                        {/* Tipo de incendio */}
                        <div>
                            <label className="block font-medium text-gray-700 mb-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#e25822] mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                </svg>
                                Tipo de incendio <span className="text-[#e25822]">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {tiposIncendio.map((tipo) => (
                                    <button
                                        type="button"
                                        key={tipo.value}
                                        onClick={() =>
                                            formik.setFieldValue("tipo_incendio", tipo.value)
                                        }
                                        className={`flex flex-col items-center justify-center p-4 rounded-lg border shadow-sm transition-all duration-300 focus:outline-none hover:shadow-md
                                        ${
                                            formik.values.tipo_incendio === tipo.value
                                                ? "ring-2 ring-[#e25822] border-orange-200 scale-105 bg-orange-50"
                                                : "hover:bg-gray-50 border-gray-200"
                                        }`}
                                    >
                                        <span className="text-4xl mb-2">{tipo.icon}</span>
                                        <span className="font-medium text-gray-700">{tipo.label}</span>
                                    </button>
                                ))}
                            </div>
                            {formik.touched.tipo_incendio && formik.errors.tipo_incendio && (
                                <p className="text-red-500 text-sm mt-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {formik.errors.tipo_incendio}
                                </p>
                            )}
                        </div>

                        {/* Gravedad */}
                        <div>
                            <label className="block font-medium text-gray-700 mb-1 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#e25822] mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8-6a1 1 0 00-1 1v5a1 1 0 102 0V5a1 1 0 00-1-1z" />
                                </svg>
                                Gravedad del incendio <span className="text-[#e25822]">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="gravedad_incendio"
                                    className={`w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all appearance-none ${
                                        formik.touched.gravedad_incendio &&
                                        formik.errors.gravedad_incendio
                                            ? "border-red-400 bg-red-50"
                                            : "border-gray-300"
                                    }`}
                                    {...formik.getFieldProps("gravedad_incendio")}
                                >
                                    <option value="">Seleccione una</option>
                                    <option value="Bajo">Bajo</option>
                                    <option value="Mediano">Mediano</option>
                                    <option value="Alto">Alto</option>
                                </select>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            {formik.touched.gravedad_incendio &&
                                formik.errors.gravedad_incendio && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {formik.errors.gravedad_incendio}
                                    </p>
                                )}
                        </div>

                        {/* Comentario */}
                        <div className="relative">
                            <label className="block font-medium text-gray-700 mb-1 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Comentario adicional
                            </label>
                            <textarea
                                id="comentario_adicional"
                                rows="3"
                                placeholder="Describa detalles adicionales sobre el incidente..."
                                className="w-full border p-3 rounded-lg border-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all"
                                maxLength="100"
                                {...formik.getFieldProps("comentario_adicional")}
                            />
                            <span className="absolute bottom-3 right-3 text-gray-400 text-sm">
                                {formik.values.comentario_adicional ? formik.values.comentario_adicional.length : 0} / 100
                            </span>
                        </div>

                        <div className="text-center mt-6">
                            <button
                                type="submit"
                                className="bg-[#e25822] text-white px-6 py-2 rounded hover:bg-[#c43e11]"
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : 'Enviar Reporte'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>

            {/* ---------- TOAST ---------- */}
            {mensaje && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white border border-green-500 text-green-700 px-6 py-4 rounded-xl shadow-xl animate-fade-in-out max-w-sm text-center">
                        {mensaje}
                    </div>
                </div>
            )}

            {/* Indicador de estado de conexión */}
            <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'} text-white text-sm flex items-center gap-2 shadow-lg`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-200' : 'bg-yellow-200'}`}></div>
                {isOnline ? 'En línea' : 'Fuera de línea'}
                {syncInProgress && <span className="ml-2">Sincronizando...</span>}
            </div>
        </div>
    );

};

export default IncidentForm;