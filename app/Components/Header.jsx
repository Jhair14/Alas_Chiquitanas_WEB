import React from 'react';

const Header = () => {
    return (
        <header className="bg-white shadow-md py-4 px-5 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center">
                    <svg className="mr-3" viewBox="0 0 100 100" width="60" height="60">
                        <circle cx="50" cy="50" r="45" fill="#e25822" />
                        <path d="M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20" fill="#ffcc00" />
                        <path d="M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20" fill="#ffcc00" />
                    </svg>
                    <h1 className="text-2xl text-[#e25822]">Alas Chiquitanas</h1>
                </div>
            <nav>
                <ul className="flex space-x-4">
                    {[
                        { href: "/Register", label: "Registrate" },
                        { href: "/Login", label: "Login" },
                    ].map(({ href, label }) => (
                        <li key={href}>
                            <a
                                href={href}
                                className="text-gray-700 hover:bg-[#e25822] hover:text-white px-3 py-2 rounded-md transition-colors"
                            >
                                {label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
};

export default Header;