"use client";
import dynamic from 'next/dynamic';

const HistorialClient = dynamic(() => import('./HistorialReportes'), { ssr: false });

export default function ClientHistorialReportes() {
	return <HistorialClient />;
} 