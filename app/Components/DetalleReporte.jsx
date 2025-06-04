// pages/Admin/DetalleReporte/[id].jsx
"use client";
import { useRouter } from 'next/router';
import { gql, useQuery } from '@apollo/client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const GET_REPORTE_VOLUNTARIO = gql`
  query ObtenerReporte($id: ID!) {
    obtenerReporte(id: $id) {
      id
      nombre_reportante
      telefono_contacto
      fecha_hora
      nombre_lugar
      ubicacion { coordinates }
      tipo_incendio
      gravedad_incendio
      comentario_adicional
      creado
      actualizado
    }
  }
`;

const GET_REPORTE_INCENDIO = gql`
  query ObtenerReporteIncendio($id: ID!) {
    obtenerReporteIncendio(id: $id) {
      id
      usuarioid
      nombreIncidente
      ubicacion { coordinates }
      controlado
      extension
      condicionesClima
      equiposEnUso
      numeroBomberos
      necesitaMasBomberos
      apoyoExterno
      comentarioAdicional
      fechaCreacion
      usuario {
        nombre
        apellido
        telefono
      }
    }
  }
`;

export default function DetalleReporte() {
    const router = useRouter();
    const { id } = router.query;
    const { tipo } = router.query;

    const { data, loading, error } = useQuery(
        tipo === 'voluntario' ? GET_REPORTE_VOLUNTARIO : GET_REPORTE_INCENDIO,
        { variables: { id } }
    );

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error.message}</div>;

    const reporte = data?.obtenerReporte || data?.obtenerReporteIncendio;
    if (!reporte) return <div>Reporte no encontrado</div>;

    const generarPDF = () => {
        // Similar al GenerateReportButton pero con más detalles
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">
                Detalles del Reporte {reporte.id}
            </h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                {/* Renderizado condicional según el tipo */}
                {tipo === 'voluntario' ? (
                    // Render para reporte voluntario
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Datos del Reportante</h2>
                        <p>Nombre: {reporte.nombre_reportante}</p>
                        <p>Teléfono: {reporte.telefono_contacto || 'N/A'}</p>

                        <h2 className="text-xl font-semibold mt-4 mb-2">Detalles del Incidente</h2>
                        <p>Lugar: {reporte.nombre_lugar || 'N/A'}</p>
                        <p>Tipo: {reporte.tipo_incendio}</p>
                        <p>Gravedad: {reporte.gravedad_incendio}</p>
                        <p>Comentarios: {reporte.comentario_adicional || 'Ninguno'}</p>
                    </div>
                ) : (
                    // Render para reporte de incendio
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Datos del Brigadista</h2>
                        <p>Nombre: {reporte.usuario?.nombre} {reporte.usuario?.apellido}</p>
                        <p>Teléfono: {reporte.usuario?.telefono || 'N/A'}</p>

                        <h2 className="text-xl font-semibold mt-4 mb-2">Detalles del Incendio</h2>
                        <p>Nombre: {reporte.nombreIncidente || 'N/A'}</p>
                        <p>Extensión: {reporte.extension}</p>
                        <p>Controlado: {reporte.controlado ? 'Sí' : 'No'}</p>
                        <p>Bomberos asignados: {reporte.numeroBomberos}</p>
                        <p>Equipos en uso: {reporte.equiposEnUso?.join(', ') || 'Ninguno'}</p>
                    </div>
                )}

                <button
                    onClick={generarPDF}
                    className="mt-6 bg-[#e25822] text-white px-4 py-2 rounded-md hover:bg-[#c84315]"
                >
                    Generar PDF
                </button>
            </div>
        </div>
    );
}