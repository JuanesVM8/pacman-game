import GeneradorMixto from '../lib/randomLib.js';

const gen = new GeneradorMixto();

console.log("=== PRUEBA GENERADOR ===");

console.log("Enteros (1-100):");
console.log(gen.listaEnteros(10, 1, 100));

console.log("\nDecimales (0-1):");
for (let i = 0; i < 5; i++) {
    console.log(gen.numeroDecimal());
}

console.log("\nValores brutos:");
for (let i = 0; i < 5; i++) {
    console.log(gen.numeroBruto());
}