import {ApolloClient, createHttpLink, InMemoryCache} from "@apollo/client";

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: createHttpLink({
        uri: "http://34.28.246.100:4000/",
        //uri: "http://localhost:4000/",
        fetch
    })
})
export default client;