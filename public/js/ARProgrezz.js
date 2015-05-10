ARProgrezz = {}; // Módulo de realidad aumentada

/* Indicadores de estado */
ARProgrezz.Flags = {
  SUCCESS: 1,
  ERROR: -1,
  WAIT: 0
};

/* Utilidades */
ARProgrezz.Utils = {};
(function(namespace){
  
  var WAIT_DELAY = 200; // (ms) Retardo de espera a Callbacks

  /* Espera de un Callback */
  namespace.waitCallback = function(obj, end_function) {
    
    if (!end_function)
      return;
    
    if (obj.flag == ARProgrezz.Flags.WAIT)
      setTimeout(namespace.waitCallback, WAIT_DELAY, obj, end_function)
    else if (obj.flag == ARProgrezz.Flags.SUCCESS)
      end_function();
  }
  
  /* Mostrar texto en pantalla (Mobile Debug) */
  namespace.debugText = function(text) {
	
    var p = document.querySelector("p");
    if(!p) {
      p = document.createElement("p");
      document.body.appendChild(p);
    }
    else {
      p.removeChild(p.childNodes[0]);
    }
    var n_text = document.createTextNode(text);
    p.appendChild(n_text);
  }
  
  /* Obtener ruta del directorio raíz del módulo */
  namespace.rootDirectory = function() {
    
    var scripts = document.getElementsByTagName("script");
    var path = null;
    
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src != "")
        path = scripts[i].src;
      if (scripts[i].src.search("ARProgrezz.js") != -1) {
        path = scripts[i].src;
        break;
      }
    }
    
    var name = path.split("/").pop();
    return path.replace("/js/" + name, "");
  }
  
  /* Establecer el navegador en pantalla completa */
  namespace.fullScreen = function() {
    
    var screen = document.documentElement;
    var requestFullScreen = screen.requestFullScreen || screen.webkitRequestFullScreen || screen.mozRequestFullScreen || screen.msRequestFullScreen;
    
    if (requestFullScreen)
	    requestFullScreen.call(screen);
  }
  
  /* Bloquear la orientación del dispositivo */
  namespace.lockOrientation = function() {
    
    screen.lockOrientation = screen.lockOrientation || screen.webkitLockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
    
    // TODO Quitar chivatos
    if (screen.lockOrientation) {
      screen.lockOrientation('landscape');
      alert("Orientación bloqueada");
    }
    else {
      alert("No se puede bloquear la orientación");
    }
  }
  
})(ARProgrezz.Utils);