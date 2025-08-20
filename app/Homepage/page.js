import { Suspense } from 'react';
import ClientHome from './ClientHome';

export default function UsuarioPage() {
    return (
        <Suspense fallback={null}>
            <ClientHome />
        </Suspense>
    );
}

