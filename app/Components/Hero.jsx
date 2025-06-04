import React from 'react';

const Hero = () => {
    return (
        <section
            className="bg-cover bg-center text-white py-24 px-8 rounded-lg mb-10 relative"
            style={{
                backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("https://via.placeholder.com/1600x800")',
                backgroundBlendMode: 'overlay'
            }}
        >
            <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-4xl mb-4 font-bold">Sistema de Seguimiento y Colaboración en Incendios</h2>
                <p className="text-lg mb-8 max-w-3xl mx-auto">Coordinando equipos de auxilio y brigadas de ayuda para zonas afectadas por incendios en Bolivia</p>
                <div className="flex justify-center gap-5">
                    {[
                        { href: "mapa.html", label: "Ver mapa en tiempo real", primary: true },
                        { href: "/Reporte", label: "Reporte Rapido" }                    ].map(({ href, label, primary }) => (
                        <a
                            key={href}
                            href={href}
                            className={`
                                py-2 px-6 rounded-lg transition-colors
                                ${primary
                                ? 'bg-[#e25822] text-white hover:bg-[#c43e11]'
                                : 'bg-white text-[#e25822] border-2 border-[#e25822] hover:bg-[#f8f8f8]'}
                            `}
                        >
                            {label}
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Hero;