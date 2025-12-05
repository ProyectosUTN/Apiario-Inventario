const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const cors = require("cors");

admin.initializeApp(); // en Cloud Functions usa automáticamente las credenciales del proyecto

const db = admin.firestore();

/* ---------------- SCHEMA ---------------- */
const typeDefs = gql`
  type Insumo {
    id: ID!
    nombre: String!
    cantidad: Float!
    unidad: String
    notas: String
    creadoEn: String
  }

  type Producto {
    id: ID!
    nombre: String!
    cantidad: Float!
    unidad: String
    precio: Float
    creadoEn: String
  }

  type ActivityLog {
    id: ID!
    action: String!
    targetType: String!
    targetId: String
    cantidadAntes: Float
    cantidadDespues: Float
    user: String
    timestamp: String
  }

  type Query {
    insumos: [Insumo!]!
    insumo(id: ID!): Insumo
    productos: [Producto!]!
    activityLog(limit: Int): [ActivityLog!]!
  }

  input InsumoInput {
    nombre: String!
    cantidad: Float!
    unidad: String
    notas: String
  }

  input ProductoInput {
    nombre: String!
    cantidad: Float!
    unidad: String
    precio: Float
  }

  type Mutation {
    addInsumo(input: InsumoInput!): Insumo!
    updateInsumo(id: ID!, cantidad: Float): Insumo!
    deleteInsumo(id: ID!): Boolean!

    addProducto(input: ProductoInput!): Producto!
    updateProducto(id: ID!, cantidad: Float): Producto!

    addActivityLog(
      action: String!
      targetType: String!
      targetId: String
      cantidadAntes: Float
      cantidadDespues: Float
      user: String
    ): ActivityLog!
  }
`;

/* ---------------- HELPERS ---------------- */
const snapToArray = (snap) =>
  snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

/* ---------------- RESOLVERS ---------------- */
const resolvers = {
  Query: {
    insumos: async () => {
      const snap = await db.collection("insumos").orderBy("creadoEn", "desc").get();
      return snapToArray(snap);
    },
    insumo: async (_, { id }) => {
      const doc = await db.collection("insumos").doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    productos: async () => {
      const snap = await db.collection("productos").orderBy("creadoEn", "desc").get();
      return snapToArray(snap);
    },
    activityLog: async (_, { limit = 50 }) => {
      const snap = await db.collection("activityLog").orderBy("timestamp", "desc").limit(limit).get();
      return snapToArray(snap);
    }
  },
  Mutation: {
    addInsumo: async (_, { input }) => {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection("insumos").add({
        ...input,
        creadoEn: now
      });
      // registrar en activityLog
      const docBefore = null;
      await db.collection("activityLog").add({
        action: "add",
        targetType: "insumo",
        targetId: ref.id,
        cantidadAntes: null,
        cantidadDespues: input.cantidad,
        user: "system",
        timestamp: now
      });
      const added = await ref.get();
      return { id: ref.id, ...added.data() };
    },

    updateInsumo: async (_, { id, cantidad }) => {
      const docRef = db.collection("insumos").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new Error("Insumo no encontrado");
      const before = doc.data();
      const now = admin.firestore.FieldValue.serverTimestamp();
      await docRef.update({
        ...(cantidad !== undefined ? { cantidad } : {}),
        actualizadoEn: now
      });
      await db.collection("activityLog").add({
        action: "update",
        targetType: "insumo",
        targetId: id,
        cantidadAntes: before.cantidad ?? null,
        cantidadDespues: cantidad ?? before.cantidad,
        user: "system",
        timestamp: now
      });
      const updated = await docRef.get();
      return { id: updated.id, ...updated.data() };
    },

    deleteInsumo: async (_, { id }) => {
      const docRef = db.collection("insumos").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new Error("Insumo no encontrado");
      const before = doc.data();
      const now = admin.firestore.FieldValue.serverTimestamp();
      await docRef.delete();
      await db.collection("activityLog").add({
        action: "delete",
        targetType: "insumo",
        targetId: id,
        cantidadAntes: before.cantidad ?? null,
        cantidadDespues: null,
        user: "system",
        timestamp: now
      });
      return true;
    },

    addProducto: async (_, { input }) => {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection("productos").add({ ...input, creadoEn: now });
      await db.collection("activityLog").add({
        action: "add",
        targetType: "producto",
        targetId: ref.id,
        cantidadAntes: null,
        cantidadDespues: input.cantidad,
        user: "system",
        timestamp: now
      });
      const added = await ref.get();
      return { id: ref.id, ...added.data() };
    },

    updateProducto: async (_, { id, cantidad }) => {
      const docRef = db.collection("productos").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new Error("Producto no encontrado");
      const before = doc.data();
      const now = admin.firestore.FieldValue.serverTimestamp();
      await docRef.update({
        ...(cantidad !== undefined ? { cantidad } : {}),
        actualizadoEn: now
      });
      await db.collection("activityLog").add({
        action: "update",
        targetType: "producto",
        targetId: id,
        cantidadAntes: before.cantidad ?? null,
        cantidadDespues: cantidad ?? before.cantidad,
        user: "system",
        timestamp: now
      });
      const updated = await docRef.get();
      return { id: updated.id, ...updated.data() };
    },

    addActivityLog: async (_, args) => {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const payload = { ...args, timestamp: now };
      const ref = await db.collection("activityLog").add(payload);
      const doc = await ref.get();
      return { id: ref.id, ...doc.data() };
    }
  }
};

/* ---------------- SERVER ---------------- */
async function startServer() {
  const app = express();
  app.use(cors({ origin: true }));

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: "/" });

  // Export como función HTTP para Firebase
  exports.graphql = functions.https.onRequest(app);

  // Para ejecutar local (si llamás `node index.js`):
  if (process.env.FUNCTIONS_EMULATOR) {
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`GraphQL server ready at http://localhost:${port}`);
    });
  }
}

startServer().catch(err => {
  console.error("Error starting server:", err);
});
