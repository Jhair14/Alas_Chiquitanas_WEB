import { useQuery } from '@apollo/client';
import { OBTENER_FOCOS } from '../Endpoints/endpoints_graphql';

export default function FocosStats() {
    const { data, loading, error } = useQuery(OBTENER_FOCOS, {
        variables: { range: "today" },
    });

    if (loading) return <p>Cargando...</p>;
    if (error) return <p>Error al cargar focos</p>;

    const total = data.focosDeCalor.length;

    return (
        <div>
            <h3>Total de focos de calor: {total}</h3>
        </div>
    );
}
