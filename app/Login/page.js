'use client';
import Login from '@/app/Login/Login';

export default function LoginPage() {
    const handleLogin = () => {
        window.location.href = '/Homepage';
    };

    return <Login onLogin={handleLogin} />;
}

