"use client";
import dynamic from 'next/dynamic';

const HomeClient = dynamic(() => import('./Home'), { ssr: false });

export default function ClientHome() {
	return <HomeClient />;
} 