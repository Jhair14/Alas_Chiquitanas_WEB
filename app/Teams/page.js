// app/Teams/page.js
import { Suspense } from 'react';
import Teams from './Teams';

export default function TeamsPage() {
    return (
        <Suspense fallback={null}>
            <Teams />
        </Suspense>
    );
}
