import React from 'react';

const Footer = () => {
    const links = [
        { href: "Maps", label: "Mapa en Tiempo Real" }
    ];

    return (
        <footer className="bg-[#2d3436] text-white py-8 px-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                    <h3 className="text-[#ffcc00] text-lg mb-4">Alas Chiquitanas</h3>
                    <p>Sistema de Seguimiento y Colaboración en Incendios para Bolivia.</p>
                </div>
                <div>
                    <h3 className="text-[#ffcc00] text-lg mb-4">Enlaces</h3>
                    <ul>
                        {links.map(({ href, label }) => (
                            <li key={href} className="mb-2">
                                <a
                                    href={href}
                                    className="text-white hover:text-[#ffcc00] transition-colors"
                                >
                                    {label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-[#ffcc00] text-lg mb-4">Contacto</h3>
                    <p>Email: <a href="mailto:contacto@alaschiquitanas.org" className="hover:text-[#ffcc00]">contacto@alaschiquitanas.org</a></p>
                    <p>Teléfono: +591 3 123 4567</p>
                </div>
            </div>
            <div className="text-center pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} Alas Chiquitanas. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;