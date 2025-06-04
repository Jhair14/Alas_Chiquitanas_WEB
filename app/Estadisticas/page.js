import {ApolloProvider} from "@apollo/client";
import client from "@/app/config/apollo";
import DatosEstadisticos from "../Estadisticas/DatosEstadisticos"

function Estadisticos() {
    return <DatosEstadisticos />;
}



export default Estadisticos;