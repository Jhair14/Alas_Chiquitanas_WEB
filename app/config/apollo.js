import {ApolloClient, createHttpLink, InMemoryCache} from "@apollo/client";

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: createHttpLink({
        uri: "https://alaschiquitanasapi-production.up.railway.app/",
        fetch
    })
})
export default client;
