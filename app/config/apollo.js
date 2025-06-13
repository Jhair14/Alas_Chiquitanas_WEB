import {ApolloClient, createHttpLink, InMemoryCache} from "@apollo/client";

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: createHttpLink({
<<<<<<< HEAD
        //uri: "http://34.28.246.100:4000/", // Esta linea de codigo es por si quieres conectarte directo a la api del servidor
=======
        //uri: "http://34.28.246.100:4000/",
>>>>>>> 7a4728cfdfab1d5a412a89a3d8b1965b093a8d02
        uri: "http://localhost:4000/",
        fetch
    })
})
export default client;
