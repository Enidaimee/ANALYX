function calcular() {
  const objX = parseFloat(document.getElementById('obj_X').value.trim()) || 0;
  const objY = parseFloat(document.getElementById('obj_Y').value.trim()) || 0;
  const objetivo = `Z = ${objX}x + ${objY}y`;
  function obtenerRestriccionesComoTexto() {
    const restriccionesTxt = [];

    for (let i = 1; i <= contadorRestricciones; i++) {
      // Verifica que la restricción aún exista (no haya sido eliminada)
      const restriccion = document.getElementById(`restriccion_${i}`);
      if (!restriccion) continue;

      const x = document.getElementById(`r${i}_x`).value.trim();
      const y = document.getElementById(`r${i}_y`).value.trim();
      const op = document.getElementById(`r${i}_op`).value;
      const constante = document.getElementById(`r${i}_const`).value.trim();

      // Formatea la restricción: "3x + 2y <= 5"
      const restriccionTxt = `${x}x + ${y}y ${op} ${constante}`;
      restriccionesTxt.push(restriccionTxt);
    }

    const restriccionesTexto = restriccionesTxt.join('\n');
    return restriccionesTexto;
  }
  console.log(obtenerRestriccionesComoTexto());
  const restricciones = obtenerRestriccionesComoTexto().split('\n').map(r => r.trim());
  const resultado = document.getElementById('resultado');

  if (!objetivo.match(/^Z\s*=\s*[\d\s\+\-\*xyXY]+$/i)) {
    resultado.textContent = "⚠️ Función objetivo inválida. Ej: Z = 3x + 5y";
    return;
  }

  const graficas = [];
  let errores = [];

  restricciones.forEach((restriccion, index) => {
    const match = restriccion.match(/^([^\<\>\=]+)\s*(<=|>=|=)\s*([\d\.]+)$/);
    if (!match) {
      errores.push(`⚠️ Restricción ${index + 1} inválida.`);
      return;
    }

    const [_, lhs, operador, rhs] = match;

    let a = 0, b = 0;
    const xMatch = lhs.match(/([+-]?\s*\d*\.?\d*)\s*x/i);
    const yMatch = lhs.match(/([+-]?\s*\d*\.?\d*)\s*y/i);
    const c = parseFloat(rhs);

    if (xMatch) {
      let coef = xMatch[1].replace(/\s+/g, '');
      a = coef === '' || coef === '+' ? 1 : coef === '-' ? -1 : parseFloat(coef);
    }
    if (yMatch) {
      let coef = yMatch[1].replace(/\s+/g, '');
      b = coef === '' || coef === '+' ? 1 : coef === '-' ? -1 : parseFloat(coef);
    }

    if (a === 0 && b === 0) {
      errores.push(`⚠️ Restricción ${index + 1} no tiene x ni y.`);
      return;
    }

    const puntos = [];
    const paso = 1;
    const limiteX = 100;

    for (let x = 0; x <= limiteX; x += paso) {
      let y = b !== 0 ? (c - a * x) / b : null;
      if (b === 0) {
        if (Math.abs(a * x - c) < 0.01) {
          for (let yLinea = 0; yLinea <= limiteX; yLinea += paso) {
            puntos.push({ x, y: yLinea });
          }
          break;
        }
      } else if (isFinite(y) && y >= 0 && y <= limiteX) {
        puntos.push({ x, y });
      }
    }

    const color = ['pink', 'magenta', 'blue', 'yellow', 'purple', 'cyan'][index % 6];

    graficas.push({
      label: `Restricción ${index + 1}`,
      data: puntos,
      borderColor: color,
      fill: false,
      tension: 0,
      parsing: false,
      pointRadius: 0
    });
  });

  if (errores.length > 0) {
    resultado.textContent = errores.join('\n');
    return;
  }

  // Paso 1: Extraer coeficientes de la función objetivo
  const objetivoMatch = objetivo.match(/Z\s*=\s*([+-]?\s*\d*)\s*x\s*([+-]?\s*\d*)\s*y/i);
  if (!objetivoMatch) {
    resultado.textContent = "⚠️ Función objetivo inválida. Ej: Z = 3x + 5y";
    return;
  }

  const coefX = parseFloat(objetivoMatch[1].replace(/\s+/g, '')) || 0;
  const coefY = parseFloat(objetivoMatch[2].replace(/\s+/g, '')) || 0;

  // Paso 2: Obtener todas las combinaciones de intersección entre restricciones
const puntosFactibles = [];
for (let i = 0; i < restricciones.length; i++) {
  const r1 = restricciones[i].match(/^([^\<\>\=]+)\s*(<=|>=|=)\s*([\d\.]+)$/);
  if (!r1) continue;
  const lhs1 = r1[1], signo1 = r1[2], c1 = parseFloat(r1[3]);

  // Función para extraer coeficientes x,y de un lado izquierdo
  function obtenerCoeficientes(expr) {
    let a = 0, b = 0;
    const xMatch = expr.match(/([+-]?\s*\d*\.?\d*)\s*x/i);
    const yMatch = expr.match(/([+-]?\s*\d*\.?\d*)\s*y/i);
    if (xMatch) {
      let coef = xMatch[1].replace(/\s+/g, '');
      if (coef === '' || coef === '+') a = 1;
      else if (coef === '-') a = -1;
      else a = parseFloat(coef);
    }
    if (yMatch) {
      let coef = yMatch[1].replace(/\s+/g, '');
      if (coef === '' || coef === '+') b = 1;
        else if (coef === '-') b = -1;
        else b = parseFloat(coef);
      }
      return { a, b };
    }

    const { a: a1, b: b1 } = obtenerCoeficientes(lhs1);

    for (let j = i + 1; j < restricciones.length; j++) {
      const r2 = restricciones[j].match(/^([^\<\>\=]+)\s*(<=|>=|=)\s*([\d\.]+)$/);
      if (!r2) continue;
      const lhs2 = r2[1], signo2 = r2[2], c2 = parseFloat(r2[3]);
      const { a: a2, b: b2 } = obtenerCoeficientes(lhs2);

      const denom = a1 * b2 - a2 * b1;
      if (denom !== 0) {
        const x = (c1 * b2 - c2 * b1) / denom;
        const y = (a1 * c2 - a2 * c1) / denom;

        if (x >= 0 && y >= 0) {
          let esFactible = true;
          for (const restriccion of restricciones) {
            const m = restriccion.match(/^([^\<\>\=]+)\s*(<=|>=|=)\s*([\d\.]+)$/);
            if (!m) continue;
            const lado = m[1], signo = m[2], derecha = parseFloat(m[3]);
            const { a, b } = obtenerCoeficientes(lado);
            const res = a * x + b * y;

            if (
              (signo === "<=" && res > derecha + 0.001) ||
              (signo === ">=" && res < derecha - 0.001) ||
              (signo === "=" && Math.abs(res - derecha) > 0.001)
            ) {
              esFactible = false;
              break;
            }
          }

          if (esFactible) {
            const z = coefX * x + coefY * y;
            puntosFactibles.push({ x, y, z });
          }
        }
      }
    }
  }

  if (puntosFactibles.length === 0) {
    resultado.textContent = "✅ Restricciones graficadas correctamente.\n⚠️ No se encontraron puntos factibles.";
  } else {
    const mejor = puntosFactibles.reduce((max, punto) => punto.z > max.z ? punto : max);
    resultado.textContent = `✅ Restricciones graficadas correctamente.\n✅ Punto óptimo: (x=${mejor.x.toFixed(2)}, y=${mejor.y.toFixed(2)}) → Z = ${mejor.z.toFixed(2)}`;

   
    graficas.push({
      label: 'Punto óptimo',
      data: [{ x: mejor.x, y: mejor.y }],
      borderColor: 'red',
      backgroundColor: 'red',
      pointRadius: 6,
      showLine: false
    });
  }

  dibujarGrafico(graficas);

  let detalles = "📍 Identificación de puntos de intersección y factibles:\n";

  let restriccionesParsed = restricciones.map(r => {
    const match = r.match(/^([^\<\>\=]+)\s*(<=|>=|=)\s*([\d\.]+)$/);
    const lhs = match[1];
    const op = match[2];
    const valor = parseFloat(match[3]);

    const x = parseFloat(lhs.match(/([+-]?\s*\d*\.?\d*)\s*x/i)?.[1]?.replace(/\s+/g, '') || 0) || 0;
    const y = parseFloat(lhs.match(/([+-]?\s*\d*\.?\d*)\s*y/i)?.[1]?.replace(/\s+/g, '') || 0) || 0;

    return { x, y, op, valor };
  });

  if (!puntosFactibles || !Array.isArray(puntosFactibles) || puntosFactibles.length === 0) {
    alert("No se encontraron puntos factibles. Verifica las restricciones o los cálculos anteriores.");
    return;
  }

  let puntosEvaluados = puntosFactibles
    .filter(p => p && typeof p.x === 'number' && typeof p.y === 'number')
    .map(p => {
      let z = coefX * p.x + coefY * p.y;
      return { ...p, z };
  });

  puntosEvaluados.forEach((p, i) => {
    detalles += `Punto ${i + 1}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) → Z = ${p.z.toFixed(2)}\n`;
    detalles += "  Verificación de restricciones:\n";
    restriccionesParsed.forEach((r, j) => {
      let izq = r.x * p.x + r.y * p.y;
      let cumple = false;
      switch (r.op) {
        case '<=': cumple = izq <= r.valor + 1e-6; break;
        case '>=': cumple = izq >= r.valor - 1e-6; break;
        case '=': cumple = Math.abs(izq - r.valor) < 1e-6; break;
      }
      detalles += `    - ${r.x}x + ${r.y}y ${r.op} ${r.valor} → ${izq.toFixed(2)} → ${cumple ? "✔️" : "❌"}\n`;
    });
    detalles += '\n';
  });

  let optimo = puntosEvaluados.reduce((max, p) => (p.z > max.z ? p : max), puntosEvaluados[0]);

  detalles += "💡 Interpretación de la información:\n";
  detalles += `El punto óptimo es: (${optimo.x.toFixed(2)}, ${optimo.y.toFixed(2)})\n`;
  detalles += `Valor óptimo de Z: ${optimo.z.toFixed(2)}\n`;

  document.getElementById("detalles").innerText = detalles;
}

