
class CuadradoMedio {
    constructor(semilla, digitos = 6) {
        this.semilla = semilla;
        this.digitos = digitos;
    }

    siguiente() {
        let cuadrado = (this.semilla ** 2)
            .toString()
            .padStart(this.digitos * 2, '0'); // asegura longitud par

        let inicio = Math.floor((cuadrado.length - this.digitos) / 2);
        let medio = parseInt(cuadrado.substring(inicio, inicio + this.digitos));

        this.semilla = medio;
        return medio;
    }
}

class CongruencialLineal {
    constructor(semilla, a = 1664525, c = 1013904223, m = 2 ** 32) {
        this.x = semilla;
        this.a = a;
        this.c = c;
        this.m = m;
    }

    siguiente() {
        this.x = (this.a * this.x + this.c) % this.m;
        return this.x;
    }
}

class GeneradorMixto {
    constructor() {
        // 1. Semilla inicial (milisegundos)
        let semillaInicial = Date.now();

        // 2. Aplicar cuadrado medio con validación
        this.cuadrado = new CuadradoMedio(semillaInicial);

        let valores = new Set();
        let semillaMejorada = null;

        for (let i = 0; i < 10; i++) {
            let val = this.cuadrado.siguiente();

            // detectar problemas
            if (val === 0 || valores.has(val)) {
                semillaMejorada = null;
                break;
            }

            valores.add(val);
            semillaMejorada = val;
        }

        // 3. Fallback seguro si algo salió mal
        if (semillaMejorada === null) {
            semillaMejorada = (Date.now() % 1000000) + 1;
        }

        // 4. Inicializar congruencial
        this.congruencial = new CongruencialLineal(semillaMejorada);
    }


    numeroEntero(min, max) {
        let decimal = this.numeroDecimal();
        return min + Math.floor(decimal * (max - min + 1));
    }

    numeroDecimal() {
        return this.congruencial.siguiente() / (2 ** 32);
    }

    listaEnteros(n, min, max) {
        let lista = [];
        for (let i = 0; i < n; i++) {
            lista.push(this.numeroEntero(min, max));
        }
        return lista;
    }

    // extra (para debug o evidencias)
    numeroBruto() {
        return this.congruencial.siguiente();
    }
}


export default GeneradorMixto;