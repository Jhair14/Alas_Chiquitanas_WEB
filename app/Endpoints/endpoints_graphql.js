import { gql } from '@apollo/client';

export const OBTENER_USUARIO_POR_TOKEN = gql`
  query ObtenerUsuarioPorToken {
    obtenerUsuarioPorToken {
      id
      nombre
      apellido
      ci
      fecha_nacimiento
      genero
      telefono
      email
      tipo_de_sangre
      nivel_de_entrenamiento
      entidad_perteneciente
      creado
      rol
      estado    
      debeCambiarPassword
    }
  }
`;

export const OBTENER_USUARIO = gql`
  query ObtenerUsuario($token: String) {
    obtenerUsuario(token: $token) {
      id
      nombre
      rol
    }
  }
`;

export const OBTENER_USUARIOS = gql`
  query ObtenerUsuarios {
    obtenerUsuarios {
      id
      nombre
      apellido
      email
      rol 
      nivel_de_entrenamiento
      entidad_perteneciente
    }
  }
`;

export const OBTENER_REPORTES = gql`
  query ObtenerReportes {
    obtenerReportes {
      id
      nombre_reportante
      telefono_contacto
      fecha_hora
      nombre_lugar
      ubicacion {
        type
        coordinates
      }
      tipo_incendio
      gravedad_incendio
      comentario_adicional
      cant_bomberos
      cant_paramedicos
      cant_veterinarios
      cant_autoridades
      creado
    }
  }
`;

export const OBTENER_FOCOS = gql`
  query FocosDeCalor($range: String) {
    focosDeCalor(range: $range) {
      latitude
      longitude
      confidence
      acq_date
      acq_time
      bright_ti4
      bright_ti5
      frp
    }
  }
`;
export const OBTENER_NOTICIAS = gql`
  query ObtenerNoticias {
    noticiasIncendios {
      title
      date
      description
      url
      image
    }
  }
`;

export const OBTENER_EQUIPOS = gql`
  query ObtenerEquipos {
    obtenerEquipos {
      id
      nombre_equipo
      ubicacion {
        coordinates
      }
      cantidad_integrantes
      estado
      id_lider_equipo {
        id
        nombre
        apellido
        email
      }
      miembros {
        id
        id_usuario {
          id
          nombre
          apellido
        }
      }
    }
  }
`;

export const AUTENTICAR_USUARIO = gql`
  mutation AutenticarUsuario($input: inputAutenticar) {
    autenticarUsuario(input: $input) {
      token
    }
  }
`;

export const CREAR_CUENTA = gql`
    mutation nuevoUsuario($input: inputUsuario) {
      nuevoUsuario(input: $input) {
        id
        nombre
        apellido
        ci
        fecha_nacimiento
        genero
        telefono
        email
        tipo_de_sangre
        nivel_de_entrenamiento
        entidad_perteneciente
        creado
        rol
        estado
      }
    }
`;

export const SOLICITAR_RECUPERACION = gql`
  mutation solicitarRecuperacionContrasenia($email: String!) {
    solicitarRecuperacionContrasenia(email: $email)
  }
`;

export const CAMBIAR_CONTRASENIA = gql`
  mutation cambiarContrasenia($token: String!, $nuevaContrasenia: String!) {
    cambiarContrasenia(token: $token, nuevaContrasenia: $nuevaContrasenia)
  }
`;

export const CREAR_REPORTE = gql`
    mutation CrearReporte($input: inputReporteRapido) {
        crearReporte(input: $input) {
            id
            nombre_reportante
            fecha_hora
            tipo_incendio
            gravedad_incendio
        }
    }
`;

export const CREAR_REPORTE_INCENDIO = gql`
  mutation crearReporteIncendio($input: inputReporteIncendio!) {
    crearReporteIncendio(input: $input) {
      id
      nombreIncidente
      controlado
      extension
      condicionesClima
      equiposEnUso
      numeroBomberos
      necesitaMasBomberos
      apoyoExterno
      comentarioAdicional
      fechaCreacion
    }
  }
`;

export const ACTUALIZAR_USUARIO = gql`
  mutation ActualizarUsuario($actualizarUsuarioId: ID!, $input: inputUsuario) {
    actualizarUsuario(id: $actualizarUsuarioId, input: $input) {
      id
      nombre
      apellido
      ci
      fecha_nacimiento
      genero
      telefono
      email
      tipo_de_sangre
      nivel_de_entrenamiento
      entidad_perteneciente
      creado
      rol
      estado
    }
  }
`;

