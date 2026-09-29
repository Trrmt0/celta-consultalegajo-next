export type SearchKind = "persona" | "dni" | "cuit";
export type PersonRow = { SucCod: number; CliCod: number; CliSisAnt: number | null; CliApe: string | null; CliNom: string | null; CliDocNro: number | null; CliCuit: number | null };
export type Person = { sucursal: number; numeroPersona: number; apellido: string; nombre: string; dni: string; cuit: string; clienteAnterior: string; etiqueta: string; legajo: string };
export function parseSearch(kind: unknown, raw: unknown): { kind: SearchKind; value: number } | null {
  if (!["persona", "dni", "cuit"].includes(String(kind)) || typeof raw !== "string" || raw.length > 64) return null;
  const value = raw.replace(/\s/g, "");
  if (kind === "cuit") {
    if (!(/^[0-9]{1,11}$/.test(value) || /^[0-9]{2}-[0-9]{8}-[0-9]$/.test(value))) return null;
  } else if (!/^[0-9]+$/.test(value)) return null;
  const number = Number(value.replaceAll("-", ""));
  return Number.isSafeInteger(number) && number > 0 && number <= (kind === "cuit" ? 99999999999 : 2147483647) ? { kind: kind as SearchKind, value: number } : null;
}
export function formatPerson(row: PersonRow): Person {
  const previous = row.CliSisAnt;
  if (previous !== null && (!Number.isSafeInteger(previous) || previous < 0 || previous > 9999999999)) throw new Error("INVALID_PERSON_DATA");
  const hasPrevious = previous !== null && previous >= 9;
  const raw = String(hasPrevious ? previous : row.CliCod);
  const legajo = hasPrevious && previous < 5500000 ? raw.slice(0, -1) + "/" + raw.slice(-1) : raw;
  const cuit = row.CliCuit === null ? "—" : String(row.CliCuit);
  return { sucursal: row.SucCod, numeroPersona: row.CliCod, apellido: row.CliApe?.trim() || "—", nombre: row.CliNom?.trim() || "—",
    dni: row.CliDocNro === null ? "—" : String(row.CliDocNro),
    cuit: /^[0-9]{11}$/.test(cuit) ? cuit.slice(0,2) + "-" + cuit.slice(2,10) + "-" + cuit.slice(10) : cuit,
    clienteAnterior: hasPrevious ? legajo : "Sin cliente anterior", etiqueta: hasPrevious ? "Número de Cliente" : "Número de Persona", legajo };
}
