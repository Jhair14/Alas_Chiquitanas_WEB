"use client"
import Index from './Index/Index';
import { ApolloProvider } from '@apollo/client';
import client from '../app/config/apollo';
function UsuarioPage() {
    return(
        <ApolloProvider client={client}>
        <Index />
        </ApolloProvider>
    );
}

export default UsuarioPage;