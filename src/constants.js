export const dbName = "memotalk";
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || true,
  sameSite: "None",
};
