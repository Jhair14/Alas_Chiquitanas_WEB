import {ApolloProvider} from "@apollo/client";
import client from "@/app/config/apollo";
import DatosEstadisticos from "../Admin/DatosEstadisticosAdmin"

function DatosAdmin() {
    return <DatosEstadisticos />;
}



export default DatosAdmin;