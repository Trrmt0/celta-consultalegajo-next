# CELTA — Guía reutilizable para convertir aplicaciones de escritorio en webs internas

Fecha: 25 de septiembre de 2026. Referencia: migración de Consulta de Legajo desde C# a Next.js.

Este documento sirve como especificación inicial para otras aplicaciones y como contexto para un desarrollador o asistente. No contiene contraseñas ni datos de clientes. Las reglas de cada aplicación deben relevarse antes de migrarla: no copiar automáticamente las reglas de legajos a otros sistemas.

## 1. Decisiones acordadas

- Aplicación web interna, accesible desde PC y Android conectados a la red autorizada de CELTA.
- Next.js con App Router y TypeScript para interfaz y servidor.
- Tailwind CSS para el diseño.
- SQL Server existente; consultas realizadas por el servidor, nunca directamente por el navegador.
- Publicación mediante Docker en un servidor que ya aloja otras webs.
- Un administrador externo a este trabajo realiza la instalación en el servidor.
- Entrega solicitada: una **imagen Docker ya construida**, exportada a `.tar`, más instrucciones y ejemplos de configuración sin secretos.
- Para Consulta de Legajo, el usuario decidió **no implementar inicio de sesión**. No crear cuentas ni una base de usuarios para esta aplicación. El acceso se limitará mediante la red y la infraestructura del administrador.
- La decisión de no tener login no debe extenderse automáticamente a aplicaciones con escrituras, acciones operativas u otros requisitos. Confirmar el alcance de cada migración.
- Conservar el proyecto de escritorio y crear la web en una carpeta independiente.
- Avanzar por etapas verificables y explicar los pasos sin dar por conocidos comandos, carpetas o herramientas.

IIS, ASP.NET Core, Razor Pages y el Hosting Bundle pertenecen al enfoque anterior. **No son requisitos de la implementación Next.js + Docker.** Tampoco se necesita instalar una aplicación Android nativa.

## 2. Estado real del proyecto de referencia

| Elemento | Estado al redactar esta guía |
| --- | --- |
| Pantalla CELTA y pestañas Persona, DNI y CUIT | Implementadas; el usuario confirmó su funcionamiento |
| Consultas reales a SQL Server | Implementadas y verificadas en desarrollo local |
| Validación y formatos | 43 comprobaciones de reglas correctas |
| TypeScript y ESLint | Verificados sin errores en la etapa de conexión |
| Credenciales SQL | Fuera del proyecto compartido; archivo privado en la PC que ejecuta Node |
| Inicio de sesión | Descartado por decisión del usuario |
| Acceso en producción sin login | **Pendiente de adaptar** |
| Dockerfile, imagen y prueba en contenedor | **Pendientes** |
| Arquitectura y sistema operativo del Docker del servidor | **Pendientes de confirmar** |
| Dirección interna, proxy, HTTPS y restricciones de red | A coordinar con el administrador |

**Importante:** el código actual de `src/app/api/personas/route.ts` todavía exige desarrollo local y rechaza producción. Contiene un comentario anterior que pide autenticación. Esa intención fue reemplazada por la decisión de funcionar sin login, pero la adaptación de código aún no se realizó. No entregar ese endpoint como listo para producción.

El documento anterior `docs/CONEXION.md` también conserva la indicación de implementar login. Para la decisión funcional vigente, utilizar esta guía. Documentar y corregir esa discrepancia al preparar la publicación.

No afirmar que existe una imagen construida o que la aplicación está publicada hasta haberla construido, probado y entregado.

## 3. Tecnologías y versiones observadas

Versiones del proyecto de referencia, no una recomendación de mantenerlas indefinidamente:

| Herramienta | Versión / configuración |
| --- | --- |
| Node.js de desarrollo | 24.14.1 |
| npm | 11.11.0 |
| Next.js | 16.3.6 |
| React y React DOM | 19.2.8 |
| Tailwind CSS y su plugin PostCSS | Rama 4; resolución exacta en `package-lock.json` |
| TypeScript | Rama 5; resolución exacta en `package-lock.json` |
| mssql | 12.7.2, controlador Tedious por defecto |
| @types/mssql | 12.3.0 |
| server-only | 0.0.1 |
| ESLint / eslint-config-next | Rama 9 / 16.3.6 |

