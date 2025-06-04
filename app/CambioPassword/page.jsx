"use client"

import React, { useState, useEffect } from 'react';
import { useFormik } from "formik";
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { BiLoaderAlt } from 'react-icons/bi';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useMutation } from '@apollo/client';
import { CAMBIAR_PASSWORD_INICIAL } from '../Endpoints/endpoints_graphql';

const CambioPassword = () => {
    const [mensaje, setMensaje] = useState(null);
    const [tipoMensaje, setTipoMensaje] = useState(null);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [cambiarPasswordInicial] = useMutation(CAMBIAR_PASSWORD_INICIAL);

    const formik = useFormik({
        initialValues: {
            nuevaContrasenia: '',
            confirmarContrasenia: ''
        },
        validationSchema: Yup.object({
            nuevaContrasenia: Yup.string()
                .min(8, 'La contraseña debe tener al menos 8 caracteres')
                .required('La nueva contraseña es obligatoria'),
            confirmarContrasenia: Yup.string()
                .oneOf([Yup.ref('nuevaContrasenia'), null], 'Las contraseñas deben coincidir')
                .required('Confirmar contraseña es obligatorio')
        }),
        onSubmit: async valores => {
            const { nuevaContrasenia } = valores;
            setIsLoading(true);

            try {
                await cambiarPasswordInicial({
                    variables: {
                        nuevaContrasenia
                    },
                    context: {
                        headers: {
                            authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                });

                setTipoMensaje('exito');
                setMensaje('Contraseña actualizada correctamente. Redirigiendo...');

                setTimeout(() => {
                    router.push('/Homepage');
                }, 1500);

            } catch (error) {
                setMensaje(error.message || 'Error al cambiar contraseña');
                setTipoMensaje('error');
                setIsLoading(false);

                setTimeout(() => {
                    setMensaje(null);
                    setTipoMensaje(null);
                }, 5000);
            }
        }
    });

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#e25822] mb-2">Cambio de Contraseña Obligatorio</h1>
                    <p className="text-gray-600">
                        Por seguridad, debes cambiar tu contraseña inicial antes de continuar.
                    </p>
                </div>

                {mensaje && (
                    <div className={`mb-6 p-3 rounded text-center 
                        ${tipoMensaje === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {mensaje}
                    </div>
                )}

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="nuevaContrasenia" className="block font-medium mb-1 text-gray-700">
                            Nueva Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={mostrarPassword ? "text" : "password"}
                                id="nuevaContrasenia"
                                name="nuevaContrasenia"
                                autoComplete="new-password"
                                placeholder="Ingresa tu nueva contraseña"
                                value={formik.values.nuevaContrasenia}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full border p-4 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e25822]/50 focus:border-transparent transition-all duration-200
                                    ${formik.touched.nuevaContrasenia && formik.errors.nuevaContrasenia ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                className="absolute right-3 top-1/4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 focus:outline-none"
                                tabIndex={-1}
                                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                <div className="flex items-center justify-center h-6 w-6">
                                    {mostrarPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </div>
                            </button>
                        </div>
                        {formik.touched.nuevaContrasenia && formik.errors.nuevaContrasenia && (
                            <div className="text-red-500 text-sm mt-1">
                                {formik.errors.nuevaContrasenia}
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmarContrasenia" className="block font-medium mb-1 text-gray-700">
                            Confirmar Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={mostrarConfirmPassword ? "text" : "password"}
                                id="confirmarContrasenia"
                                name="confirmarContrasenia"
                                autoComplete="new-password"
                                placeholder="Confirma tu nueva contraseña"
                                value={formik.values.confirmarContrasenia}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full border p-4 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e25822]/50 focus:border-transparent transition-all duration-200
                                    ${formik.touched.confirmarContrasenia && formik.errors.confirmarContrasenia ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                                className="absolute right-3 top-1/4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 focus:outline-none"
                                tabIndex={-1}
                                aria-label={mostrarConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                <div className="flex items-center justify-center h-6 w-6">
                                    {mostrarConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </div>
                            </button>
                        </div>
                        {formik.touched.confirmarContrasenia && formik.errors.confirmarContrasenia && (
                            <div className="text-red-500 text-sm mt-1">
                                {formik.errors.confirmarContrasenia}
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Requisito:</strong> La contraseña debe tener mínimo 8 caracteres.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-[#e25822] text-white py-4 px-6 rounded-lg 
                                      hover:bg-[#c43e11] transition duration-300 font-semibold text-lg
                                      flex items-center justify-center shadow-lg
                                      ${isLoading ? 'cursor-not-allowed opacity-75' : 'hover:shadow-xl'}`}
                        >
                            {isLoading ? (
                                <>
                                    <BiLoaderAlt className="animate-spin mr-3 text-xl" />
                                    Cambiando...
                                </>
                            ) : (
                                'Cambiar Contraseña'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CambioPassword;