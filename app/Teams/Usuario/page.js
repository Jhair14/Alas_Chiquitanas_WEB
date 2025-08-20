// app/Teams/page.js
import { Suspense } from 'react';
import ClientUsersTeam from './ClientUsersTeam';

function UsersTeamPage() {
    return (
        <Suspense fallback={null}>
            <ClientUsersTeam />
        </Suspense>
    );
}


export default UsersTeamPage;