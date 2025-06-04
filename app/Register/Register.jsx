"use client"

import React, {useEffect, useState} from 'react';
import { useFormik } from "formik";
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BiLoaderAlt } from 'react-icons/bi';
import { FiCheck } from 'react-icons/fi';
import { useMutation } from '@apollo/client';
import { CREAR_CUENTA } from '../Endpoints/endpoints_graphql';

// Imágenes para el carrusel de fondo
const backgroundImages = [
    {
        url: 'https://static.dw.com/image/67548986_605.jpg',
        alt: 'Equipo de rescate trabajando',
        overlay: ''
    },
    {
        url: 'https://s3.ppllstatics.com/ideal/www/multimedia/2023/11/20/Imagen%20INFOCA%205282-knTC-U210771469548jdD-1200x840@Ideal.jpg',
        alt: 'Avión de rescate en acción',
        overlay: ''
    },
    {
        url: 'https://www.raibolivia.org/wp-content/uploads/2021/11/QUEBRACHO-7-1.jpeg',
        alt: 'Voluntarios ayudando',
        overlay: ''
    }
];

const RegisterForm = () => {
    const [mensaje, guardarMensaje] = useState(null);
    const [tipoMensaje, setTipoMensaje] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const router = useRouter();

    // Efecto para cambiar las imágenes automáticamente
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % backgroundImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const [nuevoUsuario] = useMutation(CREAR_CUENTA);

    // Función para calcular la fecha máxima (18 años atrás desde hoy)
    const calcularFechaMaxima = () => {
        const hoy = new Date();
        const fechaMaxima = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
        return fechaMaxima.toISOString().split('T')[0];
    };

    const formik = useFormik({
        initialValues: {
            nombre: '',
            apellido: '',
            ci: '',
            fecha_nacimiento: '',
            genero: '',
            telefono: '',
            email: '',
            tipo_de_sangre: '',
            nivel_de_entrenamiento: '',
            entidad_perteneciente: '',
            contrasena: '',
            confirmarContrasena: '',
            rol: 'usuario',
        },
        validationSchema: Yup.object({
            nombre: Yup.string().required('El nombre es requerido'),
            apellido: Yup.string().required('El apellido es requerido'),
            ci: Yup.string().required('El CI es requerido'),
            fecha_nacimiento: Yup.date()
                .required('La fecha de nacimiento es requerida')
                .max(calcularFechaMaxima(), 'Debes ser mayor de 18 años para registrarte'),
            genero: Yup.string()
                .required('El género es requerido')
                .oneOf(['Masculino', 'Femenino'], 'Por favor selecciona un género válido'),
            telefono: Yup.string().required('El número de celular es requerido'),
            email: Yup.string().email('El email no es válido').required('El email es requerido'),
            tipo_de_sangre: Yup.string().required('El tipo de sangre es requerido'),
            nivel_de_entrenamiento: Yup.string().required('El nivel de entrenamiento es requerido'),
            entidad_perteneciente: Yup.string().required('La entidad perteneciente es requerida'),
            contrasena: Yup.string()
                .required('El password es requerido')
                .min(6, 'El password debe tener al menos seis caracteres'),
            confirmarContrasena: Yup.string()
                .oneOf([Yup.ref('contrasena'), null], 'Las contraseñas no coinciden')
                .required('Confirmar la contraseña es requerido'),
        }),
        onSubmit: async (datos) => {
            // Activar estado de carga
            setIsLoading(true);

            const { confirmarContrasena, ...inputData } = datos;
            console.log('Datos enviados:', inputData);

            const formattedData = {
                ...inputData,
                fecha_nacimiento: new Date(inputData.fecha_nacimiento).toISOString()
            };

            try {
                const { data } = await nuevoUsuario({
                    variables: {
                        input: formattedData
                    }
                });
                console.log('Respuesta del servidor:', data);
                guardarMensaje(`Usuario creado con éxito: ${data.nuevoUsuario.nombre}`);
                setTipoMensaje('exito');

                // Cambiar a estado de éxito
                setIsLoading(false);
                setIsSuccess(true);

                setTimeout(() => {
                    router.push('./Login');
                }, 2000);
            } catch (err) {
                console.log('Error en la mutación:', err);
                if (err.graphQLErrors) {
                    guardarMensaje("Hubo un problema al procesar tu solicitud.");
                }
                if (err.networkError) {
                    guardarMensaje("Error de red, por favor intenta más tarde.");
                }
                setTipoMensaje('error');
                setIsLoading(false);

                setTimeout(() => {
                    guardarMensaje(null);
                    setTipoMensaje(null);
                }, 5000);
            }
        }
    });

    const LogoIcon = () => (
        <Link href="/" passHref>
            <div
                className="flex items-center cursor-pointer">
                <svg viewBox="0 0 100 100" width="60" height="60" className="mr-3">
                    <circle cx="50" cy="50" r="45" fill="#e25822" />
                    <path
                        d="M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20"
                        fill="#ffcc00"/>
                    <path d="M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20"
                          fill="#ffcc00"/>
                </svg>
                <span
                    className="text-2xl text-[#e25822] font-bold">
                    Alas Chiquitanas
                </span>
            </div>
        </Link>
    );

    // Componente para el botón con animación de carga
    const LoadingButton = () => (
        <motion.button
            type="submit"
            disabled={isLoading || isSuccess}
            className={`bg-[#e25822] text-white px-6 py-2 rounded-md hover:bg-[#c43e11] transition duration-300 font-medium
                      relative overflow-hidden ${isLoading || isSuccess ? 'cursor-not-allowed' : ''}`}
            whileHover={!isLoading && !isSuccess ? { scale: 1.01 } : {}}
            whileTap={!isLoading && !isSuccess ? { scale: 0.99 } : {}}
        >
            <div className="flex justify-center items-center">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center"
                        >
                            <BiLoaderAlt className="animate-spin text-xl" />
                            <span className="ml-2">Procesando...</span>
                        </motion.div>
                    ) : isSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center"
                        >
                            <FiCheck className="text-xl" />
                            <span className="ml-2">¡Registrado!</span>
                        </motion.div>
                    ) : (
                        <motion.span
                            key="default"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            Registrarse
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </motion.button>
    );

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Fondo con carrusel de imágenes - Ahora con z-index menor y posición absoluta */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 w-full h-full"
                    >
                        <img
                            src={backgroundImages[currentImageIndex].url}
                            alt={backgroundImages[currentImageIndex].alt}
                            className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 ${backgroundImages[currentImageIndex].overlay}`} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Header con z-index alto para estar siempre encima */}
            <header className="relative z-50 bg-white/95 shadow-lg p-4 flex items-center justify-between backdrop-blur-md border-b border-white/20">
                <LogoIcon />
            </header>

            {/* Contenido principal */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-4 min-h-0">
                <motion.div
                    className="w-full max-w-6xl flex flex-col md:flex-row rounded-lg shadow-2xl overflow-hidden bg-white/95 backdrop-blur-md border border-white/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Formulario de registro - lado izquierdo */}
                    <div className="w-full md:w-7/12 p-6 overflow-y-auto max-h-[85vh]">
                        <div className="mb-4">
                            <h2 className="text-2xl font-semibold text-gray-800">Crear Cuenta</h2>
                            <p className="text-gray-600">Completa tus datos para unirte a nuestro equipo</p>
                        </div>

                        {mensaje && (
                            <motion.div
                                className={`my-3 p-3 text-center rounded 
                                    ${tipoMensaje === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {mensaje}
                            </motion.div>
                        )}

                        <form onSubmit={formik.handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Form Inputs */}
                                {['nombre', 'apellido', 'ci', 'telefono', 'email'].map((field, idx) => (
                                    <div key={idx}>
                                        <label className="block font-medium mb-1 text-gray-700">
                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                        </label>
                                        <motion.input
                                            type={field === 'email' ? 'email' : 'text'}
                                            name={field}
                                            value={formik.values[field]}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className={`w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e25822]/50 bg-white/90
                                                ${formik.touched[field] && formik.errors[field] ? 'border-red-500' : 'border-gray-300'}`}
                                            whileFocus={{ scale: 1.01 }}
                                        />
                                        {formik.touched[field] && formik.errors[field] ? (
                                            <motion.div
                                                className="text-red-500 text-sm mt-1"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                {formik.errors[field]}
                                            </motion.div>
                                        ) : null}
                                    </div>
                                ))}

                                <div>
                                    <label className="block font-medium mb-1 text-gray-700">Fecha de nacimiento</label>
                                    <motion.input
                                        type="date"
                                        name="fecha_nacimiento"
                                        value={formik.values.fecha_nacimiento}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        max={calcularFechaMaxima()}
                                        className={`w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e25822]/50 bg-white/90
                                            ${formik.touched.fecha_nacimiento && formik.errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'}`}
                                        whileFocus={{ scale: 1.01 }}
                                    />
                                    {formik.touched.fecha_nacimiento && formik.errors.fecha_nacimiento ? (
                                        <motion.div
                                            className="text-red-500 text-sm mt-1"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            {formik.errors.fecha_nacimiento}
                                        </motion.div>
                                    ) : null}
                                </div>

                                {/* Select Inputs for other fields */}
                                {['genero', 'tipo_de_sangre', 'nivel_de_entrenamiento', 'entidad_perteneciente'].map((field, idx) => (
                                    <div key={idx}>
                                        <label className="block font-medium mb-1 text-gray-700">
                                            {field.split('_').map(word =>
                                                word.charAt(0).toUpperCase() + word.slice(1)
                                            ).join(' ')}
                                        </label>
                                        <motion.select
                                            name={field}
                                            value={formik.values[field]}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className={`w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e25822]/50 bg-white/90
                                                ${formik.touched[field] && formik.errors[field] ? 'border-red-500' : 'border-gray-300'}`}
                                            whileFocus={{ scale: 1.01 }}
                                        >
                                            <option value="">Selecciona una opción</option>
                                            {/* Depending on the field type, add options */}
                                            {field === 'genero' ? (
                                                <>
                                                    <option value="Masculino">Masculino</option>
                                                    <option value="Femenino">Femenino</option>
                                                </>
                                            ) : field === 'tipo_de_sangre' ? (
                                                ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bloodType, idx) => (
                                                    <option key={idx} value={bloodType}>{bloodType}</option>
                                                ))
                                            ) : field === 'nivel_de_entrenamiento' ? (
                                                ['Bajo', 'Medio', 'Alto'].map((level, idx) => (
                                                    <option key={idx} value={level}>{level}</option>
                                                ))
                                            ) : field === 'entidad_perteneciente' ? (
                                                ['Bomberos', 'Servicios Médicos', 'Policía', 'Defensa Civil'].map((entity, idx) => (
                                                    <option key={idx} value={entity}>{entity}</option>
                                                ))
                                            ) : null}
                                        </motion.select>
                                        {formik.touched[field] && formik.errors[field] ? (
                                            <motion.div
                                                className="text-red-500 text-sm mt-1"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                {formik.errors[field]}
                                            </motion.div>
                                        ) : null}
                                    </div>
                                ))}

                                {/* Contraseña and Confirmar Contraseña */}
                                {['contraseña', 'confirmarContraseña'].map((field, idx) => (
                                    <div key={idx}>
                                        <label className="block font-medium mb-1 text-gray-700">
                                            {field.charAt(0).toUpperCase() + field.slice(1).replace('P', ' p')}
                                        </label>
                                        <motion.input
                                            type="password"
                                            name={field}
                                            value={formik.values[field]}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className={`w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e25822]/50 bg-white/90
                                                ${formik.touched[field] && formik.errors[field] ? 'border-red-500' : 'border-gray-300'}`}
                                            whileFocus={{ scale: 1.01 }}
                                        />
                                        {formik.touched[field] && formik.errors[field] ? (
                                            <motion.div
                                                className="text-red-500 text-sm mt-1"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                {formik.errors[field]}
                                            </motion.div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-6">
                                <LoadingButton />
                                <div className="mt-4">
                                    <p className="text-gray-600">
                                        ¿Ya tienes una cuenta?{' '}
                                        <Link href="/Login" className="text-[#e25822] font-medium hover:underline transition-colors">
                                            Inicia sesión aquí
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Sección de bienvenida - lado derecho */}
                    <div className="w-full md:w-5/12 bg-[#e25822] p-8 flex flex-col justify-center items-center text-white">
                        <div className="text-center">
                            <motion.h1
                                className="text-3xl font-bold mb-4"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                ¡Únete a nosotros!
                            </motion.h1>
                            <motion.p
                                className="text-lg mb-6"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Crea tu cuenta para formar parte de nuestro equipo de rescate y salvar vidas juntos.
                            </motion.p>

                            <div className="mx-auto w-32 h-32 mb-6 relative">
                                <motion.div
                                    initial={{ opacity: 0.8, scale: 0.95 }}
                                    animate={{
                                        opacity: [0.8, 1, 0.8],
                                        scale: [0.95, 1.05, 0.95],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-0"
                                >
                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                        <circle cx="50" cy="50" r="45" fill="#ffffff" opacity="0.9" />
                                        <motion.path
                                            d="M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20"
                                            fill="#ffcc00"
                                            animate={{
                                                d: [
                                                    "M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20",
                                                    "M50 15 C 55 40 85 45 65 85 C 45 65 25 55 50 15",
                                                    "M50 25 C 65 35 75 55 55 75 C 55 55 35 45 50 25",
                                                    "M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20"
                                                ]
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        />
                                        <motion.path
                                            d="M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20"
                                            fill="#ffcc00"
                                            animate={{
                                                d: [
                                                    "M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20",
                                                    "M50 15 C 35 35 15 55 35 85 C 45 65 75 45 50 15",
                                                    "M50 25 C 45 35 25 45 45 75 C 55 55 65 35 50 25",
                                                    "M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20"
                                                ]
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    </svg>
                                </motion.div>
                            </div>

                            <motion.p
                                className="text-white/80"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                Alas Chiquitanas - Salvando vidas juntos
                            </motion.p>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default RegisterForm;