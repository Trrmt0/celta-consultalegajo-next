"use client";

import Image from "next/image";
import { useRef, useState, useEffect, type FormEvent, type KeyboardEvent } from "react";

import { parseSearch, type Person } from "@/lib/personas";

const tabs = [
  { id: "persona", title: "Persona", label: "Número de Persona", hint: "Ingrese el número de persona.", placeholder: "Ej.: 12345" },
  { id: "dni", title: "DNI", label: "Número de DNI", hint: "Ingrese el DNI sin puntos.", placeholder: "Ej.: 12345678" },
  { id: "cuit", title: "CUIT", label: "Número de CUIT", hint: "Puede ingresarlo con o sin guiones.", placeholder: "Ej.: 20-12345678-6" },
] as const;
type Kind = typeof tabs[number]["id"];
type Entry = { value: string; message: string; error: boolean; loading: boolean; searched: boolean; results: Person[] };
const initial: Entry = { value: "", message: "", error: false, loading: false, searched: false, results: [] };

export default function Home() {
  const [active, setActive] = useState<Kind>("persona");
  const [entries, setEntries] = useState<Record<Kind, Entry>>({ persona: { ...initial }, dni: { ...initial }, cuit: { ...initial } });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inputs = useRef<Partial<Record<Kind, HTMLInputElement | null>>>({});
  function selectTab(index: number) { setActive(tabs[index].id); tabRefs.current[index]?.focus(); }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const target = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
    if (target !== null) { event.preventDefault(); selectTab(target); }
  }

  const pending = useRef<Partial<Record<Kind, AbortController>>>({});
  const activeTab = useRef(active);
  useEffect(() => { activeTab.current = active; }, [active]);
  useEffect(() => { const requests = pending.current; return () => { Object.values(requests).forEach(controller => controller?.abort()); }; }, []);
  function edit(kind: Kind, value: string) {
    pending.current[kind]?.abort();
    delete pending.current[kind];
    setEntries(previous => ({ ...previous, [kind]: { ...initial, value } }));
  }
  async function submit(event: FormEvent<HTMLFormElement>, kind: Kind) {
    event.preventDefault();
    if (pending.current[kind]) return;
    if (!parseSearch(kind, entries[kind].value)) {
      setEntries(previous => ({ ...previous, [kind]: { ...previous[kind], error: true, results: [], searched: false,
        message: kind === "cuit" ? "Ingrese un CUIT válido, con o sin guiones." : "Ingrese un número válido mayor que cero, sin puntos ni guiones." } }));
      inputs.current[kind]?.focus(); return;
    }
    const controller = new AbortController();
    pending.current[kind] = controller;
    setEntries(previous => ({ ...previous, [kind]: { ...previous[kind], loading: true, results: [], searched: false, error: false, message: "" } }));
    try {
      const response = await fetch("/api/personas", { method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", "X-Celta-Request": "consulta" },
        body: JSON.stringify({ tipo: kind, valor: entries[kind].value }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo realizar la consulta.");
      if (pending.current[kind] === controller)
        setEntries(previous => ({ ...previous, [kind]: { ...previous[kind], loading: false, searched: true, results: data.personas } }));
    } catch (error) {
      if (!controller.signal.aborted && pending.current[kind] === controller)
        setEntries(previous => ({ ...previous, [kind]: { ...previous[kind], loading: false, error: true,
          message: error instanceof Error && error.message !== "Failed to fetch" ? error.message : "No se pudo conectar. Intente nuevamente." } }));
    } finally {
      if (pending.current[kind] === controller) {
        delete pending.current[kind];
        if (activeTab.current === kind) inputs.current[kind]?.focus();
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#consulta" className="sr-only focus:not-sr-only focus:bg-white focus:p-4">Ir a la consulta</a>
      <header className="border-t-4 border-t-celta border-b border-b-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5 sm:px-8">
          <Image src="/celta.ico" width={48} height={48} alt="" unoptimized priority />
          <div><p className="text-xl font-bold tracking-wide text-celta">CELTA</p><p className="text-sm text-muted">Consulta de Legajo</p></div>
          <span className="ml-auto hidden text-sm text-muted sm:block">Uso interno</span>
        </div>
      </header>

      <main id="consulta" className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Consulta de Legajo</h1><p className="mt-2 text-muted">Busque una persona por su número, DNI o CUIT.</p></div>
          <span className="border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">Prueba local · Solo lectura</span>
        </div>

        <section className="border border-line bg-white" aria-label="Búsqueda de personas">
          <div role="tablist" aria-label="Buscar por" className="flex border-b border-line px-2 sm:px-6">
            {tabs.map((tab, index) => (
              <button key={tab.id} ref={element => { tabRefs.current[index] = element; }}
                id={"tab-" + tab.id} type="button" role="tab" aria-selected={active === tab.id}
                aria-controls={"panel-" + tab.id} tabIndex={active === tab.id ? 0 : -1}
                onClick={() => setActive(tab.id)} onKeyDown={event => keyboard(event, index)}
                className={"min-h-14 flex-1 border-b-3 px-5 font-semibold sm:flex-none sm:px-9 " + (active === tab.id ? "border-celta bg-green-50 text-celta-dark" : "border-transparent text-muted hover:bg-slate-50 hover:text-ink")}>
                {tab.title}
              </button>
            ))}
          </div>

          {tabs.map(tab => (
            <section key={tab.id} id={"panel-" + tab.id} role="tabpanel" aria-labelledby={"tab-" + tab.id} hidden={active !== tab.id} className="p-5 sm:p-8">
              <form onSubmit={event => submit(event, tab.id)} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div className="w-full sm:max-w-lg">
                  <label htmlFor={"input-" + tab.id} className="mb-2 block font-semibold">{tab.label}</label>
                  <input ref={element => { inputs.current[tab.id] = element; }} id={"input-" + tab.id} type="text" inputMode="numeric" autoComplete="off" maxLength={64}
                    value={entries[tab.id].value} placeholder={tab.placeholder}
                    aria-invalid={entries[tab.id].error} aria-describedby={"help-" + tab.id + (entries[tab.id].message ? " message-" + tab.id : "")}
                    onChange={event => edit(tab.id, event.target.value)}
                    className="min-h-12 w-full border border-line border-b-2 border-b-celta bg-white px-3 py-2.5 text-lg tabular-nums placeholder:text-slate-400" />
                  <p id={"help-" + tab.id} className="mt-2 text-sm text-muted">{tab.hint}</p>
                </div>
                <button type="submit" disabled={entries[tab.id].loading} className="min-h-12 bg-celta px-8 py-3 font-semibold text-white hover:bg-celta-dark disabled:cursor-wait disabled:opacity-60 sm:mt-8">{entries[tab.id].loading ? "Buscando…" : "Buscar"}</button>
              </form>

              <div aria-live="polite" aria-atomic="true" className="mt-6">
                {entries[tab.id].message && <p id={"message-" + tab.id} role={entries[tab.id].error ? "alert" : "status"}
                  className={"border-l-3 p-4 text-sm " + (entries[tab.id].error ? "border-red-700 bg-red-50 text-red-900" : "border-sky-700 bg-sky-50 text-sky-950")}>{entries[tab.id].message}</p>}
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <h2 className="text-lg font-semibold">Resultado de la consulta</h2>

                <div aria-live="polite" aria-busy={entries[tab.id].loading} className="mt-4">
                  {entries[tab.id].results.length > 0 ? <>
                    <p className="mb-4 text-sm text-muted">{entries[tab.id].results.length} registro(s) encontrado(s).</p>
                    {tab.id === "persona" && entries[tab.id].results.length > 1 && <p className="mb-4 bg-sky-50 p-4">La persona figura en varias sucursales. Seleccione la sucursal que desea consultar.</p>}
                    <div className="grid gap-4">{entries[tab.id].results.map(person =>
                      tab.id === "persona" && entries[tab.id].results.length > 1
                        ? <details key={person.sucursal + ":" + person.numeroPersona} name="sucursal" className="border border-line"><summary className="cursor-pointer p-4 font-semibold">Sucursal {person.sucursal} · Persona {person.numeroPersona}</summary><PersonCard person={person} /></details>
                        : <PersonCard key={person.sucursal + ":" + person.numeroPersona} person={person} />
                    )}</div>
                  </> : <div className="flex min-h-36 flex-col items-center justify-center bg-slate-50 px-5 py-8 text-center">
                    <p className="font-medium">{entries[tab.id].loading ? "Consultando CELTA…" : entries[tab.id].searched ? "No se encontraron resultados." : entries[tab.id].error ? "No se completó la consulta." : "Ingrese un número para consultar."}</p>
                    {entries[tab.id].searched && <p className="mt-2 text-sm text-muted">Revise el número ingresado e intente nuevamente.</p>}
                  </div>}
                </div>
              </div>
            </section>
          ))}
        </section>
        <p className="mt-4 text-sm text-muted">Datos de la consulta: apellido, nombre, DNI, CUIT, número de persona, cliente anterior y sucursal.</p>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-5 pb-6 text-sm text-muted sm:px-8">CELTA · Consulta de solo lectura</footer>
    </div>
  );
}


function PersonCard({ person }: { person: Person }) {
  const fields = [
    ["Apellido", person.apellido], ["Nombre", person.nombre], ["DNI", person.dni],
    ["CUIT", person.cuit], ["Número de Persona", person.numeroPersona], ["Cliente anterior", person.clienteAnterior],
  ];
  return <article className="border border-line bg-white">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-l-4 border-celta bg-green-50 px-5 py-4">
      <span className="text-sm">{person.etiqueta}</span><strong className="break-all text-3xl text-celta-dark tabular-nums">{person.legajo}</strong>
      <span className="ml-auto text-sm text-muted">Sucursal {person.sucursal}</span>
    </div>
    <dl className="grid grid-cols-1 gap-5 p-5 min-[400px]:grid-cols-2 md:grid-cols-3">{fields.map(([label, value]) =>
      <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>
    )}</dl>
  </article>;
}
