"use client";
import dynamic from 'next/dynamic';

const ReporteUsuariosClient = dynamic(() => import('./ReporteDeIncidentesUsuarioRegistrados'), { ssr: false });

export default function ClientReporteUsuario() {
	return <ReporteUsuariosClient />;
} 