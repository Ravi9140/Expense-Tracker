import { ApolloServer } from "@apollo/server";
import {startStandaloneServer} from "@apollo/server/standalone";

import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv'

import path from "path";
import passport from "passport";
import session from "express-session";
import connectMongo from "connect-mongodb-session";

import { expressMiddleware} from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import mergedResolvers from "./resolvers/index.js";
import mergedTypeDefs from "./typeDefs/index.js";
import { connectDB } from "./db/connectDB.js";

dotenv.config()

const app = express()

const httpServer = http.createServer(app)

const MongoDBStore = connectMongo(session);

const store = new MongoDBStore({
	uri: process.env.MONGO_URI,
	collection: "sessions",
});

store.on("error", (err) => console.log(err));

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false, // this option specifies whether to save the session to the store on every request
		saveUninitialized: false, // option specifies whether to save uninitialized sessions
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 7,
			httpOnly: true, // this option prevents the Cross-Site Scripting (XSS) attacks
		},
		store: store,
	})
);

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