Conservar `package-lock.json` y usar `npm ci` para reproducir la instalación. Al iniciar otra aplicación, revisar las versiones soportadas y los avisos de seguridad. No actualizar dependencias de un proyecto operativo sin probarlo.

Leer `AGENTS.md` de cada proyecto. La versión instalada de Next.js incluye documentación en `node_modules/next/dist/docs/`; consultar las guías correspondientes antes de modificar sus APIs.

## 4. Relevamiento previo de cada aplicación C#

Antes de escribir la web, identificar y documentar:

1. Nombre, propósito y usuarios de la aplicación.
2. Pantallas, pestañas, campos, filtros, botones y resultados.
3. Consultas SQL existentes: tablas, campos, parámetros, orden y relaciones.
4. Reglas de negocio: cálculos, redondeos, límites, formatos y valores especiales.
5. Identidad real de cada registro, incluyendo claves compuestas y sucursal.
6. Manejo de duplicados, múltiples coincidencias, valores nulos y errores.
7. Operaciones de lectura y de escritura, distinguidas explícitamente.
8. Exportación, impresión, archivos, dispositivos o integraciones externas.
9. Credenciales y configuración: ubicar su origen sin volcarlas en documentación.
10. Casos de prueba representativos y resultados esperados de la aplicación original.

Consultar la memoria técnica de CELTA_COM_PROD y la guía visual CELTA cuando estén disponibles. Verificar el esquema real antes de asumir tipos, claves o cardinalidades. Una consulta histórica no demuestra por sí sola cómo está configurada hoy la base.

Las apps que usan Access, Crystal Reports, COM, impresoras locales o DLL exclusivas de Windows requieren analizar sustitutos antes de elegir un contenedor Linux. Docker no convierte automáticamente dependencias de Windows en dependencias Linux.

No traducir XAML línea por línea. Reutilizar las reglas y los resultados esperados; rediseñar la interacción para navegador y pantalla táctil.

## 5. Carpetas y arquitectura

Ubicación actual de referencia:

```text
\\serv-ad03\Cristian Aran\CodigoApps\celta-consultalegajo-next
```

Para nuevos proyectos se prefiere una copia de trabajo local, por ejemplo `C:\Users\aranc\source\repos\celta-nombre-app`, con control de versiones. El uso de una carpeta compartida puede introducir problemas de compilación, permisos y rendimiento.

Estructura base:

```text
public/                         Logo y archivos públicos, nunca secretos
src/
  app/
    layout.tsx                  Idioma, título y estilos globales
    globals.css                 Tailwind y tokens CELTA
    page.tsx                    Pantalla principal
    api/
      personas/route.ts         Endpoint HTTP de referencia
  lib/
    personas.ts                 Tipos, validación y formato puros
    server/
      database.ts               Configuración, pool y consultas SQL
tests/                          Pruebas de reglas y comportamiento
docs/                           Reglas, configuración, pruebas e instalación
package.json
package-lock.json
next.config.ts
.gitignore
.dockerignore
Dockerfile                      A incorporar al preparar Docker
```

Adaptar los nombres del dominio a la aplicación. Separar componentes en `src/components/` si el tamaño lo justifica; no agregar capas que no aporten claridad.

Flujo de información:

```text
Navegador → endpoint Next.js → servicio de consulta → SQL Server
Navegador ← respuesta JSON   ← datos formateados    ← resultados SQL
```

Los componentes interactivos usan `"use client"`. El módulo SQL importa `"server-only"` y no se importa desde la interfaz. Las rutas SQL usan `export const runtime = "nodejs"`; no utilizar Edge para este controlador.

## 6. Crear y ejecutar un proyecto nuevo

Ejecutar en una consola dentro de la carpeta que contendrá el nuevo proyecto. Cambiar `celta-nueva-app` por un nombre en minúsculas y sin espacios:

```bat
npx create-next-app@latest celta-nueva-app --typescript --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*" --yes
cd celta-nueva-app
npm install mssql server-only --save-exact
npm install --save-dev @types/mssql --save-exact
```

Revisar el resultado del generador, las instrucciones locales y el archivo de bloqueo; `latest` puede cambiar respecto de esta guía.

