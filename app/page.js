"use client"
import Index from './Index/Index';
import { ApolloProvider, useMutation, useApolloClient } from '@apollo/client';
import client from '../app/config/apollo';
import { useEffect, useState } from 'react';
import { CREAR_REPORTE } from './Endpoints/endpoints_graphql';

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

// Componente para manejar la sincronización
function SyncManager() {
    const [crearReporte] = useMutation(CREAR_REPORTE);
    const [syncInProgress, setSyncInProgress] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const apolloClient = useApolloClient();

    // Función para sincronizar reportes pendientes
    const syncPendingReports = async () => {
        if (syncInProgress || !window.navigator.onLine) return;
        
        // Evitar sincronizaciones muy frecuentes
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

    useEffect(() => {
        let mounted = true;
        let syncTimeout;

        const handleOnline = () => {
            if (!mounted) return;
            // Verificar que Apollo Client esté listo antes de sincronizar
            if (!syncInProgress && apolloClient.link) {
                clearTimeout(syncTimeout);
                syncTimeout = setTimeout(() => {
                    if (mounted && !syncInProgress) {
                        syncPendingReports();
                    }
                }, 2000); // Damos más tiempo para asegurar que todo esté inicializado
            }
        };

        // Configurar el listener para cambios en la conexión
        window.addEventListener('online', handleOnline);

        // Intentar sincronizar al inicio solo si tenemos conexión y Apollo está listo
        if (window.navigator.onLine && apolloClient.link && !syncInProgress && !lastSyncTime) {
            syncTimeout = setTimeout(() => {
                if (mounted && !syncInProgress) {
                    syncPendingReports();
                }
            }, 2000);
        }

        return () => {
            mounted = false;
            clearTimeout(syncTimeout);
            window.removeEventListener('online', handleOnline);
        };
    }, [apolloClient.link]); // Dependemos de apolloClient.link para saber cuando está listo

    return null; // Este componente no renderiza nada
}

function UsuarioPage() {
    return(
        <ApolloProvider client={client}>
            <SyncManager />
            <Index />
        </ApolloProvider>
    );
}

export default UsuarioPage;