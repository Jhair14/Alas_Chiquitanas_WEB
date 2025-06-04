"use client"
import "./globals.css";
//master page, pagina principal
//children envia parametros, para enviar parametros
import { ApolloProvider } from '@apollo/client';
import client from '../app/config/apollo';
export default function RootLayout({ children }) {
  return (
      <ApolloProvider client={client}>
        <html lang="en">
        <head>
          <title>Alas Chiquitanas</title>
        </head>
        <body>
        <div className="bg-slate-200">
          {children}
        </div>
        </body>
        </html>
      </ApolloProvider>
  );
}
