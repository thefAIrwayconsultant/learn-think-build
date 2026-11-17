import express, { type Express } from "express";
import cors from "cors";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import pinoHttp from "pino-http";
import router from "./routes";
import stripeWebhookRouter from "./routes/stripe-webhook";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();
const frontendDirectory = fileURLToPath(
  new URL("../../ai-explorer/dist/public/", import.meta.url),
);
const frontendIndexPath = join(frontendDirectory, "index.html");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);
// Stripe signatures must be checked against the exact raw request bytes.
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found." });
});

// Serve the built Vite app from this same Node process. Keep this after /api
// routes so API responses and the API 404 never fall through to index.html.
app.use(express.static(frontendDirectory, { index: false }));
app.get("/{*splat}", (req, res, next) => {
  // Missing asset files should remain 404s instead of returning the SPA shell.
  if (extname(req.path)) {
    next();
    return;
  }
  res.sendFile(frontendIndexPath, (error) => {
    if (error) next(error);
  });
});

app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  req.log.error({ err: error }, "Request failed");
  res.status(500).json({ error: "Something went wrong while saving your work. Please try again." });
});

export default app;
