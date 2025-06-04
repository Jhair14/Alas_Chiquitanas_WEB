"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from '@apollo/client';
import { SOLICITAR_RECUPERACION } from '../Endpoints/endpoints_graphql';

function RecuperarContrasenia() {
    const router = useRouter();
    const [mensaje, setMensaje] = useState(null);
    const [tipoMensaje, setTipoMensaje] = useState(null);
    const [enviado, setEnviado] = useState(false);

    const [solicitarRecuperacion] = useMutation(SOLICITAR_RECUPERACION);

    const formik = useFormik({
        initialValues: {
            email: "",
        },
        validationSchema: Yup.object({
            email: Yup.string()
                .email("El email no es válido")
                .required("El email es requerido"),
        }),
        onSubmit: async (values) => {
            try {
                const { data } = await solicitarRecuperacion({
                    variables: { email: values.email },
                });

                setMensaje(data.solicitarRecuperacionContrasenia);
                setTipoMensaje("exito");
                setEnviado(true);
            } catch (error) {
                console.error("Error al solicitar recuperación:", error);
                setMensaje(
                    "Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente."
                );
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
                    <path
                        d="M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20"
                        fill="#ffcc00"
                    />
                    <path
                        d="M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20"
                        fill="#ffcc00"
                    />
                </svg>
                <span className="text-2xl text-[#e25822] font-bold">
                    Alas Chiquitanas
                </span>
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
                    {!enviado ? (
                        <>
                            <h2 className="text-center text-2xl font-bold text-[#e25822] mb-6">
                                Recuperar contraseña
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
                                        Correo electrónico
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="ejemplo@email.com"
                                        name="email"
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={`w-full border p-3 rounded-lg focus:ring focus:ring-orange-200 focus:border-orange-500 transition ${
                                            formik.touched.email && formik.errors.email
                                                ? "border-red-400 bg-red-50"
                                                : "border-gray-300"
                                        }`}
                                    />
                                    {formik.touched.email && formik.errors.email ? (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formik.errors.email}
                                        </p>
                                    ) : null}
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
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
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
                                                    d="M16 12h2a2 2 0 012 2v6H4v-6a2 2 0 012-2h2m4-8v8m0-8L8 8m4-4l4 4"
                                                />
                                            </svg>
                                            Enviar enlace
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10 text-green-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.586l7.879-7.879a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800">
                                ¡Revisa tu correo!
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {mensaje ||
                                    "Te hemos enviado un enlace para restablecer tu contraseña. Si no lo ves, revisa tu carpeta de spam."}
                            </p>
                            <button
                                onClick={() => router.push("/Login")}
                                className="bg-[#e25822] hover:bg-[#c84315] text-white font-medium px-6 py-2 rounded-lg transition"
                            >
                                Volver al inicio de sesión
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default RecuperarContrasenia;