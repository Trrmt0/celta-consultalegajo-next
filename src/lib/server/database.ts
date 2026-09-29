import "server-only";
import { readFile } from "node:fs/promises";
import sql from "mssql";
import { formatPerson, type PersonRow, type SearchKind } from "../personas";

const state = globalThis as typeof globalThis & { celtaPool?: Promise<sql.ConnectionPool> };
async function configuration(): Promise<sql.config> {
  // La configuración privada local está fuera de la carpeta compartida y de Git.
  const path = process.env.CELTA_SQL_CONFIG_FILE;
  if (!path) throw new Error("SQL_NOT_CONFIGURED");
  const settings = JSON.parse(await readFile(path, "utf8"));
  if (!settings.server || !settings.user || !settings.password) throw new Error("SQL_NOT_CONFIGURED");
  return { ...settings, database: "CELTA_COM_PROD", connectionTimeout: 10000, requestTimeout: 15000,
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    options: { ...settings.options, appName: "CELTA.Consultalegajo.Next", readOnlyIntent: true } };
}
async function pool() {
  if (!state.celtaPool) {
    state.celtaPool = (async () => {
      const connection = new sql.ConnectionPool(await configuration());
      connection.on("error", () => { /* No registrar mensajes SQL ni credenciales. */ });
      try { return await connection.connect(); }
      catch { await connection.close().catch(() => {}); throw new Error("SQL_CONNECTION_FAILED"); }
    })().catch(error => { state.celtaPool = undefined; throw error; });
  }
  return state.celtaPool;
}
const queries: Record<SearchKind, string> = {
  persona: "SELECT SucCod,CliCod,CliSisAnt,CliApe,CliNom,CliDocNro,CliCuit FROM dbo.PERSONA WHERE CliCod=@value ORDER BY SucCod",
  dni: "SELECT SucCod,CliCod,CliSisAnt,CliApe,CliNom,CliDocNro,CliCuit FROM dbo.PERSONA WHERE CliDocNro=@value ORDER BY CliCod,SucCod",
  cuit: "SELECT SucCod,CliCod,CliSisAnt,CliApe,CliNom,CliDocNro,CliCuit FROM dbo.PERSONA WHERE CliCuit=@value ORDER BY CliCod,SucCod",
};
export async function searchPeople(kind: SearchKind, value: number, signal: AbortSignal) {
  const connection = await pool();
  signal.throwIfAborted();
  const request = connection.request().input("value", kind === "cuit" ? sql.Decimal(11,0) : sql.Int, value);
  const cancel = () => { request.cancel(); };
  signal.addEventListener("abort", cancel, { once: true });
  try { const result = await request.query<PersonRow>(queries[kind]); return result.recordset.map(formatPerson); }
  finally { signal.removeEventListener("abort", cancel); }
}
