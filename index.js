import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ApolloServer } from "apollo-server-express";
import typeDefs from "./schemas/schema.js";
import resolvers from "./resolvers/resolvers.js";

dotenv.config();

async function start() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  try {
    const password = encodeURIComponent(process.env.DB_PASSWORD);

    const DB_CONNECTION = `mongodb+srv://${process.env.DB_USER_NAME}:${password}@${process.env.HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

    console.log(
      "Connecting to:",
      `mongodb+srv://${process.env.DB_USER_NAME}:***@${process.env.HOST}/${process.env.DB_NAME}`
    );

    await mongoose.connect(DB_CONNECTION, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  server.applyMiddleware({ app, path: "/graphql" });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

start().catch((err) => console.error("Startup error:", err));