### Problema real encontrado: Turbopack y rutas UNC

En la carpeta compartida, Turbopack interpretó de forma diferente una ruta `\\?\UNC\...` y la raíz del proyecto. Falló el procesamiento de `globals.css`, indicando que `AGENTS.md` estaba fuera de la raíz.

Solución comprobada en este proyecto: usar Webpack para desarrollo:

```json
"dev": "next dev --webpack --hostname 127.0.0.1"
```

Después ejecutar:

```bat
npm run dev
```

Abrir `http://localhost:3000`; usar el puerto informado si 3000 está ocupado. Mantener abierta la consola; detener con Ctrl+C. No borrar `AGENTS.md` ni modificar CSS para ocultar el problema de rutas.

El script de build actual sigue siendo `next build`; el arreglo del script `dev` no modifica la compilación de producción. Para usar Webpack al compilar: `npm run build -- --webpack`. Validar la herramienta elegida dentro de Docker.

## 7. Identidad visual CELTA para web

Interfaz clara y funcional, con fondo gris, paneles blancos y verde de CELTA. El formulario principal debe estar visible al entrar. No agregar portadas comerciales, paneles decorativos o funcionalidades ajenas al trabajo.

| Uso | Valor |
| --- | --- |
| Verde principal | `#008000` |
| Verde oscuro / hover | `#006400` |
| Fondo de página | `#F1F1F1` |
| Superficie | `#FFFFFF` |
| Texto principal | `#243024` |
| Texto secundario | `#596459` |
| Bordes | `#D8DFD8` |
| Tipografía local | Segoe UI, Arial, Helvetica, sans-serif |

Configuración base en `globals.css`, con Tailwind 4:

```css
@import "tailwindcss";
@theme {
  --color-celta: #008000;
  --color-celta-dark: #006400;
  --color-ink: #243024;
  --color-muted: #596459;
  --color-line: #d8dfd8;
  --font-sans: "Segoe UI", Arial, Helvetica, sans-serif;
}
body {
  background: #f1f1f1;
  color: var(--color-ink);
  font-family: var(--font-sans);
}
[hidden] { display: none !important; }
button:focus-visible, input:focus-visible, a:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
```

- Logo original CELTA: actualmente `public/celta.ico`; favicon CELTA en `src/app/favicon.ico`.
- Mantener proporción del logo. No sustituirlo por un dibujo inventado.
- Encabezado con logo, CELTA, nombre de aplicación y referencia de uso interno.
- Paneles de bordes simples, pestaña activa con subrayado verde y botones verdes.
- En móvil: campos y botones de ancho disponible; resultados en tarjetas o grillas legibles.
- Texto principal de aproximadamente 16 px y etiquetas auxiliares de 14 px; controles táctiles de 44–48 px o más.
- Idioma del documento `es-AR` y metadatos propios, sin textos de la plantilla Next.js.
- Recursos servidos localmente; evitar CDN o fuentes de Google requeridas al compilar o usar la aplicación.
- El uso interno exige red con el servidor; no significa que funcione sin conexión a CELTA.

## 8. Comportamiento de formularios y resultados

- Búsqueda por botón o Enter.
- Pestañas con estado independiente, navegación de teclado y atributos accesibles.
- Validación en la interfaz y nuevamente en el servidor.
- Estados explícitos: inicial, consultando, resultados, sin coincidencias y error.
- Deshabilitar envíos repetidos mientras una consulta está en curso.
- Al cambiar el número, cancelar la petición anterior y limpiar sus resultados.
- No permitir que una respuesta atrasada reemplace una búsqueda más reciente.
- Usar AbortController y propagar la cancelación al controlador SQL.
- Al finalizar, devolver foco al campo si su pestaña sigue activa; no robar foco de otra pestaña.
- Mantener identificadores como texto durante la edición para conservar formato y validar límites.
- No almacenar personas consultadas en localStorage ni crear historiales sin requerimiento.
- React codifica los textos: no usar `dangerouslySetInnerHTML` para valores de la base.
- Mostrar todas las coincidencias o definir paginación explícita según la aplicación. No introducir TOP o DISTINCT para ocultar ambigüedades.

## 9. Conexión SQL Server y secretos

Patrón implementado:

