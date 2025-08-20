import { Suspense } from 'react';
import ClientMapas from './ClientMapas';

export default function UsuarioPage() {
    return (
        <Suspense fallback={null}>
            <ClientMapas />
        </Suspense>
    );
}

