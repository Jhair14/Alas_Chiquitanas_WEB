"use client";
import dynamic from 'next/dynamic';

const UsersTeamClient = dynamic(() => import('./UsersTeam'), { ssr: false });

export default function ClientUsersTeam() {
	return <UsersTeamClient />;
} 