
/* Preloader del visor */
ARProgrezz.Preloader = function() {
  
  var scope = this;
  
  var inited = false;
  var load_screen = null;
  
  /* Inicialización del preloader */
  this.initLoad = function() {
    
    if (inited)
      return;
    
    inited = true;
    
    load_screen = document.createElement('div');
    load_screen.setAttribute("style",
                              "background: #FFF url('" + ARProgrezz.Utils.rootDirectory() + "/img/preloader.gif') no-repeat center center; " +
                              "opacity: 1; " +
                              "position: fixed; " +
                              "z-index: 999; " +
                              "top: 0px; left: 0px; " +
                              "overflow: visible; " +
                              "width: 100%; height: 100%; ");
    
    document.body.appendChild(load_screen);
    
  }
  
  /* Eliminación del preloader */
  this.endLoad = function() {
    
    if (!inited)
      return;
    
    inited = false;
    
    document.body.removeChild(load_screen);
  }
}