- Paquete `mssql` con controlador Tedious, compatible con Node en Windows y Linux.
- Un pool reutilizado del lado del servidor, incluso durante recargas de desarrollo.
- Máximo 5 conexiones; timeout de conexión 10 segundos y consulta 15 segundos en esta app.
- Consultas parametrizadas, nombres de tablas y columnas elegidos por código de confianza.
- Intento de solo lectura y permisos SQL de solo lectura para aplicaciones de consulta.
- `readOnlyIntent: true` no sustituye un login SQL con permisos SELECT limitados.
- Manejar errores sin devolver cadenas de conexión, nombres internos o mensajes SQL al navegador.
- Evitar registrar identificadores personales y valores de búsqueda en logs.

La configuración actual se carga leyendo un archivo indicado por `CELTA_SQL_CONFIG_FILE`.

Ejemplo ilustrativo sin secretos reales:

```json
{
  "server": "SERVIDOR_SQL",
  "port": 1433,
  "user": "USUARIO_SOLO_LECTURA",
  "password": "REEMPLAZAR_EN_ARCHIVO_PRIVADO",
  "database": "CELTA_COM_PROD",
  "options": {
    "encrypt": true,
    "trustServerCertificate": false
  }
}
```

1433 es un ejemplo, no un puerto confirmado. Para instancia nombrada, confirmar su puerto o el mecanismo de resolución; no asumir que SQL Browser estará accesible desde Docker. Los certificados deben ser compatibles con las opciones elegidas. No cambiar cifrado o confianza de certificados para silenciar un error sin revisar la configuración real.

En esta PC, el archivo está en `%LOCALAPPDATA%\CELTA\ConsultalegajoNext\sql-config.json`. `.env.local` contiene únicamente su ruta, usando barras `/`:

```dotenv
CELTA_SQL_CONFIG_FILE=C:/Users/USUARIO/AppData/Local/CELTA/ConsultalegajoNext/sql-config.json
```

El archivo contiene credenciales en texto: debe tener permisos de lectura restringidos. No copiarlo al proyecto compartido, a `public/`, a Git, a documentación, a un chat ni a la imagen Docker. Nunca usar `NEXT_PUBLIC_` para secretos.

Para otra aplicación, crear su propia ubicación y permisos. La ruta Windows del desarrollador no funcionará dentro de un contenedor Linux: montar el secreto, por ejemplo en `/run/secrets/celta_sql.json`, y definir allí la variable.

La autenticación integrada de Windows de una app C# no se transforma automáticamente en usuario/contraseña compatible con Tedious. Si la app original la utiliza, acordar el mecanismo con el administrador antes de migrar.

## 10. API y acceso interno sin login

En Consulta de Legajo se usa POST `/api/personas` con JSON:

```json
{ "tipo": "persona", "valor": "12345" }
```

La respuesta correcta tiene `{ "personas": [...] }`; los errores tienen `{ "error": "mensaje para el usuario" }`. Usar POST evita incluir DNI/CUIT en la URL, aunque no reemplaza HTTPS. Las respuestas de consulta usan `Cache-Control: no-store`.

El endpoint actual exige `Content-Type: application/json`, `X-Celta-Request: consulta` y origen local coincidente. Valida el tipo de búsqueda y un valor de hasta 64 caracteres. Esta cabecera no es una contraseña ni autentica a un usuario.

Adaptación pendiente para producción, según la decisión de no usar cuentas:

1. Sustituir el bloqueo exclusivo a desarrollo por configuración explícita de los orígenes internos permitidos.
2. Considerar la URL externa HTTPS y el proxy: `request.url` puede reflejar una dirección interna del contenedor. No comparar a ciegas esa dirección con el Origin público.
3. No confiar indiscriminadamente en X-Forwarded-For para decidir quién pertenece a CELTA.
4. Mantener validación, límites de solicitudes y respuestas sin caché.
5. Restringir el acceso mediante firewall, redes Docker y proxy del servidor; no publicar el puerto a Internet.
6. Coordinar HTTPS y el nombre interno con el administrador.
7. Probar peticiones permitidas y rechazadas en la topología real.

