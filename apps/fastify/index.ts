import Fastify from "fastify";
import FastifyCors from "@fastify/cors";
import FastifyWebSocket from "@fastify/websocket";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter } from "@midwifes-notebook/trpc";

const fastify = Fastify({ logger: true });

fastify.register(FastifyCors);
fastify.register(FastifyWebSocket);
fastify.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter },
});

await fastify.listen({ port: 3001, host: "0.0.0.0" });
