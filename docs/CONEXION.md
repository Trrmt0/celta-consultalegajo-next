# Consultas SQL — etapa de desarrollo local

Tres POST a /api/personas con tipo persona, dni o cuit y valor textual. SQL parametrizado: Int para persona/DNI y Decimal(11,0) para CUIT. Sin TOP ni DISTINCT: se devuelven todas las sucursales y coincidencias. Solo SELECT sobre dbo.PERSONA.

CELTA_SQL_CONFIG_FILE señala un JSON privado en el equipo que ejecuta Node. No poner credenciales en NEXT_PUBLIC_, public, Git o la carpeta compartida. Esta etapa reutiliza las opciones de conexión existentes de C# sin mostrarlas en la consola. El archivo .env.local solo contiene la ruta al JSON privado.

Antes de publicar: implementar el inicio de sesión propio. Actualmente el endpoint falla cerrado en producción y requiere mismo origen y ejecución de desarrollo ligada a 127.0.0.1. No cambiar ese enlace de escucha para exponer esta etapa a la red.

Docker deberá montar su propio archivo secreto de configuración y asignar CELTA_SQL_CONFIG_FILE a la ruta dentro del contenedor; no copiar el secreto local dentro de la imagen. Usar un login SQL con permisos SELECT sobre dbo.PERSONA; readOnlyIntent por sí solo no limita permisos.

Conexión 10 segundos, comando 15 segundos, pool máximo 5. Errores genéricos, respuesta no-store, sin historial del navegador ni logs de identificadores consultados. AbortController evita resultados obsoletos y propaga cancelación a SQL.