function dibujarGrafico(graficas, puntosInterseccion = []) {
  const ctx = document.getElementById('grafico').getContext('2d');

  if (window.graficoChart) {
    window.graficoChart.destroy();
  }

  // Calcular límites automáticos con margen
  let todosPuntos = graficas.flatMap(g => g.data);
  puntosInterseccion.forEach(p => todosPuntos.push(p));

  let minX = Math.min(...todosPuntos.map(p => p.x), 0) - 1;
  let maxX = Math.max(...todosPuntos.map(p => p.x), 10) + 1;
  let minY = Math.min(...todosPuntos.map(p => p.y), 0) - 1;
  let maxY = Math.max(...todosPuntos.map(p => p.y), 10) + 1;

  // Agregar puntos de intersección como etiquetas
  const puntosEtiquetados = puntosInterseccion.map((p, i) => ({
    type: 'point',
    data: [p],
    label: {
      display: true,
      content: `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`,
      position: 'top',
      color: 'black'
    },
    backgroundColor: 'black',
    pointRadius: 5
  }));

  window.graficoChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [...graficas, ...puntosEtiquetados]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'x'
          },
          min: minX,
          max: maxX,
          grid: {
            drawBorder: true,
            color: '#ccc'
          }
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: 'y'
          },
          min: minY,
          max: maxY,
          grid: {
            drawBorder: true,
            color: '#ccc'
          }
        }
      },
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let x = context.parsed.x.toFixed(2);
              let y = context.parsed.y.toFixed(2);
              return `(${x}, ${y})`;
            }
          }
        }
      }
    }
  });
}