Sin login, todo equipo con acceso a la dirección puede consultar. Los controles de origen ayudan frente a navegadores de otros sitios, pero no son autenticación ni una barrera de red. Para otras apps, decidir expresamente si este alcance es apropiado.

## 11. Reglas específicas de Consulta de Legajo

Este apartado solo se reutiliza cuando otra app necesite estas mismas reglas.

Tabla: `dbo.PERSONA`, base `CELTA_COM_PROD`.

| Columna | Tipo SQL confirmado en el trabajo de referencia | Uso |
| --- | --- | --- |
| SucCod | smallint | Sucursal |
| CliCod | int | Número de persona |
| CliSisAnt | decimal(10,0) | Cliente del sistema anterior |
| CliApe | varchar(50) | Apellido |
| CliNom | varchar(50) | Nombre |
| CliDocNro | int | DNI |
| CliCuit | decimal(11,0) | CUIT |

La identidad se interpreta con sucursal + persona. No asumir que DNI o CUIT son únicos. Aunque el esquema inspeccionado declara estos campos NOT NULL, el formato contempla ausencia de datos para no fallar al reutilizar resultados o modelos.

### Entradas

- Persona y DNI: dígitos ASCII, quitar espacios; mayor que cero y hasta 2.147.483.647. Rechazar puntos, signos, decimales, notación exponencial y texto SQL.
- CUIT: 1 a 11 dígitos, positivo; admite formato `XX-XXXXXXXX-X` y espacios. No aceptar guiones en otras posiciones.
- No validar dígito verificador ni prefijo: se decidió permitir valores históricos. No rellenar ceros ni transformar una búsqueda exacta en parcial.

### Cliente anterior

| Valor CliSisAnt | Presentación principal |
| --- | --- |
| NULL o entre 0 y 8 | Número de persona, sin barra |
| Entre 9 y 5.499.999 | Último dígito separado por `/` |
| Desde 5.500.000 inclusive | Número completo, sin barra |
| Negativo, fraccionario o mayor a 9.999.999.999 | Error de dato; no tratarlo como ausencia |

Ejemplos: `123456 → 12345/6`, `5499999 → 549999/9`, `5500000 → 5500000`. El caso histórico `9 → /9` conserva la regla existente; no agregar un cero inicial sin decisión funcional.

Si no hay cliente anterior, el campo secundario muestra “Sin cliente anterior” y el encabezado principal utiliza “Número de Persona”.

### Datos y coincidencias

- Apellido y nombre sin espacios en extremos; faltantes como `—`.
- CUIT de 11 dígitos: `XX-XXXXXXXX-X`; incompletos sin rellenar y nulos como `—`.
- Mostrar número de persona, cliente anterior, apellido, nombre, DNI, CUIT y sucursal.
- Persona en varias sucursales: selección explícita antes de mostrar un detalle; actualmente se usa un desplegable `<details>` por sucursal.
- DNI/CUIT: mostrar todas las coincidencias.

Consultas exactas y parámetros:

```sql
SELECT SucCod,CliCod,CliSisAnt,CliApe,CliNom,CliDocNro,CliCuit
FROM dbo.PERSONA WHERE CliCod=@value ORDER BY SucCod;

SELECT SucCod,CliCod,CliSisAnt,CliApe,CliNom,CliDocNro,CliCuit
FROM dbo.PERSONA WHERE CliDocNro=@value ORDER BY CliCod,SucCod;

SELECT SucCod,CliCod,CliSisAnt,CliApe,CliNom,CliDocNro,CliCuit
FROM dbo.PERSONA WHERE CliCuit=@value ORDER BY CliCod,SucCod;
```

Usar `sql.Int` para persona/DNI y `sql.Decimal(11,0)` para CUIT. No concatenar el valor recibido dentro del SQL.

## 12. Verificación antes de entregar

Ejecutar desde la raíz del proyecto:

```bat
npx tsc --noEmit
npm run lint
node tests/personas.test.mjs
npm run build -- --webpack
```

El archivo de pruebas de personas pertenece al proyecto de referencia; crear pruebas equivalentes para el dominio de cada app. Se ejecutó con Node 24; no asumir la misma capacidad de ejecutar TypeScript directamente en cualquier versión.

Verificar además:

