ARProgrezz = {};

/* Indicadores de estado */
ARProgrezz.Flags = {
  SUCCESS: 1,
  ERROR: -1,
  WAIT: 0
};

/* Utilidades */
ARProgrezz.Utils = {};
(function(namespace){
  
  var WAIT_DELAY = 200 // (ms) Retardo de espera a Callbacks

  /* Función de espera de un Callback */
  namespace.waitCallback = function(obj, end_function) {
    
    if (!end_function)
      return;
    
    if (obj.flag == ARProgrezz.Flags.WAIT)
      setTimeout(namespace.waitCallback, WAIT_DELAY, obj, end_function)
    else if (obj.flag == ARProgrezz.Flags.SUCCESS)
      end_function();
  }
  
  /* Función para mostrar texto en pantalla (Mobile Debug) */
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
  
})(ARProgrezz.Utils);