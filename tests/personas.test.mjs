import assert from "node:assert/strict";
import { formatPerson, parseSearch } from "../src/lib/personas.ts";
let count = 0;
function check(ok, name) { assert.ok(ok, name); count++; }
const base = { SucCod: 1, CliCod: 1234, CliSisAnt: null, CliApe: " Apellido ", CliNom: " Nombre ", CliDocNro: null, CliCuit: null };
for (const [value, expected] of [[null,"1234"],[0,"1234"],[8,"1234"],[9,"/9"],[123456,"12345/6"],[5499999,"549999/9"],[5500000,"5500000"],[5500001,"5500001"],[9999999999,"9999999999"]])
  check(formatPerson({...base,CliSisAnt:value}).legajo===expected, "Cliente anterior");
for (const bad of [-1,1.5,10000000000]) { assert.throws(()=>formatPerson({...base,CliSisAnt:bad})); count++; }
check(formatPerson({...base,CliCuit:20123456786}).cuit==="20-12345678-6","CUIT con guiones");
check(formatPerson({...base,CliCuit:123}).cuit==="123","CUIT incompleto");
check(formatPerson(base).clienteAnterior==="Sin cliente anterior","Ausencia de cliente anterior");
check(formatPerson(base).apellido==="Apellido","Espacios");
for (const kind of ["persona","dni","cuit"]) for (const value of ["","0","-1","1.1","1e3","１２","1; SELECT"]) check(parseSearch(kind,value)===null,"Entrada inválida");
check(parseSearch("persona","2147483648")===null,"Límite Int");
check(parseSearch("cuit","999999999999")===null,"Límite CUIT");
check(parseSearch("cuit","20-12345678-6")?.value===20123456786,"CUIT válido");
check(parseSearch("cuit","20-123-6")===null,"Guiones inválidos");
check(parseSearch("dni","12 345")?.value===12345,"Normalización");
check(parseSearch("otro","1")===null,"Tipo inválido");
console.log(count + " comprobaciones de reglas correctas.");