- Paridad con resultados conocidos de la app original y límites numéricos.
- Datos nulos, múltiples coincidencias y selección de sucursal.
- Consulta real autorizada, de solo lectura, sin imprimir personas ni secretos en los informes.
- Rechazo de solicitudes inválidas y mensajes comprensibles de conexión.
- Cambio de pestaña o número durante la consulta y respuestas fuera de orden.
- PC, Android, teclado, foco, textos largos y zoom.
- Funcionamiento del build de producción, no solo del servidor de desarrollo.
- Que configuración privada y datos no aparezcan en Git, archivos públicos ni capas de la imagen.
- Si se decide no tener login, que la política de acceso interno esté efectiva antes de exponer la web.

Pruebas realizadas hasta esta guía: 43 comprobaciones de reglas, consultas reales por las tres claves, rechazo HTTP 400 de entrada inválida, rechazo HTTP 403 sin origen autorizado, respuesta no-store y revisión TypeScript/ESLint. El usuario probó y confirmó las consultas. **Las pruebas Docker y la validación en el servidor aún no ocurrieron.**

## 13. Preparación de Docker — procedimiento pendiente

Esta sección es una receta para la siguiente etapa, no una afirmación de que los archivos o la imagen ya existen.

### Confirmar con el administrador

- Sistema de contenedores y arquitectura. Puede informar el resultado de:

```bash
docker info --format '{{.OSType}}/{{.Architecture}}'
```

- Nombre interno y si la app se publica en raíz de un hostname o bajo una subruta. El código actual usa `/api/personas` y `/celta.ico`: una subruta requiere adaptación y pruebas, no basta con cambiar el proxy.
- Proxy utilizado, red Docker, puertos y terminación HTTPS.
- Conectividad del contenedor hacia SQL Server: DNS, puerto y certificados.
- Ubicación del secreto de SQL y permisos de lectura para el usuario del contenedor.
- Forma de recibir el `.tar`, iniciar el contenedor y actualizarlo.

No asumir Linux/AMD64 únicamente porque las otras webs usan Docker. Si informa `x86_64`, normalmente corresponde a la plataforma Docker `linux/amd64` cuando el sistema informado es Linux; confirmar antes de construir.

### Preparar la aplicación