export const SOLICITAR_ELIMINACION = gql`
  mutation SolicitarEliminacionCuenta($usuarioId: ID!) {
    solicitarEliminacionCuenta(usuarioId: $usuarioId) {
      id
      estado
    }
  }
`;

export const CREAR_EQUIPO = gql`
  mutation CrearEquipo($input: inputEquipo!) {
    crearEquipo(input: $input) {
      id
      nombre_equipo
      ubicacion {
        coordinates
      }
      cantidad_integrantes
      id_lider_equipo {
        id
        nombre
      }
      estado
    }
  }
`;

export const ACTUALIZAR_EQUIPO = gql`
  mutation ActualizarEquipo($id: ID!, $input: inputEquipo!) {
    actualizarEquipo(id: $id, input: $input) {
      id
      nombre_equipo
      ubicacion {
        coordinates
      }
      cantidad_integrantes
      id_lider_equipo {
        id
        nombre
      }
      estado
    }
  }
`;

export const AGREGAR_MIEMBROS_EQUIPO = gql`
  mutation AgregarMiembrosEquipo($id_equipo: ID!, $miembros: [ID!]!) {
    agregarMiembrosEquipo(id_equipo: $id_equipo, miembros: $miembros) {
      count
      miembros {
        id
        id_usuario {
          id
          nombre
          apellido
        }
      }
    }
  }
`;

export const ELIMINAR_MIEMBRO_EQUIPO = gql`
  mutation EliminarMiembroEquipo($id: ID!) {
    eliminarMiembroEquipo(id: $id)
  }
`;

export const ELIMINAR_EQUIPO = gql`
  mutation eliminarEquipo($eliminarEquipoId: ID!) {
    eliminarEquipo(id: $eliminarEquipoId)
  }
`;

export const TRANSFERIR_LIDERAZGO = gql`
  mutation TransferirLiderazgo($id_equipo: ID!, $nuevo_lider_id: ID!) {
    transferirLiderazgo(id_equipo: $id_equipo, nuevo_lider_id: $nuevo_lider_id) {
      id
      id_lider_equipo {
        id
        nombre
      }
    }
  }
`;

export const OBTENER_USUARIOS_PENDIENTES = gql`
  query obtenerUsuariosPendientes {
    obtenerUsuariosPendientes {
      id
      nombre
      apellido
      ci
      email
      telefono
      entidad_perteneciente
      creado
    }
  }
`;

export const ACTIVAR_CUENTA_USUARIO = gql`
  mutation activarCuentaUsuario($id_usuario: ID!) {
    activarCuentaUsuario(id_usuario: $id_usuario)
  }
`;

export const CAMBIAR_PASSWORD_INICIAL = gql`
  mutation CambiarPasswordInicial($nuevaContrasenia: String!) {
    cambiarPasswordInicial(nuevaContrasenia: $nuevaContrasenia)
  }
`;

export const CREAR_RECURSO = gql`
  mutation CrearRecurso($input: inputRecurso!) {
    crearRecurso(input: $input) {
      id
      descripcion
      fecha_pedido
    }
  }
`;

export const OBTENER_RECURSOS = gql`
  query obtenerRecursosCompletos {
    obtenerRecursosCompletos {
      id
      codigo
      fecha_pedido
      descripcion
      estado_del_pedido
      lat
      lng
      creado
      actualizado
      Equipoid {
        id
        nombre_equipo
        ubicacion {
          coordinates
        }
        cantidad_integrantes
        estado
      }
    }
  }
`;

export const OBTENER_COMUNARIOS_POR_EQUIPO = gql`
  query ObtenerComunariosPorEquipo($Equipoid: ID!) {
    obtenerComunariosApoyoPorEquipo(Equipoid: $Equipoid) {
      id
      nombre
      edad
      entidad_perteneciente
      Equipoid {
        id
        nombre_equipo
      }
    }
  }
`;

export const CREAR_COMUNARIO_APOYO = gql`
  mutation CrearComunarioApoyo($input: inputComunarioApoyo!) {
    crearComunarioApoyo(input: $input) {
      id
      nombre
      edad
      entidad_perteneciente
      Equipoid {
        id
        nombre_equipo
      }
    }
  }
`;

export const ELIMINAR_COMUNARIO_APOYO = gql`
  mutation EliminarComunarioApoyo($id: ID!) {
    eliminarComunarioApoyo(id: $id)
  }
`;
