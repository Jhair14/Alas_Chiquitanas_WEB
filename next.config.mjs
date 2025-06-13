/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['www.washingtonpost.com'],
    },
    async rewrites() {
        return [
            {
                source: '/api/inventario/stock',
                destination: 'https://backenddonaciones.onrender.com/api/inventario/stock',
            },
        ];
    },
};

export default nextConfig;