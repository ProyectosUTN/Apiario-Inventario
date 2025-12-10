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

  type Colmena {
    id: ID!
    apiarioID: String
    cantidadAlzas: Int
    codigo: String
    edadReinaMeses: Int
    estado: Boolean
    fechaInstalacion: String
    notas: String
    origenReina: String
    tipo: String
  }

  type Cosecha {
    id: ID!
    cantidadKg: Float
    colmenaId: String
    fecha: String
    floracion: String
    humedad: Float
    metodo: String
    notas: String
    operador: String
    panalesExtraidos: Int
    tipoMiel: String
    creadoEn: String
  }

  input InventoryItemInput {
    nombre: String
    descripcion: String
    cantidad: Float
    unidad: String
    tipo: String
  }

  input ColmenaInput {
    apiarioID: String
    cantidadAlzas: Int
    codigo: String
    edadReinaMeses: Int
    estado: Boolean
    fechaInstalacion: String
    notas: String
    origenReina: String
    tipo: String
  }

  input CosechaInput {
    cantidadKg: Float
    colmenaId: String
    fecha: String
    floracion: String
    humedad: Float
    metodo: String
    notas: String
    operador: String
    panalesExtraidos: Int
    tipoMiel: String
  }

  type Query {
    insumos: [InventoryItem!]!
    insumo(id: ID!): InventoryItem
    colmenas: [Colmena!]!
    colmena(id: ID!): Colmena
    cosechas: [Cosecha!]!
    cosecha(id: ID!): Cosecha
    cosechasPorColmena(colmenaId: String!): [Cosecha!]!
  }

  type Mutation {
    createInsumo(input: InventoryItemInput!): InventoryItem!
    updateInsumo(id: ID!, input: InventoryItemInput!): InventoryItem!
    deleteInsumo(id: ID!): Boolean!
    createColmena(input: ColmenaInput!): Colmena!
    updateColmena(id: ID!, input: ColmenaInput!): Colmena!
    deleteColmena(id: ID!): Boolean!
    createCosecha(input: CosechaInput!): Cosecha!
    updateCosecha(id: ID!, input: CosechaInput!): Cosecha!
    deleteCosecha(id: ID!): Boolean!
  }
