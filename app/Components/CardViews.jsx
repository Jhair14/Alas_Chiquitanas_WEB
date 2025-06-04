import React from 'react';

const Features = () => {
    const featureData = [
        {
            icon: (
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#e25822" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <path fill="#e25822" d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                    <circle cx="12" cy="12" r="2" fill="#e25822"/>
                </svg>
            ),
            title: 'Monitoreo en Tiempo Real',
            description: 'Visualiza incendios activos en Bolivia con actualizaciones constantes de satélites y reportes locales.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#e25822" d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                </svg>
            ),
            title: 'Datos Estadísticos',
            description: 'Accede a estadísticas detalladas sobre incendios, áreas afectadas y recursos desplegados.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#e25822" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
            ),
            title: 'Coordinación de Equipos',
            description: 'Organiza y coordina brigadas de ayuda y equipos de emergencia de manera eficiente.'
        }
    ];

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {featureData.map((feature, index) => (
                <div
                    key={index}
                    className="bg-white rounded-lg p-6 shadow-md transition-transform hover:-translate-y-2 hover:shadow-lg"
                >
                    <div className="flex justify-center mb-4">
                        {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 text-center mb-3">
                        {feature.title}
                    </h3>
                    <p className="text-gray-600 text-center">
                        {feature.description}
                    </p>
                </div>
            ))}
        </section>
    );
};

export default Features;