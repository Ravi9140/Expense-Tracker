import { ApolloServer } from "@apollo/server";
import {startStandaloneServer} from "@apollo/server/standalone";

import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv'

import { expressMiddleware} from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import mergedResolvers from "./resolvers/index.js";
import mergedTypeDefs from "./typeDefs/index.js";
import { connectDB } from "./db/connectDB.js";

dotenv.config()

const app = express()

const httpServer = http.createServer(app)

const server = new ApolloServer({
    typeDefs: mergedTypeDefs,
    resolvers: mergedResolvers,
    plugins: [ApolloServerPluginDrainHttpServer({httpServer})]
})

//Ensure we wait for our server to start
await server.start()

//Setup our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function
app.use(
    '/',
    cors(),
    express.json(),
    // expressMiddleware accepts the same args:
    // an Apollo Server insatance and optional config options
    expressMiddleware(server, {
        context: async( { req }) => ({ req }),
    }),
);

//Modified server startup
await new Promise((resolve) => httpServer.listen({ port: 4000}, resolve));
await connectDB();

console.log("Server ready at http://localhost:4000/")