`;

// Helper function to convert Firestore references to path strings and Timestamps to ISO strings
const convertFirestoreReferences = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    // Check if value is a Firestore DocumentReference
    if (value && typeof value === 'object' && value._firestore && value._path) {
      result[key] = value.path;
    }
    // Check if value is a Firestore Timestamp
    else if (value && typeof value.toDate === 'function') {
      result[key] = value.toDate().toISOString().split('T')[0];
    }
    else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = convertFirestoreReferences(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

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
    colmenas: async () => {
      try {
        console.log("Fetching all colmenas from Firestore...");
        const snapshot = await db.collection("colmenas").get();
        console.log(`Found ${snapshot.docs.length} colmenas in Firestore`);
        const result = snapshot.docs.map((doc) => {
          const data = convertFirestoreReferences(doc.data());
          return {
            id: doc.id,
            ...data,
          };
        });
        console.log("Returning colmenas:", result);
        return result;
      } catch (error) {
        console.error("Error fetching colmenas:", error);
        throw new Error("Failed to fetch colmenas");
      }
    },
    colmena: async (_, { id }) => {
      try {
        const doc = await db.collection("colmenas").doc(id).get();
        if (!doc.exists) return null;
        const data = convertFirestoreReferences(doc.data());
        return { id: doc.id, ...data };
      } catch (error) {
        console.error("Error fetching colmena:", error);
        throw new Error("Failed to fetch colmena");
      }
    },
    cosechas: async () => {
      try {
        console.log("Fetching all cosechas from Firestore...");
        const snapshot = await db.collection("cosechas").get();
        console.log(`Found ${snapshot.docs.length} cosechas in Firestore`);
        const result = snapshot.docs.map((doc) => {
          const data = convertFirestoreReferences(doc.data());
          return {
            id: doc.id,
            ...data,
          };
        });
        console.log("Returning cosechas:", result);
        return result;
      } catch (error) {
        console.error("Error fetching cosechas:", error);
        throw new Error("Failed to fetch cosechas");
      }
    },
    cosecha: async (_, { id }) => {
      try {
        const doc = await db.collection("cosechas").doc(id).get();
        if (!doc.exists) return null;
        const data = convertFirestoreReferences(doc.data());
        return {
          id: doc.id,
          ...data,
        };
      } catch (error) {
        console.error("Error fetching cosecha:", error);
        throw new Error("Failed to fetch cosecha");
      }
    },
    cosechasPorColmena: async (_, { colmenaId }) => {
      try {
        console.log(`Fetching cosechas for colmena: ${colmenaId}`);
        // Create reference from the colmenaId path
        const colmenaRef = db.doc(colmenaId);
        const snapshot = await db.collection("cosechas")
          .where("colmenaId", "==", colmenaRef)
          .get();
        console.log(`Found ${snapshot.docs.length} cosechas for colmena ${colmenaId}`);
        const result = snapshot.docs.map((doc) => {
          const data = convertFirestoreReferences(doc.data());
          return {
            id: doc.id,
            ...data,
          };
        });
        return result;
      } catch (error) {
        console.error("Error fetching cosechas por colmena:", error);
        throw new Error("Failed to fetch cosechas por colmena");
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
    createColmena: async (_, { input }, context) => {
      try {
        console.log("Creating colmena:", input, "User:", context.user?.uid || "anonymous");

        const newColmena = {
          ...input,
          creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("colmenas").add(newColmena);
        const doc = await docRef.get();

        console.log("Created colmena with ID:", doc.id);
        return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.error("Error creating colmena:", error);
        throw new Error("Failed to create colmena");
      }
    },
    updateColmena: async (_, { id, input }, context) => {
      try {
        console.log("Updating colmena:", id, input, "User:", context.user?.uid || "anonymous");

        await db.collection("colmenas").doc(id).update(input);
        const doc = await db.collection("colmenas").doc(id).get();

        return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.error("Error updating colmena:", error);
        throw new Error("Failed to update colmena");
      }
    },
    deleteColmena: async (_, { id }, context) => {
      try {
        console.log("Deleting colmena:", id, "User:", context.user?.uid || "anonymous");

        await db.collection("colmenas").doc(id).delete();
        return true;
      } catch (error) {
        console.error("Error deleting colmena:", error);
        throw new Error("Failed to delete colmena");
      }
    },
    createCosecha: async (_, { input }, context) => {
      try {
        console.log("Creating cosecha:", input, "User:", context.user?.uid || "anonymous");

        // Convert colmenaId path string to Firestore reference
        const newCosecha = {
          ...input,
          colmenaId: input.colmenaId ? db.doc(input.colmenaId) : null,
          creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("cosechas").add(newCosecha);
        const doc = await docRef.get();
        const data = convertFirestoreReferences(doc.data());

        console.log("Created cosecha with ID:", doc.id);
        return {
          id: doc.id,
          ...data,
        };
      } catch (error) {
        console.error("Error creating cosecha:", error);
        throw new Error("Failed to create cosecha");
      }
    },
    updateCosecha: async (_, { id, input }, context) => {
      try {
        console.log("Updating cosecha:", id, input, "User:", context.user?.uid || "anonymous");

        // Convert colmenaId path string to Firestore reference
        const updateData = {
          ...input,
          colmenaId: input.colmenaId ? db.doc(input.colmenaId) : null,
        };

        await db.collection("cosechas").doc(id).update(updateData);
        const doc = await db.collection("cosechas").doc(id).get();
        const data = convertFirestoreReferences(doc.data());

        return {
          id: doc.id,
          ...data,
        };
      } catch (error) {
        console.error("Error updating cosecha:", error);
        throw new Error("Failed to update cosecha");
      }
    },
    deleteCosecha: async (_, { id }, context) => {
      try {
        console.log("Deleting cosecha:", id, "User:", context.user?.uid || "anonymous");

        await db.collection("cosechas").doc(id).delete();
        return true;
      } catch (error) {
        console.error("Error deleting cosecha:", error);
        throw new Error("Failed to delete cosecha");
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
