"use client"

import React, { useState, useEffect } from 'react';
import { useFormik } from "formik";
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BiLoaderAlt } from 'react-icons/bi';
import { FiCheck } from 'react-icons/fi';
import { useMutation, useQuery } from '@apollo/client';
import { AUTENTICAR_USUARIO, OBTENER_USUARIO_POR_TOKEN } from '../Endpoints/endpoints_graphql';

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


const Login = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [mensaje, setMensaje] = useState(null);
    const [tipoMensaje, setTipoMensaje] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [usuarioData, setUsuarioData] = useState(null);

    const router = useRouter();

    // Efecto para cambiar las imágenes automáticamente
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % backgroundImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const [autenticarUsuario] = useMutation(AUTENTICAR_USUARIO);

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
                    className="text-2xl text-[#e25822] font-bold"
                >
                    Alas Chiquitanas
                </span>
            </div>
        </Link>
    );

    const { refetch: obtenerUsuario } = useQuery(OBTENER_USUARIO_POR_TOKEN, {
        skip: true,
        context: {
            headers: {
                authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
            },
        },
        onCompleted: (data) => {
            setUsuarioData(data.obtenerUsuarioPorToken);
            if (data.obtenerUsuarioPorToken.debeCambiarPassword) {
                router.push('/CambioPassword');
            } else {
                setTimeout(() => {
                    router.push('/Homepage');
                }, 1000);
            }
        },
        onError: (error) => {
            console.error('Error al obtener usuario:', error);
            setMensaje('Error al obtener datos del usuario');
            setTipoMensaje('error');
        }
    });

    const formik = useFormik({
        initialValues: {
            ci: '',
            password: ''
        },
        validationSchema: Yup.object({
            ci: Yup.string().required('El CI es obligatorio'),
            password: Yup.string().required('La contraseña es obligatoria')
        }),
        onSubmit: async valores => {
            const { ci, password } = valores;
            setIsLoading(true);

            try {
                const { data } = await autenticarUsuario({
                    variables: {
                        input: {
                            ci,
                            password
                        }
                    }
                });

                const { token } = data.autenticarUsuario;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', token);
                }

                setTipoMensaje('exito');
                setIsLoading(false);
                setIsSuccess(true);

                setTimeout(async () => {
                    try {
                        await obtenerUsuario();
                    } catch (error) {
                        console.error('Error al obtener usuario:', error);
                    }
                }, 500);

            } catch (error) {
                setMensaje(error.message || 'Error al autenticar');
                setTipoMensaje('error');
                setIsLoading(false);

                setTimeout(() => {
                    setMensaje(null);
                    setTipoMensaje(null);
                }, 5000);
            }
        }
    });

    const LoadingButton = () => (
        <motion.button
            type="submit"
            disabled={isLoading || isSuccess}
            className={`w-full bg-[#e25822] text-white py-3 px-4 rounded-md 
                      hover:bg-[#c43e11] transition duration-300 font-medium
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
                            <span className="ml-2">Cargando...</span>
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
                            <span className="ml-2">¡Éxito!</span>
                        </motion.div>
                    ) : (
                        <motion.span
                            key="default"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            Iniciar Sesión
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
                    className="w-full max-w-5xl flex flex-col md:flex-row rounded-lg shadow-2xl overflow-hidden bg-white/95 backdrop-blur-md border border-white/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Columna del formulario */}
                    <div className="w-full md:w-1/2 p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-gray-800">Iniciar Sesión</h2>
                            <p className="text-gray-600">Ingresa tus credenciales para acceder</p>
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
                            <div>
                                <label className="block font-medium mb-1 text-gray-700">CI</label>
                                <motion.input
                                    type="text"
                                    id="ci"
                                    placeholder="Número de carnet"
                                    value={formik.values.ci}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className={`w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e25822]/50 bg-white/90
                                        ${formik.touched.ci && formik.errors.ci ? 'border-red-500' : 'border-gray-300'}`}
                                    whileFocus={{ scale: 1.01 }}
                                />
                                {formik.touched.ci && formik.errors.ci ? (
                                    <motion.div
                                        className="text-red-500 text-sm mt-1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {formik.errors.ci}
                                    </motion.div>
                                ) : null}
                            </div>

                            <div>
                                <label className="block font-medium mb-1 text-gray-700">Contraseña</label>
                                <motion.input
                                    type="password"
                                    id="password"
                                    placeholder="Contraseña"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className={`w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e25822]/50 bg-white/90
                                        ${formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                    whileFocus={{ scale: 1.01 }}
                                />
                                {formik.touched.password && formik.errors.password ? (
                                    <motion.div
                                        className="text-red-500 text-sm mt-1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {formik.errors.password}
                                    </motion.div>
                                ) : null}
                            </div>

                            <div className="flex justify-end">
                                <Link href="/Password" className="text-sm text-[#e25822] hover:underline transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <div className="mt-6">
                                <LoadingButton />
                            </div>
                        </form>

                        <div className="mt-4 text-center">
                            <p className="text-gray-600">
                                ¿No tienes una cuenta?{' '}
                                <Link href="/Register" className="text-[#e25822] font-medium hover:underline transition-colors">
                                    Regístrate aquí
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Columna de bienvenida */}
                    <div className="w-full md:w-1/2 bg-[#e25822] p-8 flex flex-col justify-center items-center text-white">
                        <div className="text-center">
                            <motion.h1
                                className="text-3xl font-bold mb-4"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                ¡Bienvenido de vuelta!
                            </motion.h1>
                            <motion.p
                                className="text-lg mb-6"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Inicia sesión para conectarte con tu equipo y coordinar operaciones de rescate.
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

export default Login;