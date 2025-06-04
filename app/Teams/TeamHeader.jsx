"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
const TeamHeader = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token); // convierte a true/false directamente
    }, []);

    const LogoIcon = () => (
        <a href={isAuthenticated ? "/Homepage" : "/"}>
            <div className="flex items-center">
                <svg viewBox="0 0 100 100" width="60" height="60" className="mr-3">
                    <circle cx="50" cy="50" r="45" fill="#e25822" />
                    <path
                        d="M50 20 C 60 40 80 50 60 80 C 50 60 30 50 50 20"
                        fill="#ffcc00"/>
                    <path d="M50 20 C 40 40 20 50 40 80 C 50 60 70 50 50 20"
                          fill="#ffcc00"/>
                </svg>
                <span className="text-2xl text-[#e25822] font-bold">
                    Alas Chiquitanas
                </span>
            </div>
        </a>
    );

    return (
        <header className="bg-white shadow-md py-4 px-5 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center space-x-2">
                <LogoIcon />

            </div>

        </header>
    );
};

export default TeamHeader;