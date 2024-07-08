import { createClient } from "redis";

const createRedisClient = async () => {
  const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  redisClient.on("connect", () => {
    console.log("Connected to Redis");
  });

  await redisClient.connect();
  return redisClient;
};

export default createRedisClient;
