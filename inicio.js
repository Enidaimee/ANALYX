function obtenerParametro(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
  
  const nombreUsuario = obtenerParametro('nombre') || 'usuario';
 
  document.getElementById('saludo').textContent = `Bienvenido, ${nombreUsuario}!`;
  
  function irAlMenu() {
    window.location.href = "menu.html";
  }
  