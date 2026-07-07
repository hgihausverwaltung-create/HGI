function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Fehlende Umgebungsvariable: ${name}`);
  return value;
}

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173", // apps/web (Vite)
  "http://localhost:8081", // apps/mobile (Expo web dev server)
  "http://localhost:8082", // apps/mobile (static export, local verification)
  "http://localhost:19006", // apps/mobile (Expo classic web dev port)
];

export const env = {
  jwtSecret: required("JWT_SECRET"),
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) : DEFAULT_CORS_ORIGINS,
};
