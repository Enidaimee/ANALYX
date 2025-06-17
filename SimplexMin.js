function Resolver() { 
  try {
    // Leer función objetivo (primal)
    const c1 = parseFloat(document.getElementById('obj_x1').value || 0);
    const c2 = parseFloat(document.getElementById('obj_x2').value || 0);
    const c3 = parseFloat(document.getElementById('obj_x3').value || 0);
    const obj_primal = [c1, c2, c3];

    // Leer restricciones (primal)
    const restricciones = [
      {
        coef: [
          parseFloat(document.getElementById('r1_x1').value || 0),
          parseFloat(document.getElementById('r1_x2').value || 0),
          parseFloat(document.getElementById('r1_x3').value || 0)
        ],
        op: document.getElementById('r1_op').value,
        valor: parseFloat(document.getElementById('r1_const').value || 0)
      },
      {
        coef: [
          parseFloat(document.getElementById('r2_x1').value || 0),
          parseFloat(document.getElementById('r2_x2').value || 0),
          parseFloat(document.getElementById('r2_x3').value || 0)
        ],
        op: document.getElementById('r2_op').value,
        valor: parseFloat(document.getElementById('r2_const').value || 0)
      }
    ];

    // Mostrar problema primal
    let texto = `🟣 PROBLEMA PRIMAL (Minimización):\nMin Z = ${c1}X₁ + ${c2}X₂ + ${c3}X₃\n`;
    restricciones.forEach((r, i) => {
      texto += `${r.coef[0]}X₁ + ${r.coef[1]}X₂ + ${r.coef[2]}X₃ ${r.op} ${r.valor}\n`;
    });
    texto += `X₁, X₂, X₃ ≥ 0\n\n`;

    // Convertir a dual
    const dual_obj = restricciones.map(r => r.valor); // función objetivo dual

    const dual_rest = obj_primal.map((coef, i) => {
      return {
        coef: restricciones.map(r => r.coef[i]),
        const: coef
      };
    });

    // Mostrar problema dual
    texto += `🟣 PROBLEMA DUAL (Maximización):\nMax W = ${dual_obj[0]}Y₁ + ${dual_obj[1]}Y₂\n`;
    dual_rest.forEach((r, i) => {
      texto += `${r.coef[0]}Y₁ + ${r.coef[1]}Y₂ ≤ ${r.const}\n`;
    });
    texto += `Y₁, Y₂ ≥ 0\n\n`;

    // Agregar despejes
    texto += `🟣 Despejes para graficar (restricciones del dual):\n`;
    dual_rest.forEach((r, i) => {
      const [a, b] = r.coef;
      const c = r.const;
      let despeje1 = b !== 0 ? `Y₂ = ${c}/${b} = ${(c / b).toFixed(1)} (cuando Y₁ = 0)` : 'No se puede (b = 0)';
      let despeje2 = a !== 0 ? `Y₁ = ${c}/${a} = ${(c / a).toFixed(1)} (cuando Y₂ = 0)` : 'No se puede (a = 0)';
      texto += `Restricción ${i + 1}: ${a}Y₁ + ${b}Y₂ ≤ ${c}\n  → ${despeje1}\n  → ${despeje2}\n`;
    });
    texto += `\n`;

    // Obtener puntos extremos (intersecciones con ejes)
    let puntos = [];
    for (let i = 0; i < dual_rest.length; i++) {
      const [a, b] = dual_rest[i].coef;
      const c = dual_rest[i].const;
      if (b !== 0) {
        puntos.push({ x: 0, y: c / b, label: `P${i + 1}a` });
      }
      if (a !== 0) {
        puntos.push({ x: c / a, y: 0, label: `P${i + 1}b` });
      }
    }

    // Función para calcular intersección entre dos restricciones (líneas)
    function interseccion(r1, r2) {
      const [a1, b1] = r1.coef;
      const c1 = r1.const;
      const [a2, b2] = r2.coef;
      const c2 = r2.const;

      const det = a1 * b2 - a2 * b1;
      if (Math.abs(det) < 1e-10) {
        return null; // Paralelas o coincidentes, no intersección única
      }
      const x = (c1 * b2 - c2 * b1) / det;
      const y = (a1 * c2 - a2 * c1) / det;
      return { x, y };
    }

    // Calcular intersecciones entre pares de restricciones (en este caso solo 2 restricciones)
    for (let i = 0; i < dual_rest.length; i++) {
      for (let j = i + 1; j < dual_rest.length; j++) {
        const pt = interseccion(dual_rest[i], dual_rest[j]);
        if (pt) {
          pt.label = `I${i + 1}${j + 1}`;
          puntos.push(pt);
        }
      }
    }

    // Agregar también el origen (0,0) que siempre es candidato (Y1, Y2 ≥ 0)
    puntos.push({ x: 0, y: 0, label: 'O' });

    // Eliminar puntos duplicados (con tolerancia)
    const unicos = [];
    for (const p of puntos) {
      if (!unicos.some(q => Math.abs(p.x - q.x) < 1e-6 && Math.abs(p.y - q.y) < 1e-6)) {
        unicos.push(p);
      }
    }

    // Filtrar puntos factibles (que cumplen todas las restricciones y Y₁,Y₂≥0)
    function esFactible(p) {
      if (p.x < -1e-8 || p.y < -1e-8) return false;
      for (const r of dual_rest) {
        const lhs = r.coef[0] * p.x + r.coef[1] * p.y;
        if (lhs - r.const > 1e-8) return false; // No cumple la restricción
      }
      return true;
    }

    const factibles = unicos.filter(esFactible);

    if (factibles.length === 0) {
      texto += "⚠️ No hay puntos factibles.\n";
      document.getElementById('resultado').innerText = texto;
      Plotly.purge('grafica'); // limpiar gráfica
      return;
    }

    // Evaluar función objetivo dual en puntos factibles
    const resultados = factibles.map(p => {
      const z = dual_obj[0] * p.x + dual_obj[1] * p.y;
      return { ...p, z };
    });

    // Encontrar máximo
    const max = resultados.reduce((a, b) => (a.z > b.z ? a : b));

    // Mostrar sustituciones del punto óptimo en función objetivo y restricciones
    texto += `🟣 Evaluación del punto óptimo (${max.x.toFixed(1)}, ${max.y.toFixed(1)}):\n\n`;

    // Sustitución en función objetivo dual (Max W = dual_obj[0]*Y1 + dual_obj[1]*Y2)
    texto += `Función objetivo dual:\nW = ${dual_obj[0]}(${max.x.toFixed(4)}) + ${dual_obj[1]}(${max.y.toFixed(1)}) = ${max.z.toFixed(1)}\n\n`;

    // Sustitución en restricciones duales
    texto += `Restricciones duales:\n`;
    dual_rest.forEach((r, i) => {
      const lhs = r.coef[0] * max.x + r.coef[1] * max.y;
      texto += `Restricción ${i + 1}: ${r.coef[0]}(${max.x.toFixed(1)}) + ${r.coef[1]}(${max.y.toFixed(1)}) = ${lhs.toFixed(1)} ≤ ${r.const}\n`;
    });

    document.getElementById('resultado').innerText = texto;

    // Colores para líneas de restricciones duales: rosa, naranja, azul clarito
    const colores = ['#e91e63', '#ff9800', '#2196f3'];

    // Crear trazos para líneas de restricciones duales
    const lineas = dual_rest.map((r, i) => {
      const [a, b] = r.coef;
      const c = r.const;

      const puntosLinea = [];

      if (b !== 0) puntosLinea.push({ x: 0, y: c / b });
      if (a !== 0) puntosLinea.push({ x: c / a, y: 0 });

      if (puntosLinea.length === 2) {
        return {
          x: [puntosLinea[0].x, puntosLinea[1].x],
          y: [puntosLinea[0].y, puntosLinea[1].y],
          mode: 'lines',
          type: 'scatter',
          name: `Restricción ${i + 1}`,
          line: { dash: 'solid', width: 2, color: colores[i % colores.length] }
        };
      } else {
        return null;
      }
    }).filter(r => r !== null);

    // Función para ordenar puntos en sentido horario para graficar polígono factible
    function ordenarPuntos(puntos) {
      // Centrar
      const cx = puntos.reduce((acc, p) => acc + p.x, 0) / puntos.length;
      const cy = puntos.reduce((acc, p) => acc + p.y, 0) / puntos.length;
      return puntos.slice().sort((a, b) => {
        const angA = Math.atan2(a.y - cy, a.x - cx);
        const angB = Math.atan2(b.y - cy, b.x - cx);
        return angA - angB;
      });
    }

    // Graficar región factible como polígono sombreado
    const poligonoFactible = ordenarPuntos(factibles);

    const fillPolygon = {
      x: poligonoFactible.map(p => p.x).concat(poligonoFactible[0].x),
      y: poligonoFactible.map(p => p.y).concat(poligonoFactible[0].y),
      fill: 'toself',
      fillcolor: 'rgba(173, 66, 188, 0.3)', // color lila transparente
      line: { color: 'rgba(173, 66, 188, 0.8)' },
      mode: 'lines',
      name: 'Región Factible',
      type: 'scatter'
    };

    // Graficar líneas + puntos factibles + punto óptimo
    const graficaFinal = [
      fillPolygon, // Región factible sombreada (sin hover)
      ...lineas.map(l => ({ ...l, hoverinfo: 'skip' })), // Líneas sin hover
      {
        x: factibles.map(p => p.x),
        y: factibles.map(p => p.y),
        mode: 'markers',
        type: 'scatter',
        marker: { size: 8, color: '#ab47bc' },
        name: 'Puntos Factibles',
        
      },
      {
        x: [max.x],
        y: [max.y],
        mode: 'markers+text',
        type: 'scatter',
        name: 'Óptimo',
        marker: { color: 'red', size: 12 },
        text: [`(${max.x.toFixed(2)}, ${max.y.toFixed(2)})`],
        textposition: 'top center',
        textfont: { color: 'blue', size: 14, family: 'Arial' },
        hoverinfo: 'text',
        hovertext: `Óptimo: (${max.x.toFixed(4)}, ${max.y.toFixed(4)})\nZ = ${max.z.toFixed(4)}`
      }
    ];

    Plotly.newPlot('grafica', graficaFinal, {
      title: 'Gráfica del Problema Dual',
      xaxis: { title: 'Y₁', zeroline: false },
      yaxis: { title: 'Y₂', zeroline: false },
      showlegend: true
    });

  } catch (error) {
    document.getElementById('resultado').innerText =
      '❌ Ocurrió un error inesperado: ' + error.message;
  }
}
