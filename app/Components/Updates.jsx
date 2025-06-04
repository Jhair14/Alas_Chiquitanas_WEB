import React from 'react';

const LatestUpdates = () => {
    const updates = [
        {
            title: 'Incendio en Chiquitania',
            date: '27 Mar 2025',
            description: 'Nuevo reporte de incendio activo en la región de San Javier.'
        },
        {
            title: 'Brigada de Emergencia',
            date: '25 Mar 2025',
            description: 'Equipo de rescate desplegado para combatir el fuego en Santa Cruz.'
        },
        {
            title: 'Actualización de Recursos',
            date: '22 Mar 2025',
            description: 'Nuevos equipos y vehículos añadidos a la flota de emergencia.'
        }
    ];

    return (
        <section className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-2xl text-[#e25822] mb-6">Últimas Actualizaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {updates.map((update, index) => (
                    <div
                        key={index}
                        className="bg-gray-100 rounded-lg p-4 border-l-4 border-[#e25822]"
                    >
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {update.title}
                        </h3>
                        <div className="text-sm text-gray-500 mb-2">
                            {update.date}
                        </div>
                        <p className="text-gray-600">
                            {update.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default LatestUpdates;