Para una entrega Node standalone, incorporar y verificar en `next.config.ts`:

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone" };
export default nextConfig;
```

El build standalone permite ejecutar `server.js`. Deben incluirse también `public` y `.next/static` en la estructura final. Este modo requiere servidor Node: no reemplazarlo por exportación HTML estática, porque las consultas SQL son dinámicas. [Referencia Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

El Dockerfile a crear debe tener etapas separadas de dependencias, compilación y ejecución. Usar Node compatible, `npm ci`, compilación dentro de Linux si el destino es Linux, usuario sin privilegios y solo los archivos necesarios en la imagen final. Fijar versión o digest de la imagen base para una entrega reproducible y documentar su actualización.

No copiar `node_modules` de Windows ni `.next` del desarrollo a una imagen Linux. No usar `npm run dev` como comando de producción. Dentro del contenedor, el servidor debe escuchar en `0.0.0.0` y un puerto definido; el administrador controla dónde se expone ese puerto fuera del contenedor.

Excluir del contexto Docker como mínimo:

```text
node_modules
.next
.git
.env*
*.tsbuildinfo
artifacts
**/appsettings.local.json
**/sql-config.json
```

No pasar credenciales como argumentos de build ni incorporarlas con COPY. Montar el archivo privado en tiempo de ejecución, solo lectura. Un volumen de datos persistentes solo es necesario si la aplicación realmente guarda archivos o datos propios; esta app consulta la base existente y no tiene usuarios locales.

### Construir, probar y exportar

Ejemplo condicionado a un servidor **Linux/AMD64** y a tener Dockerfile y Docker funcionando. Reemplazar nombre y versión para cada app:

```bash
docker buildx build --platform linux/amd64 --load -t celta-consultalegajo:1.0.0 .
```

Probar primero la imagen en un contenedor con configuración real montada de forma privada y acceso restringido de prueba. Verificar página, API, consultas, errores, reinicio y logs. No dar por completa la entrega solo porque la imagen compiló.

Exportar la imagen:

```bash
docker image save -o celta-consultalegajo-1.0.0.tar celta-consultalegajo:1.0.0
```

Este comando guarda una imagen con sus capas y etiquetas. No sustituirlo por `docker export`, que exporta el sistema de archivos de un contenedor. [Referencia Docker save](https://docs.docker.com/reference/cli/docker/image/save/).

El administrador la importa con:

```bash
docker image load -i celta-consultalegajo-1.0.0.tar
```

Cargar la imagen no inicia la aplicación: después debe crear el contenedor con sus variables, secreto, red, puerto y política de reinicio. [Referencia Docker load](https://docs.docker.com/reference/cli/docker/image/load/).

Entregar la imagen fuera de la carpeta usada como contexto de build. Registrar un hash SHA-256 del `.tar` para comprobar la transferencia. No subir la imagen a un registro público sin una decisión expresa.

### Contenido de la entrega

1. Imagen `.tar` con nombre y versión identificables.
2. `INSTALACION.md` con plataforma, etiqueta, puerto, importación y arranque.
3. Plantilla SQL sin credenciales reales.
4. Comando de ejecución o Compose que use `image:`, sin obligar al administrador a compilar.
5. Instrucciones de red, proxy, HTTPS y montaje del secreto.
6. Evidencia de pruebas, hash del archivo y limitaciones pendientes.
7. Procedimiento de actualización y regreso a la versión anterior.

Conservar la etiqueta anterior para volver atrás. No detener ni reemplazar otras webs del servidor. Cada app debe tener nombres, puertos, redes y montajes coordinados por el administrador.

## 14. Texto para iniciar la próxima migración

Copiar este bloque y completar los espacios:

> Quiero convertir la aplicación de escritorio **[nombre]** a una web interna de CELTA. Usá esta guía como referencia. La aplicación original está en **[ruta]** y el proyecto nuevo debe crearse en **[ruta independiente]**. Usaremos Next.js con App Router, TypeScript, Tailwind CSS y SQL Server desde el servidor. La entrega será una imagen Docker ya construida para **[sistema/arquitectura, o pendiente]**, que publicará otra persona. Acceso: **[sin login interno / con cuentas / por definir]**. Operaciones permitidas: **[solo consulta / detallar escrituras]**. Primero relevá las pantallas, consultas, reglas y dependencias reales; conservá la app original. Replicá la identidad CELTA, adaptá la interfaz a PC y Android, mantené los secretos fuera del código y de la imagen, y verificá paridad de resultados. Explicame el avance paso a paso. No afirmes que la imagen o la publicación están listas sin haberlas probado.

## 15. Lista de cierre por aplicación

- [ ] Funciones y reglas originales relevadas.
- [ ] Esquema SQL y permisos necesarios confirmados.
- [ ] Proyecto web separado y dependencias bloqueadas.
- [ ] Pantalla CELTA adaptada a móvil y teclado.
- [ ] Endpoints parametrizados y validación del lado servidor.
- [ ] Política de acceso acordada e implementada, sin copiar restricciones temporales de desarrollo.
- [ ] Secretos fuera del código, navegador e imagen.
- [ ] Pruebas de reglas, integración y comparación con la app original.
- [ ] Build de producción y contenedor probados.
- [ ] Plataforma, red, hostname, HTTPS y SQL coordinados con el administrador.
- [ ] Imagen `.tar` exportada, identificada y verificada.
- [ ] Instrucciones, configuración de ejemplo y reversión entregadas.
- [ ] Prueba final en la red interna y un Android real.

## 16. Referencias

- [Instalación y requisitos de Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [CLI de Next.js y opción Webpack](https://nextjs.org/docs/app/api-reference/cli/next)
- [Salida standalone de Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Controlador node-mssql](https://github.com/tediousjs/node-mssql)
- [Docker: guardar imágenes](https://docs.docker.com/reference/cli/docker/image/save/)
- [Docker: cargar imágenes](https://docs.docker.com/reference/cli/docker/image/load/)

En el repositorio de escritorio de referencia también existen `Docs/CELTA_UI_STYLE_GUIDE.md` y `Docs/CELTA_COM_PROD_DATABASE_MEMORY.md`. Son fuentes complementarias: revisar su fecha y evidencia; no asumir que sustituyen la inspección del código y esquema actuales.
