import { parseSearch } from "@/lib/personas";
import { searchPeople } from "@/lib/server/database";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function POST(request: Request) {
  // Hasta implementar las cuentas, habilitado solamente en el desarrollo local.
  // No habilitar en producción eliminando esta condición: sustituirla por autorización.
  const origin = new URL(request.url).origin;
  const hostname = new URL(request.url).hostname;
  if (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(hostname) ||
      request.headers.get("origin") !== origin || request.headers.get("x-celta-request") !== "consulta" ||
      request.headers.has("forwarded") || (request.headers.get("x-forwarded-for") ?? "").split(",").some(ip => ip.trim() && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip.trim()))) {
    return reply({ error: "El acceso requiere configurar el inicio de sesión. Utilice la prueba local." }, 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ error: "Solicitud no válida." }, 415);
  let input;
  try {
    const text = await request.text();
    if (text.length > 1024) return reply({ error: "Solicitud demasiado larga." }, 413);
    input = JSON.parse(text);
  } catch { return reply({ error: "Solicitud no válida." }, 400); }
  const parsed = parseSearch(input?.tipo, input?.valor);
  if (!parsed) return reply({ error: "Ingrese un número válido para la búsqueda seleccionada." }, 400);
  try { return reply({ personas: await searchPeople(parsed.kind, parsed.value, request.signal) }); }
  catch {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    return reply({ error: "No se pudo realizar la consulta. Verifique la conexión o comuníquese con Sistemas." }, 503);
  }
}
