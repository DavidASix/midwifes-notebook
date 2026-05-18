import Fastify from "fastify";

const fastify = Fastify({ logger: true });

fastify.get("/", async () => {
  return { message: "Hello World!" };
});

await fastify.listen({ port: 3001, host: "0.0.0.0" });
