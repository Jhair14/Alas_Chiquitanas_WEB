"use client";
import dynamic from 'next/dynamic';

const ReporteInvitado = dynamic(() => import('./ReporteDeIncidentesInvitado'), { ssr: false });

export default function ClientReporteInvitado() {
	return <ReporteInvitado />;
} 