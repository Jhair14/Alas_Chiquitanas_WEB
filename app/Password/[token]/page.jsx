"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from '@apollo/client';
import { CAMBIAR_CONTRASENIA } from '../../Endpoints/endpoints_graphql';

function RecuperarNuevaContrasenia() {
    const router = useRouter();
    const { token } = useParams();
    const [mensaje, setMensaje] = useState(null);
    const [tipoMensaje, setTipoMensaje] = useState(null);

    const [cambiarContrasenia] = useMutation(CAMBIAR_CONTRASENIA);

    const formik = useFormik({
        initialValues: {
            nueva: "",
            confirmar: "",
        },
        validationSchema: Yup.object({
            nueva: Yup.string()
                .min(6, "Debe tener al menos 6 caracteres")
                .required("Campo obligatorio"),
            confirmar: Yup.string()
                .oneOf([Yup.ref("nueva"), null], "Las contraseñas no coinciden")
                .required("Campo obligatorio"),
        }),
        onSubmit: async (values) => {
            try {
                const { data } = await cambiarContrasenia({
                    variables: {
                        token,
                        nuevaContrasenia: values.nueva,
                    },
                });
                setMensaje(data.cambiarContrasenia);
                setTipoMensaje("exito");
                setTimeout(() => router.push("/Login"), 3000);
            } catch (error) {
                console.error("Error:", error);
                setMensaje("El enlace expiró o es inválido.");
                setTipoMensaje("error");
                setTimeout(() => {
                    setMensaje(null);
                    setTipoMensaje(null);
                }, 5000);
            }
        },
    });

    const LogoIcon = () => (
        <a href={"/"}>
            <div className="flex items-center">
                <svg viewBox="0 0 100 100" width="60" height="60" className="mr-3">
                    <circle cx="50" cy="50" r="45" fill="#e25822" />
                    <path d="M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20" fill="#ffcc00" />
                    <path d="M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20" fill="#ffcc00" />
                </svg>
                <h1 className="text-2xl text-[#e25822]">Alas Chiquitanas</h1>
            </div>
        </a>
    );

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
            <header className="bg-white shadow p-4 flex items-center justify-between">
                <LogoIcon />
            </header>

            {/* Card centro */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-center text-2xl font-bold text-[#e25822] mb-6">
                        Establecer nueva contraseña
                    </h2>

                    {mensaje && (
                        <div
                            className={`p-3 mb-4 rounded-lg ${
                                tipoMensaje === "exito"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                            }`}
                        >
                            {mensaje}
                        </div>
                    )}

                    <form onSubmit={formik.handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nueva contraseña
                            </label>
                            <input
                                type="password"
                                name="nueva"
                                value={formik.values.nueva}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full border p-3 rounded-lg focus:ring focus:ring-orange-200 focus:border-orange-500 transition ${
                                    formik.touched.nueva && formik.errors.nueva
                                        ? "border-red-400 bg-red-50"
                                        : "border-gray-300"
                                }`}
                            />
                            {formik.touched.nueva && formik.errors.nueva && (
                                <p className="text-red-500 text-sm mt-1">{formik.errors.nueva}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar contraseña
                            </label>
                            <input
                                type="password"
                                name="confirmar"
                                value={formik.values.confirmar}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full border p-3 rounded-lg focus:ring focus:ring-orange-200 focus:border-orange-500 transition ${
                                    formik.touched.confirmar && formik.errors.confirmar
                                        ? "border-red-400 bg-red-50"
                                        : "border-gray-300"
                                }`}
                            />
                            {formik.touched.confirmar && formik.errors.confirmar && (
                                <p className="text-red-500 text-sm mt-1">
                                    {formik.errors.confirmar}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="w-full bg-[#e25822] hover:bg-[#c84315] text-white font-medium px-6 py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {formik.isSubmitting ? (
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
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Guardando...
                                </>
                            ) : (
                                "Cambiar contraseña"
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default RecuperarNuevaContrasenia;
