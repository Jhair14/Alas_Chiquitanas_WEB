"use client";
import dynamic from 'next/dynamic';

const MapasClient = dynamic(() => import('./MapaDeSeguimiento'), { ssr: false });

export default function ClientMapas() {
	return <MapasClient />;
} 