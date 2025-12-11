import dotenv from "dotenv";
import express from "express";
import { getDatabase, closeDatabase } from "./database/connection";
import { MigrationRunner } from "./database/migrations";
import path from "path";
import applicationsRouter from "./routes/applications";
import companiesRouter from "./routes/companies";
import contactsRouter from "./routes/contacts";
import notesRouter from "./routes/notes";
import { errorHandler, NotFoundError } from "./middleware/errorHandler";

dotenv.config();
const app = express();

app.use(express.json());

// Initialize database on startup
async function startServer() {
  try {
    console.log("Initializing database...");

    // Run migrations
    const db = getDatabase();
    const migrationsDir = path.join(process.cwd(), "migrations");
    const runner = new MigrationRunner(db, migrationsDir);
    runner.runAll();

    console.log("Database initialized successfully");

    // Routes
    app.use("/applications", applicationsRouter);
    app.use("/companies", companiesRouter);
    app.use("/contacts", contactsRouter);
    app.use("/notes", notesRouter);

    app.get("/", (req, res) => {
      return res.json({
        data: {
          message: "Job Tracker API",
          version: "1.0.0",
          endpoints: {
            health: "/health",
            applications: "/applications",
            companies: "/companies",
            contacts: "/contacts",
            notes: "/notes",
            docs: "See README.md for API documentation",
          },
        },
      });
    });

    app.get("/health", (req, res) => {
      return res.json({
        data: {
          status: "healthy",
          database: "connected",
          timestamp: new Date().toISOString(),
        },
      });
    });

    // 404 handler for unknown routes
    app.use((req, _res, next) => {
      next(new NotFoundError(`Route '${req.path}' not found`));
    });

    // Central error handler (must be last)
    app.use(errorHandler);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("\nShutting down gracefully...");
      closeDatabase();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("\nShutting down gracefully...");
      closeDatabase();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
