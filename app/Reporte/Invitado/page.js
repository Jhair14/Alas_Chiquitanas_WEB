import { Suspense } from 'react';
import ClientReporteInvitado from './ClientReporteInvitado';

export default function ReportePage() {
    return (
        <Suspense fallback={null}>
            <ClientReporteInvitado />
        </Suspense>
    );
}

