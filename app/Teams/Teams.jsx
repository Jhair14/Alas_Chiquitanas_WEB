"use client";
import React, { useState, useEffect } from "react";
import Footer from "../components/Footer";
import TeamHeader from "../Teams/TeamHeader";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from "framer-motion";
import {FaExclamationCircle, FaSignInAlt, FaSyncAlt, FaSearch, FaPlus, FaTrash, FaTimes, FaUserShield, FaMapMarkerAlt, FaCheckCircle, FaInfoCircle, FaSpinner, FaQuestionCircle} from "react-icons/fa";
import { OBTENER_EQUIPOS, OBTENER_USUARIOS, CREAR_EQUIPO, ACTUALIZAR_EQUIPO, AGREGAR_MIEMBROS_EQUIPO, ELIMINAR_MIEMBRO_EQUIPO, ELIMINAR_EQUIPO, TRANSFERIR_LIDERAZGO, CREAR_RECURSO,OBTENER_COMUNARIOS_POR_EQUIPO,
    CREAR_COMUNARIO_APOYO, ELIMINAR_COMUNARIO_APOYO } from '../Endpoints/endpoints_graphql';



const MapWithNoSSR = dynamic(() => import('../components/Map'), {
    ssr: false
});

const Notification = ({ type, message, onClose }) => {
    const bgColor = {
        success: "bg-green-100 border-green-500",
        error: "bg-red-100 border-red-500",
        info: "bg-blue-100 border-blue-500"
    };

    const iconColor = {
        success: "text-green-500",
        error: "text-red-500",
        info: "text-blue-500"
    };

    const icon = {
        success: <FaCheckCircle />,
        error: <FaExclamationCircle />,
        info: <FaInfoCircle />
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`fixed bottom-6 right-6 border-l-4 ${bgColor[type]} p-4 shadow-lg max-w-sm rounded-md z-50 flex items-start`}
        >
            <div className={`text-xl mr-3 ${iconColor[type]}`}>
                {icon[type]}
            </div>
            <div className="flex-1">
                <p className="text-gray-800">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="ml-4 text-gray-500 hover:text-gray-700"
            >
                <FaTimes />
            </button>
        </motion.div>
    );
};

