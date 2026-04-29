const { URL } = require("url");
require("dotenv").config();

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function getFirstEnv(keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return undefined;
}

function parseDatabaseUrl(connectionString) {
  if (!connectionString) return null;
  try {
    const url = new URL(connectionString);
    const auth = {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: url.username || undefined,
      password: url.password || undefined,
      database: url.pathname ? url.pathname.replace(/^\//, "") : undefined
    };
    if (url.searchParams.get("ssl") === "true") {
      auth.ssl = { rejectUnauthorized: false };
    }
    return auth;
  } catch (error) {
    return null;
  }
}

function getDatabaseConfig() {
  const urlConfig = parseDatabaseUrl(getFirstEnv(["DATABASE_URL", "MYSQL_URL"]));
  
  const rawConfig = {
    host: getFirstEnv(["DB_HOST", "MYSQLHOST"]),
    port: Number(getFirstEnv(["DB_PORT", "MYSQLPORT"])) || undefined,
    user: getFirstEnv(["DB_USER", "MYSQLUSER"]),
    password: getFirstEnv(["DB_PASSWORD", "MYSQLPASSWORD"]),
    database: getFirstEnv(["DB_DATABASE", "DB_NAME", "MYSQLDATABASE"])
  };

  // Prioritize URL config if individual variables are missing
  return {
    host: rawConfig.host || urlConfig?.host,
    port: rawConfig.port || urlConfig?.port || 3306,
    user: rawConfig.user || urlConfig?.user,
    password: rawConfig.password || urlConfig?.password,
    database: rawConfig.database || urlConfig?.database,
    ssl: urlConfig?.ssl || { rejectUnauthorized: false } // Default to SSL for Railway
  };
}

module.exports = { parseBoolean, getDatabaseConfig };
