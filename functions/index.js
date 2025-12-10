const functions = require("firebase-functions");
const { ApolloServer } = require("@apollo/server");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// GraphQL Schema
const typeDefs = `
  type InventoryItem {
    id: ID!
    nombre: String
    descripcion: String
    cantidad: Float
    unidad: String
    tipo: String
    creadoEn: String
  }

  input InventoryItemInput {
    nombre: String
    descripcion: String
    cantidad: Float
    unidad: String
    tipo: String
  }

  type Query {
    insumos: [InventoryItem!]!
    insumo(id: ID!): InventoryItem
  }

  type Mutation {
    createInsumo(input: InventoryItemInput!): InventoryItem!
    updateInsumo(id: ID!, input: InventoryItemInput!): InventoryItem!
    deleteInsumo(id: ID!): Boolean!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    insumos: async () => {
      try {
        console.log("Fetching all insumos from Firestore...");
        const snapshot = await db.collection("insumos").get();
        console.log(`Found ${snapshot.docs.length} insumos in Firestore`);
        const result = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Returning insumos:", result);
        return result;
      } catch (error) {
        console.error("Error fetching insumos:", error);
        throw new Error("Failed to fetch insumos");
      }
    },
    insumo: async (_, { id }) => {
      try {
        const doc = await db.collection("insumos").doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.error("Error fetching insumo:", error);
        throw new Error("Failed to fetch insumo");
      }
    },
  },
  Mutation: {
    createInsumo: async (_, { input }, context) => {
      try {
        // Optional: Check authentication (commented out for development)
        // if (!context.user) {
        //   throw new Error("Authentication required");
        // }
        console.log("Creating insumo:", input, "User:", context.user?.uid || "anonymous");

        const newItem = {
          ...input,
          creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("insumos").add(newItem);
        const doc = await docRef.get();

        console.log("Created insumo with ID:", doc.id);
        return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.error("Error creating insumo:", error);
        throw new Error("Failed to create insumo");
      }
    },
    updateInsumo: async (_, { id, input }, context) => {
      try {
        // Optional: Check authentication (commented out for development)
        // if (!context.user) {
        //   throw new Error("Authentication required");
        // }
        console.log("Updating insumo:", id, input, "User:", context.user?.uid || "anonymous");

        await db.collection("insumos").doc(id).update(input);
        const doc = await db.collection("insumos").doc(id).get();

        return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.error("Error updating insumo:", error);
        throw new Error("Failed to update insumo");
      }
    },
    deleteInsumo: async (_, { id }, context) => {
      try {
        // Optional: Check authentication (commented out for development)
        // if (!context.user) {
        //   throw new Error("Authentication required");
        // }
        console.log("Deleting insumo:", id, "User:", context.user?.uid || "anonymous");

        await db.collection("insumos").doc(id).delete();
        return true;
      } catch (error) {
        console.error("Error deleting insumo:", error);
        throw new Error("Failed to delete insumo");
      }
    },
  },
};

// Context function to extract user from Authorization header
async function context({ req }) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return { user: null };

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return { user: decodedToken };
  } catch (error) {
    console.warn("Invalid token:", error);
    return { user: null };
  }
}

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Apollo Server middleware
let apolloServerStarted = false;
app.use(async (req, res, next) => {
  if (!apolloServerStarted) {
    await server.start();
    apolloServerStarted = true;
  }
  next();
});

app.post("/", async (req, res) => {
  try {
    const contextValue = await context({ req });
    const httpGraphQLResponse = await server.executeOperation(
      {
        query: req.body.query,
        variables: req.body.variables,
        operationName: req.body.operationName,
      },
      {
        contextValue,
      }
    );

    res.status(200).json(httpGraphQLResponse.body);
  } catch (error) {
    console.error("GraphQL execution error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export GraphQL endpoint as Firebase Function (v1)
exports.graphql = functions.https.onRequest(app);
