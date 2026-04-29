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
    if (!url.hostname) return null;

    const auth = {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: url.username || undefined,
      password: url.password || undefined,
      database: url.pathname ? url.pathname.replace(/^\//, "") : undefined
    };

    const search = url.searchParams;
    if (search.get("ssl") === "true" || search.get("sslmode") === "require" || search.get("sslcert")) {
      auth.ssl = { rejectUnauthorized: false };
    }

    return auth;
  } catch (error) {
    return null;
  }
}

function getDatabaseConfig() {
  const urlConfig = parseDatabaseUrl(getFirstEnv(["DATABASE_URL", "CLEARDB_DATABASE_URL", "JAWSDB_URL", "MYSQL_URL"]));

  const rawConfig = {
    host: getFirstEnv(["DB_HOST", "MYSQL_HOST", "HOST"]),
    port: Number(getFirstEnv(["DB_PORT", "MYSQL_PORT", "PORT"])) || undefined,
    user: getFirstEnv(["DB_USER", "MYSQL_USER", "USER"]),
    password: getFirstEnv(["DB_PASSWORD", "MYSQL_PASSWORD", "PASSWORD"]),
    database: getFirstEnv(["DB_NAME", "MYSQL_DATABASE", "DATABASE"])
  };

  const sslEnabled = parseBoolean(getFirstEnv(["DB_SSL", "MYSQL_SSL"]), false);
  const sslConfig = sslEnabled
    ? {
        rejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, true)
      }
    : undefined;

  return {
    host: rawConfig.host || urlConfig?.host,
    port: rawConfig.port || urlConfig?.port || 3306,
    user: rawConfig.user || urlConfig?.user,
    password: rawConfig.password || urlConfig?.password,
    database: rawConfig.database || urlConfig?.database,
    ssl: rawConfig.host || rawConfig.user || rawConfig.password || rawConfig.database ? sslConfig : urlConfig?.ssl
  };
}

module.exports = {
  parseBoolean,
  getDatabaseConfig
};
