import { Suspense } from 'react';
import ClientReporteUsuario from './ClientReporteUsuario';

export default function ReportePage() {
    return (
        <Suspense fallback={null}>
            <ClientReporteUsuario />
        </Suspense>
    );
}

