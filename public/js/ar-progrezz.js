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
  namespace.debugText = function (text) {
	
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
  namespace.rootDirectory = function () {
    
    var scripts = document.getElementsByTagName("script");
    var path = scripts[scripts.length-2].src; // TODO Revisar con cuidado, porque se supone que debería ser el último cargado, no el penúltimo
    var name = path.split("/").pop();
    return path.replace("/js/" + name, "");
  }
  
})(ARProgrezz.Utils);
