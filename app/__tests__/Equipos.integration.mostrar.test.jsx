import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import MapaDeSeguimiento from '../Maps/MapaDeSeguimiento';
import { OBTENER_EQUIPOS, OBTENER_FOCOS, OBTENER_REPORTES, OBTENER_USUARIO } from '../Endpoints/endpoints_graphql';

// Mock necesario
const mockToken = 'mock-token';

beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: jest.fn(() => mockToken),
        },
        writable: true,
    });
});

const mocks = [
    {
        request: {
            query: OBTENER_USUARIO,
            variables: { token: mockToken },
        },
        result: {
            data: {
                obtenerUsuario: {
                    id: '1',
                    nombre: 'Admin',
                    rol: 'admin',
                },
            },
        },
    },
    {
        request: {
            query: OBTENER_EQUIPOS,
        },
        result: {
            data: {
                obtenerEquipos: [
                    {
                        id: "1",
                        nombre_equipo: "Equipo Alfa",
                        ubicacion: {
                            coordinates: [-63.1823, -17.7833],
                        },
                        cantidad_integrantes: 5,
                        estado: "activo",
                        id_lider_equipo: {
                            id: "101",
                            nombre: "Juan",
                            apellido: "Perez",
                            email: "juan@example.com", // necesario!
                        },
                        miembros: [
                            {
                                id: "101",
                                id_usuario: {
                                    id: "101",
                                    nombre: "Juan",
                                    apellido: "Perez",
                                },
                            },
                            {
                                id: "102",
                                id_usuario: {
                                    id: "102",
                                    nombre: "Maria",
                                    apellido: "Gomez",
                                },
                            },
                        ],
                    },
                ],
            },
        },
    },
];

test('activa el filtro de equipos correctamente y carga datos del equipo', async () => {
    render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <MapaDeSeguimiento />
        </MockedProvider>
    );

    await waitFor(() => {
        expect(screen.getByText(/Equipos en camino/i)).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText(/Equipos en camino/i);
    expect(checkbox).toBeInTheDocument();
    fireEvent.click(checkbox);

    // Espera que se active el filtro y el mock de equipos haya sido procesado
    await waitFor(() => {
        expect(screen.getByText(/Rango temporal/i)).toBeInTheDocument(); // verificación indirecta
    });
});