const Teams = () => {
    // Estados principales
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [newGroupModal, setNewGroupModal] = useState(false);
    const [editGroupModal, setEditGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupLeader, setGroupLeader] = useState("");
    const [groupStatus, setGroupStatus] = useState("activo");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);
    const [notifications, setNotifications] = useState([]);

    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);

    const [confirmation, setConfirmation] = useState({
        show: false,
        message: "",
        onConfirm: null,
        onCancel: null
    });

    // Función para obtener el nombre del lugar usando Nominatim
    const obtenerNombreLugar = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await res.json();
            
            // Construir una descripción detallada del lugar
            const partes = [];
            if (data.address) {
                if (data.address.city) partes.push(data.address.city);
                if (data.address.town) partes.push(data.address.town);
                if (data.address.village) partes.push(data.address.village);
                if (data.address.municipality) partes.push(data.address.municipality);
                if (data.address.county) partes.push(data.address.county);
                if (data.address.state) partes.push(data.address.state);
            }
            
            return partes.length > 0 ? partes.join(", ") : "Ubicación desconocida";
        } catch (err) {
            console.error("Error al obtener nombre del lugar:", err);
            return "Error al obtener ubicación";
        }
    };

    // ───────── mochila (Paso 4) ─────────
    // Cambiar el estado inicial de backpack a un objeto vacío
    const [backpack, setBackpack] = useState({});
    const [communities, setCommunities] = useState([]);

    const [comunarios, setComunarios] = useState([]);
    const [loadingComunarios, setLoadingComunarios] = useState(false);
    const [comunariosPorEquipo, setComunariosPorEquipo] = useState({});
    const [locationNames, setLocationNames] = useState({});

    const addCommunity = () => {
        setCommunities(prev => [...prev, { nombre: '', edad: '', contacto: '' }]);
    };

    const removeCommunity = (index) => {
        setCommunities(prev => prev.filter((_, i) => i !== index));
    };

    const updateCommunity = (index, field, value) => {
        setCommunities(prev => {
            const newCommunities = [...prev];
            newCommunities[index][field] = value;
            return newCommunities;
        });
    };

    const mapOptions = {
        center: [-16.0, -70.0],   // Centro aproximado de Bolivia
        zoom: 5,
        minZoom: 3,
        maxZoom: 13,
        worldCopyJump: false,
        maxBounds: [
            [-30, -80], // S-O (lat, lng)
            [-5,  -50], // N-E
        ],
        maxBoundsViscosity: 0.7,  // "Rebote" al llegar al borde
    };


    // Estados para filtros de miembros
    const [memberSearchTerm, setMemberSearchTerm] = useState("");
    const [entityFilter, setEntityFilter] = useState("");
    const [trainingLevelFilter, setTrainingLevelFilter] = useState("");
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [uniqueEntities, setUniqueEntities] = useState([]);
    const [uniqueTrainingLevels, setUniqueTrainingLevels] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Obtener parámetros de URL
    const searchParams = useSearchParams();
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    const cargarTodosLosComunarios = async () => {
        try {
            // Obtener comunarios para cada equipo
            const promises = teamsData.obtenerEquipos.map(team => 
                obtenerComunariosPorEquipo({
                    variables: { Equipoid: team.id }
                })
            );

            const results = await Promise.all(promises);
            
            const agrupados = {};
            results.forEach((result, index) => {
                const equipoId = teamsData.obtenerEquipos[index].id;
                if (result.data?.obtenerComunariosApoyoPorEquipo) {
                    agrupados[equipoId] = result.data.obtenerComunariosApoyoPorEquipo;
                }
            });

            setComunariosPorEquipo(agrupados);
        } catch (error) {
            console.error("Error al cargar comunarios:", error);
            showNotification("error", "Error al cargar comunarios de apoyo");
        }
    };

    // Queries GraphQL
    const { data: teamsData, loading: teamsLoading, error: teamsError, refetch: refetchTeams } = useQuery(OBTENER_EQUIPOS, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        },
        fetchPolicy: 'network-only',
        onError: (error) => {
            if (error.graphQLErrors.some(e => e.message === 'No autorizado')) {
                window.location.href = '/Login';
            }
        }
    });

    const { data: usersData, loading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery(OBTENER_USUARIOS, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        },
        fetchPolicy: 'network-only',
        onError: (error) => {
            if (error.graphQLErrors.some(e => e.message === 'No autorizado')) {
                window.location.href = '/Login';
            }
        }
    });

    // Mutations GraphQL
    const [crearEquipo] = useMutation(CREAR_EQUIPO);
    const [actualizarEquipo] = useMutation(ACTUALIZAR_EQUIPO, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }
    });
    const [agregarMiembrosEquipo] = useMutation(AGREGAR_MIEMBROS_EQUIPO, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }
    });
    const [eliminarMiembroEquipo] = useMutation(ELIMINAR_MIEMBRO_EQUIPO, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }
    });
    const [eliminarEquipo] = useMutation(ELIMINAR_EQUIPO, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }
    });
    const [transferirLiderazgo] = useMutation(TRANSFERIR_LIDERAZGO, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }
    });

    const [crearRecurso] = useMutation(CREAR_RECURSO, {
        context: {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }
    });
    const [crearComunarioApoyo] = useMutation(CREAR_COMUNARIO_APOYO);
    const [eliminarComunarioApoyo] = useMutation(ELIMINAR_COMUNARIO_APOYO);
    const [obtenerComunariosPorEquipo, { refetch }] = useLazyQuery(OBTENER_COMUNARIOS_POR_EQUIPO);

    const maxStep = editGroupModal ? 5 : 4;



    const fetchInventory = async () => {
        setLoadingInventory(true);
        try {
            const response = await fetch('/api/inventario/stock');
            if (!response.ok) throw new Error('Error al cargar inventario');
            const data = await response.json();
            setInventory(data);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            showNotification("error", "Error al cargar el inventario");
        } finally {
            setLoadingInventory(false);
        }
    };

    // Mostrar notificación
    const showNotification = (type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const cargarComunarios = async () => {
        try {
            const { data } = await obtenerComunariosPorEquipo();
            if (data?.obtenerComunariosApoyoPorEquipo) {
                const agrupados = data.obtenerComunariosApoyoPorEquipo.reduce((acc, comunario) => {
                    const equipoId = comunario.Equipoid.id;
                    if (!acc[equipoId]) acc[equipoId] = [];
                    acc[equipoId].push(comunario);
                    return acc;
                }, {});
                setComunariosPorEquipo(agrupados);
            }
        } catch (error) {
            console.error("Error al cargar comunarios:", error);
            showNotification("error", "Error al cargar comunarios de apoyo");
        }
    };

    // Efecto para abrir modal cuando hay coordenadas
    useEffect(() => {
        if (lat && lng) {
            setSelectedLocation([parseFloat(lat), parseFloat(lng)]);
            setNewGroupModal(true);
            setCurrentStep(2);
        }
    }, [lat, lng]);

    // Filtrar equipos
    useEffect(() => {
        if (teamsData?.obtenerEquipos) {
            let result = teamsData.obtenerEquipos;

            if (searchTerm) {
                result = result.filter(team =>
                    team.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (team.id_lider_equipo?.nombre + " " + team.id_lider_equipo?.apellido).toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            if (statusFilter !== "all") {
                result = result.filter(team => team.estado === statusFilter);
            }

            setFilteredTeams(result);
        }
    }, [searchTerm, statusFilter, teamsData]);

    // Extraer entidades y niveles de entrenamiento únicos
    useEffect(() => {
        if (usersData?.obtenerUsuarios) {
            const entities = [...new Set(usersData.obtenerUsuarios
                .filter(user => user.entidad_perteneciente)
                .map(user => user.entidad_perteneciente))];

            const trainingLevels = [...new Set(usersData.obtenerUsuarios
                .filter(user => user.nivel_de_entrenamiento)
                .map(user => user.nivel_de_entrenamiento))];

            setUniqueEntities(entities);
            setUniqueTrainingLevels(trainingLevels);
        }
    }, [usersData]);

    useEffect(() => {
        if (usersData?.obtenerUsuarios && teamsData?.obtenerEquipos) {
            const usuariosEnEquipos = new Set();

            teamsData.obtenerEquipos.forEach(team => {
                if (editGroupModal && selectedTeam && team.id === selectedTeam.id) {
                    return;
                }

                // Add valid member IDs (filter out nulls first)
                team.miembros
                    .filter(miembro => miembro?.id_usuario?.id)
                    .forEach(miembro => {
                        usuariosEnEquipos.add(miembro.id_usuario.id);
                    });

                // Add team leader ID if it exists
                if (team.id_lider_equipo?.id) {
                    usuariosEnEquipos.add(team.id_lider_equipo.id);
                }
            });

            let filtered = usersData.obtenerUsuarios.filter(user => {
                if (usuariosEnEquipos.has(user.id)) return false;

                if (user.id === groupLeader) return false;

                if (user.estadoCuenta !== undefined && user.debeCambiarPassword !== undefined) {
                    return user.estadoCuenta === true && user.debeCambiarPassword === false;
                }
                return user.entidad_perteneciente && user.nivel_de_entrenamiento;
            });

            if (memberSearchTerm) {
                const searchLower = memberSearchTerm.toLowerCase();
                filtered = filtered.filter(user =>
                    user.nombre.toLowerCase().includes(searchLower) ||
                    user.apellido.toLowerCase().includes(searchLower)
                );
            }

            if (entityFilter) {
                filtered = filtered.filter(user =>
                    user.entidad_perteneciente === entityFilter
                );
            }

            if (trainingLevelFilter) {
                filtered = filtered.filter(user =>
                    user.nivel_de_entrenamiento === trainingLevelFilter
                );
            }

            setFilteredMembers(filtered);
        }
    }, [usersData, teamsData, memberSearchTerm, entityFilter, trainingLevelFilter, groupLeader, editGroupModal, selectedTeam]);

    useEffect(() => {
        if (currentStep === 4) {
            fetchInventory();
        }
    }, [currentStep]);

    useEffect(() => {
        if (editGroupModal && selectedTeam) {
            const loadComunarios = async () => {
                setLoadingComunarios(true);
                try {
                    const { data } = await obtenerComunariosPorEquipo({
                        variables: { Equipoid: selectedTeam.id }
                    });
                    setComunarios(data?.obtenerComunariosApoyoPorEquipo || []);
                } catch (error) {
                    console.error("Error al cargar comunarios:", error);
                    showNotification("error", "Error al cargar comunarios de apoyo");
                } finally {
                    setLoadingComunarios(false);
                }
            };
            loadComunarios();
        }
    }, [editGroupModal, selectedTeam]);

    useEffect(() => {
        if (teamsData?.obtenerEquipos && !teamsLoading) {
            cargarTodosLosComunarios();
        }
    }, [teamsData, teamsLoading]);
    useEffect(() => {
        if (teamsData?.obtenerEquipos) {
            cargarComunarios();
        }
    }, [teamsData]);
    useEffect(() => {
        console.log("Comunarios agrupados por equipo:", comunariosPorEquipo);
    }, [comunariosPorEquipo]);
    const validarComunarios = () => {
        return communities.every(c => {
            if (!c.nombre || c.nombre.trim().length === 0) {
                showNotification("error", "Todos los comunarios deben tener un nombre válido");
                return false;
            }
            if (!c.edad || isNaN(c.edad) || c.edad < 1 || c.edad > 120) {
                showNotification("error", `Edad inválida para ${c.nombre || 'un comunario'}`);
                return false;
            }
            return true;
        });
    };

    // Efecto para cargar los nombres de ubicación
    useEffect(() => {
        const loadLocationNames = async () => {
            if (teamsData?.obtenerEquipos) {
                const newLocationNames = {};
                for (const team of teamsData.obtenerEquipos) {
                    if (team.ubicacion?.coordinates) {
                        try {
                            const lugar = await obtenerNombreLugar(
                                team.ubicacion.coordinates[1],
                                team.ubicacion.coordinates[0]
                            );
                            newLocationNames[team.id] = lugar;
                        } catch (error) {
                            console.error("Error al obtener nombre de ubicación:", error);
                            newLocationNames[team.id] = "Error al obtener ubicación";
                        }
                    }
                }
                setLocationNames(newLocationNames);
            }
        };

        loadLocationNames();
    }, [teamsData]);

// =========================
//  CREAR NUEVO EQUIPO
// =========================
    const handleCreateGroup = async () => {
        if (
            !groupName ||
            !groupLeader ||
            (selectedMembers.length === 0 && !selectedMembers.includes(groupLeader))
        ) {
            showNotification("error", "Por favor complete todos los campos requeridos");
            return;
        }

        setIsSubmitting(true);

        try {
            // 👉 TOTAL sin duplicados (líder + miembros)
            const totalMiembros = new Set([...selectedMembers, groupLeader]).size;

            const { data } = await crearEquipo({
                variables: {
                    input: {
                        nombre_equipo: groupName,
                        lat: selectedLocation ? selectedLocation[0] : -16.5,
                        lng: selectedLocation ? selectedLocation[1] : -64.5,
                        cantidad_integrantes: totalMiembros,   // ← nuevo valor
                        id_lider_equipo: groupLeader,
                        estado: groupStatus,
                    },
                },
            });

            const nuevoEquipo = data.crearEquipo;

            // Agregar miembros (excluyendo al líder si está en la lista)
            const miembrosParaAgregar = selectedMembers.filter(
                (id) => id !== groupLeader
            );
            if (miembrosParaAgregar.length > 0) {
                await agregarMiembrosEquipo({
                    variables: {
                        id_equipo: nuevoEquipo.id,
                        miembros: miembrosParaAgregar,
                    },
                });
            }
            // Paso adicional: crear el recurso si hay ítems en la mochila
            if (Object.keys(backpack).length > 0) {
                const descripcion = inventory
                    .filter(item => backpack[item.id_articulo] > 0)
                    .map(item => `${item.nombre_articulo}:${backpack[item.id_articulo]}`)
                    .join(',');
                console.log(descripcion);

                await crearRecurso({
                    variables: {
                        input: {
                            descripcion,
                            Equipoid: nuevoEquipo.id
                        }
                    }
                });
                console.log(crearRecurso);
            }
            if (communities.length > 0 && !validarComunarios()) {
                return;
            }
            if (communities.some(c => c.nombre && c.edad)) {
                const comunariosValidos = communities.filter(c => {
                    const nombreValido = c.nombre && c.nombre.trim().length > 0;
                    const edadValida = !isNaN(c.edad) && c.edad > 0 && c.edad < 120;

                    return nombreValido && edadValida;
                });

                if (comunariosValidos.length > 0) {
                    const resultados = await Promise.allSettled(
                        comunariosValidos.map(comunario =>
                            crearComunarioApoyo({
                                variables: {
                                    input: {
                                        nombre: comunario.nombre.trim(),
                                        edad: parseInt(comunario.edad),
                                        Equipoid: nuevoEquipo.id
                                    }
                                }
                            })
                        )
                    );
                }
            }
            await refetchTeams();
            await cargarComunarios();
            closeModals();
            resetForm();
            showNotification("success", "Equipo creado exitosamente");
        } catch (error) {
            console.error("Error al crear equipo:", error);
            showNotification("error", `Error al crear el equipo: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }

    };

// =========================
//  EDITAR EQUIPO EXISTENTE
// =========================
    const handleUpdateGroup = async () => {
        if (!groupName || !groupLeader || !selectedTeam) {
            showNotification("error", "Por favor complete todos los campos requeridos");
            return;
        }

        setIsSubmitting(true);

        // ────────────────────────────────────────────────────────────────
        // 1 ▸ Calcular TOTAL sin duplicados
        //    - IDs que YA tiene el equipo (solo id_usuario, no id del vínculo)
        //    - IDs nuevos seleccionados en el wizard
        //    - ID del líder
        // ────────────────────────────────────────────────────────────────
        const miembrosExistentesIds = selectedTeam.miembros.filter((m) => m.id_usuario.id !== groupLeader) // ← excluye al líder
            .map((m) => m.id_usuario.id);


        const totalIntegrantes = new Set([
            ...miembrosExistentesIds,
            ...selectedMembers,
            groupLeader,
        ]).size;
        // ────────────────────────────────────────────────────────────────

        try {
            // 2 ▸ Actualizar los datos principales del equipo
            await actualizarEquipo({
                variables: {
                    id: selectedTeam.id,
                    input: {
                        nombre_equipo: groupName,
                        lat: selectedLocation
                            ? selectedLocation[0]
                            : selectedTeam.ubicacion?.coordinates[1] || -16.5,
                        lng: selectedLocation
                            ? selectedLocation[1]
                            : selectedTeam.ubicacion?.coordinates[0] || -64.5,
                        cantidad_integrantes: totalIntegrantes,   // ← valor correcto
                        id_lider_equipo: groupLeader,
                        estado: groupStatus,
                    },
                },
            });

            // 3 ▸ Agregar nuevos miembros (si hay)
            if (selectedMembers.length > 0) {
                await agregarMiembrosEquipo({
                    variables: {
                        id_equipo: selectedTeam.id,
                        miembros: selectedMembers, // sólo los nuevos, ya filtraste por líder
                    },
                });
            }

            if (Object.keys(backpack).length > 0) {
                const descripcion = inventory
                    .filter(item => backpack[item.id_articulo] > 0)
                    .map(item => `${item.nombre_articulo}:${backpack[item.id_articulo]}`)
                    .join(',');
                console.log(descripcion);
                await crearRecurso({
                    variables: {
                        input: {
                            descripcion,
                            Equipoid: selectedTeam.id
                        }
                    }
                });
                console.log(crearRecurso);
            }
            if (communities.length > 0 && !validarComunarios()) {
                return;
            }
            if (communities.some(c => c.nombre && c.edad)) {
                const comunariosValidos = communities.filter(c => {
                    const nombreValido = c.nombre && c.nombre.trim().length > 0;
                    const edadValida = !isNaN(c.edad) && c.edad > 0 && c.edad < 120;

                    return nombreValido && edadValida;
                });

                if (comunariosValidos.length > 0) {
                    const resultados = await Promise.allSettled(
                        comunariosValidos.map(comunario =>
                            crearComunarioApoyo({
                                variables: {
                                    input: {
                                        nombre: comunario.nombre.trim(),
                                        edad: parseInt(comunario.edad),
                                        Equipoid: selectedTeam.id
                                    }
                                }
                            })
                        )
                    );
                }
            }

            // 4 ▸ Refrescar, cerrar y notificar
            await refetchTeams();
            await cargarComunarios();
            closeModals();
            resetForm();
            showNotification("success", "Equipo actualizado exitosamente");
        } catch (error) {
            console.error("Error al actualizar equipo:", error);
            showNotification("error", `Error al actualizar el equipo: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDeleteTeam = async (teamId) => {
        try {
            const { data } = await eliminarEquipo({
                variables: { eliminarEquipoId: teamId }
            });

            if (data.eliminarEquipo) {
                await refetchTeams();
                showNotification('success', "Equipo eliminado correctamente");
            } else {
                showNotification('error', "No se pudo eliminar el equipo");
            }
        } catch (error) {
            console.error("Error al eliminar equipo:", error);
            showNotification('error', `Error al eliminar equipo: ${error.message}`);
        }
    };

    const handleRemoveMember = async (memberId, teamId) => {
        if (!memberId) {
            console.error("ID de miembro no definido");
            showNotification('error', "Error: ID de miembro no válido");
            return;
        }

        showConfirmation(
            `¿Eliminar a este miembro del equipo?`,
            async () => {
                try {
                    await eliminarMiembroEquipo({
                        variables: { id: memberId },
                        update: (cache) => {
                            // Actualización optimista del cache
                            const existingTeams = cache.readQuery({ query: OBTENER_EQUIPOS });

                            if (existingTeams?.obtenerEquipos) {
                                const updatedTeams = existingTeams.obtenerEquipos.map(team => {
                                    if (team.id === teamId) {
                                        return {
                                            ...team,
                                            miembros: team.miembros.filter(m => m.id !== memberId),
                                            cantidad_integrantes: team.cantidad_integrantes - 1
                                        };
                                    }
                                    return team;
                                });

                                cache.writeQuery({
                                    query: OBTENER_EQUIPOS,
                                    data: { obtenerEquipos: updatedTeams }
                                });
                            }
                        }
                    });

                    // Actualizar el estado local del equipo seleccionado
                    setSelectedTeam(prev => {
                        const nuevosMiembros = prev.miembros.filter(m => m.id !== memberId);
                        return {
                            ...prev,
                            miembros: nuevosMiembros,
                            cantidad_integrantes: prev.cantidad_integrantes - 1
                        };
                    });

                    // Actualizar selectedMembers para mantener consistencia
                    setSelectedMembers(prev => {
                        // Encontrar el ID de usuario correspondiente al memberId que se está eliminando
                        const miembroEliminado = selectedTeam.miembros.find(m => m.id === memberId);
                        if (miembroEliminado) {
                            return prev.filter(id => id !== miembroEliminado.id_usuario.id);
                        }
                        return prev;
                    });

                    showNotification('success', "Miembro eliminado correctamente");
                } catch (error) {
                    console.error("Error al eliminar miembro:", error);
                    showNotification('error', `Error al eliminar miembro: ${error.message}`);
                }
            }
        );
    };

    const handleTransferLeadership = async (teamId, newLeaderId) => {
        try {
            const newLeaderData = usersData.obtenerUsuarios.find(user => user.id === newLeaderId);
            const oldLeaderId = selectedTeam.id_lider_equipo.id;

            const { data } = await transferirLiderazgo({
                variables: {
                    id_equipo: teamId,
                    nuevo_lider_id: newLeaderId
                },
                update: (cache) => {
                    // Actualización optimista del cache
                    const existingTeams = cache.readQuery({ query: OBTENER_EQUIPOS });

                    if (existingTeams?.obtenerEquipos) {
                        const updatedTeams = existingTeams.obtenerEquipos.map(team => {
                            if (team.id === teamId) {
                                return {
                                    ...team,
                                    id_lider_equipo: {
                                        ...team.id_lider_equipo,
                                        id: newLeaderId,
                                        nombre: newLeaderData.nombre,
                                        apellido: newLeaderData.apellido
                                    }
                                };
                            }
                            return team;
                        });

                        cache.writeQuery({
                            query: OBTENER_EQUIPOS,
                            data: { obtenerEquipos: updatedTeams }
                        });
                    }
                }
            });

            // Actualizar el estado local
            setSelectedTeam(prev => {
                // Verificar si el nuevo líder ya es miembro
                const isNewLeaderAlreadyMember = prev.miembros.some(
                    m => m.id_usuario.id === newLeaderId
                );

                // Verificar si el antiguo líder está en la lista de miembros
                const isOldLeaderInMembers = prev.miembros.some(
                    m => m.id_usuario.id === oldLeaderId
                );

                let updatedMembers = [...prev.miembros];

                // Si el nuevo líder no era miembro, agregarlo (excepto si es el mismo)
                if (!isNewLeaderAlreadyMember && newLeaderId !== oldLeaderId) {
                    updatedMembers = [
                        ...updatedMembers,
                        {
                            id: `temp-${Date.now()}`,
                            id_usuario: {
                                id: newLeaderId,
                                nombre: newLeaderData.nombre,
                                apellido: newLeaderData.apellido
                            }
                        }
                    ];
                }

                // Si el antiguo líder no está en miembros, agregarlo
                if (!isOldLeaderInMembers) {
                    updatedMembers = [
                        ...updatedMembers,
                        {
                            id: `temp-${Date.now()}-old`,
                            id_usuario: {
                                id: oldLeaderId,
                                nombre: prev.id_lider_equipo.nombre,
                                apellido: prev.id_lider_equipo.apellido
                            }
                        }
                    ];
                }

                return {
                    ...prev,
                    id_lider_equipo: {
                        id: newLeaderId,
                        nombre: newLeaderData.nombre,
                        apellido: newLeaderData.apellido,
                        email: newLeaderData.email
                    },
                    miembros: updatedMembers
                };
            });

            showNotification('success', "Liderazgo transferido correctamente");
        } catch (error) {
            console.error("Error al transferir liderazgo:", error);
            showNotification('error', `Error al transferir liderazgo: ${error.message}`);
        }
    };

    const handleRemoveComunario = async (id) => {
        showConfirmation(
            "¿Eliminar este comunario de apoyo?",
            async () => {
                try {
                    await eliminarComunarioApoyo({
                        variables: { id },
                        update: (cache) => {
                            // Actualizar la cache después de eliminar
                            cache.evict({ id: `ComunarioApoyo:${id}` });
                            cache.gc();
                        }
                    });

                    // Actualizar el estado local de comunarios
                    setComunarios(prev => prev.filter(c => c.id !== id));

                    // Actualizar el estado de comunariosPorEquipo
                    setComunariosPorEquipo(prev => {
                        const newState = { ...prev };
                        Object.keys(newState).forEach(equipoId => {
                            newState[equipoId] = newState[equipoId].filter(c => c.id !== id);
                        });
                        return newState;
                    });

                    // Recargar los datos
                    await cargarTodosLosComunarios();
                    showNotification("success", "Comunario eliminado correctamente");
                } catch (error) {
                    console.error("Error al eliminar comunario:", error);
                    showNotification("error", "Error al eliminar comunario");
                }
            }
        );
    };

    const showConfirmation = (message, onConfirm, onCancel = () => {}) => {
        setConfirmation({
            show: true,
            message,
            onConfirm: () => {
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
                setConfirmation(prev => ({ ...prev, show: false }));
            },
            onCancel: () => {
                if (typeof onCancel === 'function') {
                    onCancel();
                }
                setConfirmation(prev => ({ ...prev, show: false }));
            }
        });
    };
    const resetMemberFilters = () => {
        setMemberSearchTerm("");
        setEntityFilter("");
        setTrainingLevelFilter("");
    };

    const resetForm = () => {
        setGroupName("");
        setGroupLeader("");
        setGroupStatus("activo");
        setSelectedMembers([]);
        setMemberSearchTerm("");
        setEntityFilter("");
        setTrainingLevelFilter("");
        setSelectedLocation(null);
        setCurrentStep(1);
        setCommunities([]);
        setBackpack({});

    };

    const openDetailsModal = (team) => {
        setSelectedTeam(team);
        setShowDetailsModal(true);
    };

    const openEditModal = (team) => {
        setSelectedTeam(team);
        setGroupName(team.nombre_equipo);
        setGroupLeader(team.id_lider_equipo.id);
        setGroupStatus(team.estado);
        setSelectedLocation(
            team.ubicacion?.coordinates
                ? [team.ubicacion.coordinates[1], team.ubicacion.coordinates[0]]
                : null
        );

        const miembrosSinLider = team.miembros
            .map(m => m.id_usuario.id)
            .filter(id => id !== team.id_lider_equipo.id);

        setSelectedMembers(miembrosSinLider); // ← importante
        setEditGroupModal(true);
    };


    const closeModals = () => {
        setShowDetailsModal(false);
        setNewGroupModal(false);
        setEditGroupModal(false);
        setSelectedTeam(null);
        resetForm();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "activo": return "bg-green-500";
            case "inactivo": return "bg-red-500";
            case "en_mision": return "bg-blue-500";
            default: return "bg-gray-500";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "activo": return "Activo";
            case "inactivo": return "Inactivo";
            case "en_mision": return "En misión";
            default: return status;
        }
    };

    if (teamsLoading || usersLoading) {
        return (
            <div className="fixed inset-0 flex justify-center items-center z-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
            </div>
        );
    }

    if (teamsError || usersError) {
        const errorMessage = (teamsError || usersError).message;

        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md shadow-sm">
                <div className="flex items-start gap-3">
                    <FaExclamationCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-800">
                            Error al cargar los datos
                        </h3>
                        <p className="mt-1 text-sm text-red-700">
                            {errorMessage.includes("No autorizado")
                                ? "No tienes permisos para ver esta información. Por favor inicia sesión."
                                : errorMessage}
                        </p>
                        <button
                            onClick={() => {
                                if (errorMessage.includes("No autorizado")) {
                                    window.location.href = "/Login";
                                } else {
                                    refetchTeams();
                                    refetchUsers();
                                }
                            }}
                            className="mt-3 inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-200 transition"
                        >
                            {errorMessage.includes("No autorizado") ? (
                                <>
                                    <FaSignInAlt /> Ir a login
                                </>
                            ) : (
                                <>
                                    <FaSyncAlt className="animate-spin" /> Reintentar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <TeamHeader />
            <main className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
                {/* Notificaciones */}
                <AnimatePresence>
                    {notifications.map(notification => (
                        <Notification
                            key={notification.id}
                            type={notification.type}
                            message={notification.message}
                            onClose={() => removeNotification(notification.id)}
                        />
                    ))}
                </AnimatePresence>

                <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-orange-600 mb-4">
                            Coordinación de Equipos
                        </h2>
                        <p className="text-gray-600 max-w-3xl mx-auto">
                            Organización y coordinación de brigadas de ayuda y equipos de emergencia
                        </p>
                    </div>

                    {/* Dashboard de equipos */}
                    <div className="mb-12">
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                            <div className="flex flex-wrap gap-3">
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar equipo..."
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Todos los estados</option>
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                    <option value="en_mision">En misión</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setNewGroupModal(true)}
                                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                            >
                                <FaPlus /> <span>Nuevo Equipo</span>
                            </button>
                        </div>

                        {/* Grid de equipos */}
                        {/* Grid de equipos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredTeams.map((team) => {
                                // Calcular brigadistas (líder + miembros)
                                const totalBrigadistas = new Set([
                                    ...team.miembros.map(m => m.id_usuario?.id).filter(Boolean),
                                    team.id_lider_equipo?.id
                                ].filter(Boolean)).size;

                                // Obtener comunarios para este equipo
                                const comunariosDelEquipo = comunariosPorEquipo[team.id] || [];
                                const totalComunarios = comunariosDelEquipo.length;
                                const totalPersonas = totalBrigadistas + totalComunarios;

                                return (
                                    <motion.div
                                        key={team.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-gray-50 rounded-lg p-6 relative shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div
                                            className={`absolute top-6 right-6 w-3 h-3 rounded-full ${getStatusColor(
                                                team.estado
                                            )}`}
                                        ></div>

                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                            {team.nombre_equipo}
                                        </h3>

                                                                                        <div className="space-y-2 mb-6">
                                                <p>
                                                    <span className="font-semibold">Brigadistas:</span>{" "}
                                                    {totalBrigadistas}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">Comunarios:</span>{" "}
                                                    {totalComunarios}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">Total Miembros:</span>{" "}
                                                    {totalPersonas}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">Estado:</span>{" "}
                                                    {getStatusText(team.estado)}
                                                </p>
                                                                                            <div className="relative group">
                                                <p className="flex items-center">
                                                    <span className="font-semibold mr-1">Ubicación:</span>
                                                    <span className="text-gray-700">
                                                        {locationNames[team.id] || "Cargando ubicación..."}
                                                    </span>
                                                </p>
                                                {/* Tooltip con coordenadas */}
                                                <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                                    Coordenadas: {team.ubicacion?.coordinates?.join(", ")}
                                                </div>
                                            </div>
                                                <p>
                                                    <span className="font-semibold">Líder:</span>{" "}
                                                    {team.id_lider_equipo?.nombre} {team.id_lider_equipo?.apellido}
                                                </p>
                                            </div>

                                        <div className="flex gap-3">
                                            <button
                                                className="bg-white text-orange-600 border border-orange-600 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors flex-1"
                                                onClick={() => openDetailsModal(team)}
                                            >
                                                Detalles
                                            </button>

                                            <button
                                                className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors flex-1"
                                                onClick={() => openEditModal(team)}
                                            >
                                                Editar
                                            </button>

                                            <button
                                                className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors flex-1"
                                                onClick={() =>
                                                    showConfirmation(
                                                        "¿Estás seguro de eliminar este equipo?",
                                                        () => handleDeleteTeam(team.id)
                                                    )
                                                }
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                    </div>
                </section>

                {/* Modal de Detalles */}
                <AnimatePresence>
                    {showDetailsModal && selectedTeam && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="p-6 border-b">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {selectedTeam.nombre_equipo} - Detalles del Equipo
                                        </h2>
                                        <button
                                            onClick={closeModals}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <FaTimes size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="mb-4 flex flex-wrap gap-3">
                                        <div className="px-4 py-2 bg-gray-100 rounded-md">
                                            <span className="font-semibold">Estado:</span> {getStatusText(selectedTeam.estado)}
                                        </div>
                                                                                        <div className="px-4 py-2 bg-gray-100 rounded-md relative group">
                                                    <div className="flex items-center">
                                                        <span className="font-semibold mr-2">Ubicación:</span>
                                                        <div className="flex items-center text-gray-600">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                                            </svg>
                                                            <span>
                                                                {locationNames[selectedTeam.id] || "Cargando ubicación..."}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Tooltip con coordenadas */}
                                                    <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                                        Coordenadas: {selectedTeam.ubicacion?.coordinates?.join(", ")}
                                                    </div>
                                                </div>
                                        {/* Chip gris igual a los de Estado y Ubicación */}
                                        <div className="px-4 py-2 bg-gray-100 rounded-md">
                                            <span className="font-semibold">Total miembros:</span>{" "}
                                            {
                                                selectedTeam.miembros.filter(
                                                    (m) => m.id_usuario.id !== selectedTeam.id_lider_equipo.id
                                                ).length + 1
                                            }
                                        </div>

                                    </div>

                                    <h3 className="text-xl font-semibold mb-4">Líder del Equipo</h3>
                                    <div className="bg-gray-50 p-4 rounded-md mb-6">
                                        <p className="font-medium">
                                            {selectedTeam.id_lider_equipo?.nombre} {selectedTeam.id_lider_equipo?.apellido}
                                        </p>
                                        <p className="text-gray-600">{selectedTeam.id_lider_equipo?.email}</p>
                                    </div>

                                    <h3 className="text-xl font-semibold mb-4">Miembros del Equipo</h3>
                                    <div className="overflow-x-auto mb-6">
                                        <table className="min-w-full bg-white">
                                            <thead className="bg-gray-100">
                                            <tr>
                                                <th className="py-3 px-4 text-left font-semibold">Nombre</th>
                                                <th className="py-3 px-4 text-left font-semibold">Apellido</th>
                                                <th className="py-3 px-4 text-left font-semibold">Accion</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                            {selectedTeam.miembros.map((miembro) => (
                                                <tr key={miembro.id} className="hover:bg-gray-50">
                                                    <td className="py-3 px-4">{miembro.id_usuario.nombre}</td>
                                                    <td className="py-3 px-4">{miembro.id_usuario.apellido}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => showConfirmation(
                                                                    `¿Transferir el liderazgo a ${miembro.id_usuario.nombre} ${miembro.id_usuario.apellido}?`,
                                                                    () => handleTransferLeadership(selectedTeam.id, miembro.id_usuario.id)
                                                                )}
                                                                className="text-blue-600 hover:text-blue-800"
                                                                title="Hacer líder"
                                                            >
                                                                <FaUserShield />
                                                            </button>

                                                            <button
                                                                onClick={() => handleRemoveMember(miembro.id, selectedTeam.id)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <h3 className="text-xl font-semibold mb-4">Comunarios del Equipo</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white">
                                            <thead className="bg-gray-100">
                                            <tr>
                                                <th className="py-3 px-4 text-left font-semibold">Nombre</th>
                                                <th className="py-3 px-4 text-left font-semibold">Edad</th>
                                                <th className="py-3 px-4 text-left font-semibold">Acción</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                            {comunariosPorEquipo[selectedTeam.id]?.map((comunario) => (
                                                <tr key={comunario.id} className="hover:bg-gray-50">
                                                    <td className="py-3 px-4">{comunario.nombre}</td>
                                                    <td className="py-3 px-4">{comunario.edad}</td>
                                                    <td className="py-3 px-4">
                                                        <button
                                                            onClick={() => handleRemoveComunario(comunario.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!comunariosPorEquipo[selectedTeam.id] || comunariosPorEquipo[selectedTeam.id].length === 0) && (
                                                <tr>
                                                    <td colSpan="3" className="py-4 text-center text-gray-500">
                                                        No hay comunarios registrados
                                                    </td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="p-6 border-t bg-gray-50 flex justify-end">
                                    <button
                                        onClick={closeModals}
                                        className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal de creación/edición de grupo */}
                <AnimatePresence>
                    {(newGroupModal || editGroupModal) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="p-6 border-b">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {editGroupModal ? "Editar Equipo" : "Crear Nuevo Equipo"}
                                        </h2>
                                        <button
                                            onClick={closeModals}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <FaTimes size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Wizard steps */}
                                    <div className="flex mb-6">
                                        <div className={`flex-1 text-center border-b-2 pb-2 ${currentStep === 1 ? 'border-orange-600 font-bold' : 'border-gray-300'}`}>
                                            Paso 1: Seleccionar ubicación
                                        </div>
                                        <div className={`flex-1 text-center border-b-2 pb-2 ${currentStep === 2 ? 'border-orange-600 font-bold' : 'border-gray-300'}`}>
                                            Paso 2: Configurar equipo
                                        </div>

                                        {/* Nuevo apartado que quiero */}

                                        <div className={`flex-1 text-center border-b-2 pb-2 ${currentStep === 3 ? 'border-orange-600 font-bold' : 'border-gray-300'}`}>
                                            Paso 3: Seleccionar Lider
                                        </div>
                                        <div
                                            className={`flex-1 text-center border-b-2 pb-2 ${
                                                currentStep === 4 ? "border-orange-600 font-bold" : "border-gray-300"
                                            }`}
                                        >
                                            Paso 4: Mochila
                                        </div>

                                        <div className={`flex-1 text-center border-b-2 pb-2 ${currentStep === 5 ? 'border-orange-600 font-bold' : 'border-gray-300'}`}>
                                            Paso 5: Comunarios (Opcional)
                                        </div>
                                    </div>

                                    {currentStep === 1 && (
                                        <div className="mb-6">
                                            <h3 className="text-xl font-semibold mb-4">Seleccione la ubicación del equipo</h3>
                                            <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
                                                <MapWithNoSSR
                                                    mapOptions={mapOptions}
                                                    center={mapOptions.center}
                                                    selectedLocation={selectedLocation}
                                                    onMapClick={(e) =>
                                                        setSelectedLocation([e.latlng.lat, e.latlng.lng])
                                                    }
                                                />

                                            </div>
                                            <div className="mt-4">
                                                {selectedLocation ? (
                                                    <p className="text-green-600">
                                                        <FaMapMarkerAlt className="inline mr-2" />
                                                        Ubicación seleccionada: {selectedLocation[0].toFixed(4)}, {selectedLocation[1].toFixed(4)}
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-600">
                                                        Haga clic en el Haga clic en el mapa o seleccione un marcador para establecer la ubicación
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block font-semibold mb-2 text-gray-700">Nombre del equipo</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                                    value={groupName}
                                                    onChange={(e) => setGroupName(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            {/*<div>*/}
                                            {/*    <label className="block font-semibold mb-2 text-gray-700">Líder del equipo</label>*/}
                                            {/*    <select*/}
                                            {/*        className="w-full px-4 py-2 border border-gray-300 rounded-md"*/}
                                            {/*        value={groupLeader}*/}
                                            {/*        onChange={(e) => setGroupLeader(e.target.value)}*/}
                                            {/*        required*/}
                                            {/*    >*/}
                                            {/*        <option value="">Seleccionar líder</option>*/}
                                            {/*        {usersData?.obtenerUsuarios?.map(user => (*/}
                                            {/*            <option key={user.id} value={user.id}>*/}
                                            {/*                {user.nombre} {user.apellido}*/}
                                            {/*            </option>*/}
                                            {/*        ))}*/}
                                            {/*    </select>*/}
                                            {/*</div>*/}

                                            <div>
                                                <label className="block font-semibold mb-2 text-gray-700">Estado del equipo</label>
                                                <select
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                                    value={groupStatus}
                                                    onChange={(e) => setGroupStatus(e.target.value)}
                                                >
                                                    <option value="activo">Activo</option>
                                                    <option value="inactivo">Inactivo</option>
                                                    <option value="en_mision">En misión</option>
                                                </select>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block font-semibold text-gray-700">Agregar miembros</label>
                                                    {(memberSearchTerm || entityFilter || trainingLevelFilter) && (
                                                        <button
                                                            onClick={resetMemberFilters}
                                                            className="text-sm text-orange-600 hover:text-orange-800"
                                                        >
                                                            Limpiar filtros
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="mb-4 space-y-3">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar miembros..."
                                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                                                            value={memberSearchTerm}
                                                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <select
                                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                                                            value={entityFilter}
                                                            onChange={(e) => setEntityFilter(e.target.value)}
                                                        >
                                                            <option value="">Todas las entidades</option>
                                                            {uniqueEntities.map(entity => (
                                                                <option key={entity} value={entity}>{entity}</option>
                                                            ))}
                                                        </select>

                                                        <select
                                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                                                            value={trainingLevelFilter}
                                                            onChange={(e) => setTrainingLevelFilter(e.target.value)}
                                                        >
                                                            <option value="">Todos los niveles</option>
                                                            {uniqueTrainingLevels.map(level => (
                                                                <option key={level} value={level}>{level}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                                                    {filteredMembers.length > 0 ? (
                                                        filteredMembers.map(user => (
                                                            <div key={user.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`user-${user.id}`}
                                                                    checked={selectedMembers.includes(user.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedMembers([...selectedMembers, user.id]);
                                                                        } else {
                                                                            setSelectedMembers(selectedMembers.filter(id => id !== user.id));
                                                                        }
                                                                    }}
                                                                    disabled={editGroupModal && selectedTeam?.miembros.some(m => m.id_usuario.id === user.id)}
                                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                                />
                                                                <label htmlFor={`user-${user.id}`} className="ml-3 flex-1">
                                                                    <div className="flex justify-between">
                                                                        <span className="font-medium">
                                                                            {user.nombre} {user.apellido}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 flex justify-between">
                                                                        <span className="mr-2">{user.entidad_perteneciente || 'Sin entidad'}</span>
                                                                        <span>Nivel: {user.nivel_de_entrenamiento || 'No especificado'}</span>
                                                                    </div>
                                                                </label>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="py-4 text-center text-gray-500">
                                                            No se encontraron usuarios con estos filtros
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedMembers.length > 0 && (
                                                    <div className="mt-2 text-sm text-gray-600">
                                                        {selectedMembers.length} miembro(s) seleccionado(s)
                                                    </div>
                                                )}
                                            </div>

                                            {editGroupModal && (
                                                <>
                                                    {selectedTeam?.miembros?.length > 0 && (
                                                        <div className="mb-6">
                                                            <h4 className="font-semibold mb-2">Miembros actuales</h4>
                                                            <div className="bg-gray-50 p-3 rounded-md">
                                                                <ul className="space-y-2">
                                                                    {selectedTeam.miembros.map(miembro => (
                                                                        <li key={miembro.id_usuario.id} className="flex justify-between items-center">
                                                                            <span>
                                                                                {miembro.id_usuario.nombre} {miembro.id_usuario.apellido}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => {
                                                                                    handleRemoveMember(miembro.id, selectedTeam.id).catch(error => {
                                                                                        console.error("Error al eliminar miembro:", error);
                                                                                    });
                                                                                }}
                                                                                className="text-red-600 hover:text-red-800 text-sm"
                                                                            >
                                                                                <FaTrash />
                                                                            </button>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h4 className="font-semibold mb-2">Comunarios actuales</h4>
                                                        <div className="bg-gray-50 p-3 rounded-md">
                                                            {comunariosPorEquipo[selectedTeam.id]?.length > 0 ? (
                                                                <ul className="space-y-2">
                                                                    {comunariosPorEquipo[selectedTeam.id].map(comunario => (
                                                                        <li key={comunario.id} className="flex justify-between items-center">
                                                                            <div>
                                                                                <span className="font-medium">{comunario.nombre}</span>
                                                                                <span className="text-gray-500 ml-2">({comunario.edad} años)</span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleRemoveComunario(comunario.id)}
                                                                                className="text-red-600 hover:text-red-800 text-sm"
                                                                            >
                                                                                <FaTrash />
                                                                            </button>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-gray-500 text-center py-2">No hay comunarios registrados</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-6">
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen del equipo</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="font-medium text-gray-700">Nombre del equipo:</p>
                                                        <p className="text-gray-900">{groupName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-700">Ubicación:</p>
                                                        <p className="text-gray-900">
                                                            {selectedLocation ?
                                                                `${selectedLocation[0].toFixed(4)}, ${selectedLocation[1].toFixed(4)}` :
                                                                'No seleccionada'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-700">Estado:</p>
                                                        <p className="text-gray-900 capitalize">{groupStatus}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-700">Miembros seleccionados:</p>
                                                        <p className="text-gray-900">{selectedMembers.length}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-semibold mb-4">Seleccionar líder del equipo</h3>
                                                <p className="text-gray-600 mb-4">
                                                    Seleccione el líder del equipo entre los miembros que ha agregado.
                                                </p>

                                                {selectedMembers.length > 0 ? (
                                                    <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-md">
                                                        {usersData?.obtenerUsuarios
                                                            .filter(user => selectedMembers.includes(user.id) || user.id === groupLeader)
                                                            .map(user => (
                                                                <div
                                                                    key={user.id}
                                                                    className={`flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                                                                        groupLeader === user.id ? 'bg-orange-50' : ''
                                                                    }`}
                                                                    onClick={() => {
                                                                        // Always handle leader/members logic regardless of edit mode
                                                                        const currentMembers = [...selectedMembers];

                                                                        // If there's an existing leader that's different from the new one
                                                                        if (groupLeader && groupLeader !== user.id) {
                                                                            // Add the previous leader back to members if they weren't already there
                                                                            if (!currentMembers.includes(groupLeader)) {
                                                                                currentMembers.push(groupLeader);
                                                                            }
                                                                        }

                                                                        // Remove the new leader from members list if they were there
                                                                        const updatedMembers = currentMembers.filter(id => id !== user.id);

                                                                        // ⭐ ADD THIS VALIDATION ⭐
                                                                        if (updatedMembers.length === 0 && selectedMembers.length > 0) {
                                                                            showNotification("error", "El equipo debe tener al menos un miembro además del líder");
                                                                            return; // Stop the leader change
                                                                        }

                                                                        setSelectedMembers(updatedMembers);
                                                                        setGroupLeader(user.id);
                                                                    }}

                                                                >
                                                                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                                                                        groupLeader === user.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                        <FaUserShield />
                                                                    </div>
                                                                    <div className="ml-4 flex-1">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="font-medium">
                                                                                {user.nombre} {user.apellido}
                                                                            </span>
                                                                            {groupLeader === user.id && (
                                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                                    Líder seleccionado
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 flex justify-between mt-1">
                                                                            <span>{user.entidad_perteneciente || 'Sin entidad'}</span>
                                                                            <span>Nivel: {user.nivel_de_entrenamiento || 'No especificado'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                ) : (
                                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                                        <div className="flex">
                                                            <div className="flex-shrink-0">
                                                                <FaExclamationCircle className="h-5 w-5 text-yellow-400" />
                                                            </div>
                                                            <div className="ml-3">
                                                                <p className="text-sm text-yellow-700">
                                                                    No ha seleccionado ningún miembro para el equipo. Por favor regrese al paso 2 y agregue miembros.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* Paso 4 ─ Mochila de Equipos */}
                                    {currentStep === 4 && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-semibold mb-4">Mochila de Equipos</h3>
                                            <p className="text-gray-600 mb-6">
                                                Asigna suministros al equipo según disponibilidad en almacén
                                            </p>

                                            {loadingInventory ? (
                                                <div className="flex justify-center items-center py-8">
                                                    <FaSpinner className="animate-spin text-orange-600 text-2xl mr-2" />
                                                    <span>Cargando inventario...</span>
                                                </div>
                                            ) : inventory.length === 0 ? (
                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                                    <div className="flex">
                                                        <div className="flex-shrink-0">
                                                            <FaExclamationCircle className="h-5 w-5 text-yellow-400" />
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm text-yellow-700">
                                                                No hay suministros disponibles en el inventario
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                inventory.map(item => (
                                                    <div key={item.id_articulo} className="bg-gray-50 p-4 rounded-md border">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-medium text-gray-800">{item.nombre_articulo}</h4>
                                                                <p className="text-sm text-gray-600">{item.descripcion}</p>
                                                            </div>
                                                            <div className="text-sm text-gray-700">
                                                                <span className="font-semibold">Disponible:</span> {item.total_restante} {item.medida_abreviada}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-3">
                                                            <div className="text-sm text-gray-600">
                                                                <span className="font-medium">Recomendado:</span> {item.cantidad_estimada_por_persona} {item.medida_abreviada}/persona
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => {
                                                                        if (backpack[item.id_articulo] > 0) {
                                                                            setBackpack(prev => ({
                                                                                ...prev,
                                                                                [item.id_articulo]: prev[item.id_articulo] - 1
                                                                            }));
                                                                        }
                                                                    }}
                                                                    className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                                                    disabled={!backpack[item.id_articulo]}
                                                                >
                                                                    -
                                                                </button>

                                                                <span className="w-8 h-8 text-center flex items-center justify-center mt-0.5">{backpack[item.id_articulo] || 0}</span>

                                                                <button
                                                                    onClick={() => {
                                                                        if ((backpack[item.id_articulo] || 0) < item.total_restante) {
                                                                            setBackpack(prev => ({
                                                                                ...prev,
                                                                                [item.id_articulo]: (prev[item.id_articulo] || 0) + 1
                                                                            }));
                                                                        } else {
                                                                            showNotification("info", `No hay suficiente ${item.nombre_articulo} en inventario`);
                                                                        }
                                                                    }}
                                                                    className="h-8 w-8 flex items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                                                                    disabled={(backpack[item.id_articulo] || 0) >= item.total_restante}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* Paso 5: Comunarios locales */}
                                    {currentStep === 5 && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-semibold mb-4">Comunarios Locales</h3>
                                            <p className="text-gray-600 mb-6">
                                                Registre a los comunarios que se unirán al equipo en campo (opcional)
                                            </p>

                                            {loadingComunarios ? (
                                                <div className="flex justify-center items-center py-8">
                                                    <FaSpinner className="animate-spin text-orange-600 text-2xl mr-2" />
                                                    <span>Cargando comunarios...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-4">
                                                        {communities.map((comm, index) => (
                                                            <div key={index} className="flex gap-3 items-end">
                                                                <div className="flex-1">
                                                                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                                                    <input
                                                                        type="text"
                                                                        className="mt-1 block w-full border border-gray-300 rounded-md"
                                                                        value={comm.nombre}
                                                                        onChange={(e) => updateCommunity(index, 'nombre', e.target.value)}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="w-20">
                                                                    <label className="block text-sm font-medium text-gray-700">Edad</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="mt-1 block w-full border border-gray-300 rounded-md"
                                                                        value={comm.edad}
                                                                        onChange={(e) => updateCommunity(index, 'edad', e.target.value)}
                                                                        required
                                                                    />
                                                                </div>

                                                                <button
                                                                    onClick={() => removeCommunity(index)}
                                                                    className="text-red-500 hover:text-red-700 p-2"
                                                                    title="Eliminar comunario"
                                                                >
                                                                    <FaTrash size={18} />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        <button
                                                            onClick={addCommunity}
                                                            className="flex items-center gap-1 text-orange-600 hover:text-orange-800 font-semibold"
                                                        >
                                                            <FaPlus /> Agregar comunario
                                                        </button>
                                                    </div>

                                                    {/* Lista de comunarios existentes (solo en modo edición) */}
                                                    {editGroupModal && comunarios.length > 0 && (
                                                        <div className="mt-8">
                                                            <h4 className="text-lg font-semibold mb-3">Comunarios registrados</h4>
                                                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                                                <ul className="divide-y divide-gray-200">
                                                                    {comunarios.map(comunario => (
                                                                        <li key={comunario.id} className="py-3 flex justify-between items-center">
                                                                            <div>
                                                                                <p className="font-medium">{comunario.nombre}</p>
                                                                                <p className="text-sm text-gray-600">Edad: {comunario.edad}</p>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleRemoveComunario(comunario.id)}
                                                                                className="text-red-600 hover:text-red-800 p-1"
                                                                                title="Eliminar comunario"
                                                                            >
                                                                                <FaTrash size={16} />
                                                                            </button>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}


                                    <div className="flex justify-between pt-6 border-t">
                                        {/* ←── Botón «Anterior» */}
                                        {currentStep > 1 ? (
                                            <button
                                                onClick={() => setCurrentStep(currentStep - 1)}
                                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                                            >
                                                Anterior
                                            </button>
                                        ) : (
                                            <div />
                                        )}

                                        <div className="flex gap-4">
                                            {/* ←── Botón «Cancelar» */}
                                            <button
                                                onClick={closeModals}
                                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                                            >
                                                Cancelar
                                            </button>

                                            {/* ←── Botón «Siguiente» o «Crear / Guardar» */}
                                            {currentStep < 5 ? (
                                                /*  Pasos 1-4  → Siguiente  */
                                                <button
                                                    onClick={() => {
                                                        if (currentStep === 1 && !selectedLocation) {
                                                            showNotification("error", "Por favor seleccione una ubicación");
                                                        } else if (
                                                            currentStep === 2 &&
                                                            (!groupName || selectedMembers.length === 0)
                                                        ) {
                                                            showNotification(
                                                                "error",
                                                                "Por favor complete el nombre y agregue al menos un miembro"
                                                            );
                                                        } else if (currentStep === 3 && !groupLeader) {
                                                            showNotification("error", "Seleccione un líder para continuar");
                                                        } else {
                                                            setCurrentStep(currentStep + 1); // → avanza al siguiente paso
                                                        }
                                                    }}
                                                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                                                >
                                                    Siguiente
                                                </button>
                                            ) : (
                                                /*  Paso 5  → Crear Equipo / Guardar Cambios  */
                                                <button
                                                    onClick={editGroupModal ? handleUpdateGroup : handleCreateGroup}
                                                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <motion.span
                                                                animate={{ rotate: 360 }}
                                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                            >
                                                                <FaSpinner className="animate-spin" />
                                                            </motion.span>
                                                            Procesando…
                                                        </>
                                                    ) : editGroupModal ? (
                                                        "Guardar Cambios"
                                                    ) : (
                                                        "Crear Equipo"
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal de confirmación */}
                <AnimatePresence>
                    {confirmation.show && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
                            >
                                <div className="text-center mb-6">
                                    <FaQuestionCircle className="mx-auto text-yellow-500 text-5xl mb-4" />
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar acción</h3>
                                    <p className="text-gray-600">{confirmation.message}</p>
                                </div>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={confirmation.onCancel}
                                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmation.onConfirm}
                                        className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            <Footer />
        </>
    );
};

export default Teams;