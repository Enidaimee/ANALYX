// Función para crear una tabla HTML desde una matriz y marcar el pivote
function crearTabla(matriz, filaPivote, colPivote) {
  let html = '<table class="matrix">';
  for (let i = 0; i < matriz.length; i++) {
    html += '<tr>';
    for (let j = 0; j < matriz[0].length; j++) {
      let clase = (i === filaPivote && j === colPivote) ? 'pivote' : '';
      html += `<td class="${clase}">${matriz[i][j].toFixed(3)}</td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
}

// Función principal para resolver el Simplex (maximización)
function resolverMaximizacion() {
  const resultado = document.getElementById('resultado');
  resultado.innerHTML = ''; // Limpiar resultado

  // Tomar valores de inputs dinámicos
  // Variables X1, X2, X3 (ajusta según inputs reales en tu HTML)
  let c = []; // Coef. función objetivo
  for(let i=1; i<=3; i++) {
    let val = parseFloat(document.getElementById(`obj_x${i}`)?.value);
    if(isNaN(val)) val = 0;
    c.push(val);
  }

  // Restricciones
  // Vamos a considerar 3 restricciones, cada una con 3 coeficientes + constante
  let A = [];
  let b = [];
  let signs = [];
  for(let i=1; i<=3; i++) {
    let fila = [];
    for(let j=1; j<=3; j++) {
      let val = parseFloat(document.getElementById(`r${i}_x${j}`)?.value);
      if(isNaN(val)) val = 0;
      fila.push(val);
    }
    A.push(fila);

    let constVal = parseFloat(document.getElementById(`r${i}_const`)?.value);
    if(isNaN(constVal)) constVal = 0;
    b.push(constVal);

    let sign = document.getElementById(`r${i}_op`)?.value || '<=';
    signs.push(sign);
  }

  // Verificamos que todas las restricciones sean <= para simplicidad (o hacer ajuste para >=)
  for(let s of signs) {
    if(s !== '<=') {
      resultado.innerHTML = 'Error: Solo se soportan restricciones con ≤ para este ejemplo.';
      return;
    }
  }

  // Construir tabla simplex inicial
  // Variables básicas serán las variables de holgura, por lo tanto añadimos columnas de holgura (I)
  // Total variables = variables originales + variables de holgura
  let numVar = c.length;
  let numRes = A.length;
  let totalVar = numVar + numRes;

  // Construcción matriz simplex: filas = restricciones + 1 (func objetivo)
  // columnas = totalVar + 1 (para b)
  // Inicializar matriz llena de ceros
  let tabla = [];
  for(let i=0; i<=numRes; i++) {
    tabla.push(new Array(totalVar+1).fill(0));
  }

  // Rellenar matriz con coeficientes de restricciones + holgura
  for(let i=0; i<numRes; i++) {
    for(let j=0; j<numVar; j++) {
      tabla[i][j] = A[i][j];
    }
    tabla[i][numVar + i] = 1; // Variable de holgura
    tabla[i][totalVar] = b[i]; // Termino independiente
  }

  // Fila función objetivo: -c (maximizar)
  for(let j=0; j<numVar; j++) {
    tabla[numRes][j] = -c[j];
  }
  tabla[numRes][totalVar] = 0;

  // Variables básicas inicialmente: holgura (indices de las variables de holgura)
  let base = [];
  for(let i=0; i<numRes; i++) {
    base.push(numVar + i);
  }

  let pasosTexto = '--- Método Simplex de Maximización ---\n\n';
  let iteracion = 0;

  while(true) {
    iteracion++;
    pasosTexto += `Iteración ${iteracion}:\n`;
    // Mostrar tabla actual
    pasosTexto += crearTabla(tabla, -1, -1) + '\n';

    // Paso 1: Encontrar columna pivote (coef más negativo en función objetivo)
    let colPivote = -1;
    let valorMin = 0;
    for(let j=0; j<totalVar; j++) {
      if(tabla[numRes][j] < valorMin) {
        valorMin = tabla[numRes][j];
        colPivote = j;
      }
    }

    if(colPivote === -1) {
      pasosTexto += 'No hay coeficientes negativos en la fila objetivo. Solución óptima alcanzada.\n\n';
      break;
    }

    // Paso 2: Calcular razón para determinar fila pivote
    let razones = [];
    for(let i=0; i<numRes; i++) {
      let elemento = tabla[i][colPivote];
      if(elemento > 0) {
        razones.push(tabla[i][totalVar] / elemento);
      } else {
        razones.push(Infinity);
      }
    }
    let filaPivote = razones.indexOf(Math.min(...razones));
    if(razones[filaPivote] === Infinity) {
      pasosTexto += 'Problema no acotado.\n';
      break;
    }

    pasosTexto += `Columna pivote: x${colPivote+1} (columna ${colPivote})\n`;
    pasosTexto += `Fila pivote: F${filaPivote+1} (razón mínima = ${razones[filaPivote].toFixed(3)})\n`;

    // Guardar pivote para resaltarlo en tabla
    let pivote = tabla[filaPivote][colPivote];

    // Paso 3: Dividir fila pivote por pivote para hacer 1
    pasosTexto += `Hacer 1 el pivote dividiendo fila ${filaPivote+1} entre ${pivote.toFixed(3)}\n`;
    for(let j=0; j<=totalVar; j++) {
      tabla[filaPivote][j] /= pivote;
    }

    pasosTexto += crearTabla(tabla, filaPivote, colPivote) + '\n';

    // Paso 4: Hacer ceros en columna pivote para otras filas
    for(let i=0; i<=numRes; i++) {
      if(i !== filaPivote) {
        let factor = tabla[i][colPivote];
        if(factor !== 0) {
          pasosTexto += `F${i+1} = F${i+1} - (${factor.toFixed(3)}) * F${filaPivote+1}\n`;
          for(let j=0; j<=totalVar; j++) {
            tabla[i][j] = tabla[i][j] - factor * tabla[filaPivote][j];
          }
        }
      }
    }

    pasosTexto += crearTabla(tabla, -1, -1) + '\n';

    // Actualizar variable básica
    base[filaPivote] = colPivote;
  }

  // Mostrar solución óptima
  pasosTexto += '--- Solución Óptima ---\n';
  for(let i=0; i<numVar; i++) {
    let idx = base.indexOf(i);
    if(idx !== -1) {
      pasosTexto += `x${i+1} = ${tabla[idx][totalVar].toFixed(3)}\n`;
    } else {
      pasosTexto += `x${i+1} = 0\n`;
    }
  }
  pasosTexto += `Z = ${tabla[numRes][totalVar].toFixed(3)}\n`;

  resultado.innerHTML = pasosTexto;
}
