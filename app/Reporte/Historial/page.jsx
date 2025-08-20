import { Suspense } from 'react';
import ClientHistorialReportes from './ClientHistorialReportes';

export default function ReportePage() {
	return (
		<Suspense fallback={null}>
			<ClientHistorialReportes />
		</Suspense>
	);
}

