
/* Sistema de comprobación del soporte de tecnologías requeridas */
ARProgrezz.Support = {};
(function(namespace){
  
  var GEO_TIMEOUT = 8000 // (ms)
  
  // Tecnologías activadas
  namespace.video = null;
  namespace.gyroscope = null;
  namespace.geolocation = null;
  
  // Función de acceso a vídeo
  namespace.accessVideo = null;
  
  // Vídeo stream
  namespace.videoStream = null;
  
  // Tecnologías soportadas
  var available = {
    video: false,
    gyroscope: false,
    geolocation: false
  }
  
  /* Comprobación de acceso a vídeo, giroscopio, y geolocalización */
  namespace.check = function(end_function) {
    checkVideoCamera(function() {
      checkGyroscope(function() {
        checkGeolocation(function() {
          if (end_function)
            end_function();
        });
      })
    });
  }
  
  /* Acceso a la cámara de vídeo (getUserMedia) */
  function checkVideoCamera(end_function) {
    
    namespace.accessVideo = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    
    if (namespace.accessVideo) {
      
      var signal = { flag: ARProgrezz.Utils.Flags.WAIT };
      
      navigator.getUserMedia = namespace.accessVideo;
      
      navigator.getUserMedia (
        {video: true, audio: false},
        function(localMediaStream) {
          namespace.video = available.video = true;
          namespace.videoStream = localMediaStream;
          signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
        },
        function(error) {
          available.video = namespace.video = false;
          signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
        }
      );
      ARProgrezz.Utils.waitCallback(signal, end_function);
    }
    else {
      
      available.video = namespace.video = false;
      end_function();
    }
  }
  
  /* Acceso al giroscopio */
  function checkGyroscope(end_function) {
    
    if (window.DeviceOrientationEvent) {
      
      var signal = { flag: ARProgrezz.Utils.Flags.WAIT };
      
      var EVENT_TIME = 1000;
      var count = 0;
      
      var onEvent = function(event) {
        
        count += 1;
      };
      
      var onEnd = function() {
                
        window.removeEventListener( 'deviceorientation', onEvent, false );
        
        if (count > 1)
          available.gyroscope = namespace.gyroscope = true;
        else
          available.gyroscope = namespace.gyroscope = false;
        signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
      }
      
      window.addEventListener( 'deviceorientation', onEvent, false );
      ARProgrezz.Utils.waitCallback(signal, end_function);
      setTimeout(onEnd, EVENT_TIME);
    }
    else {
      
      available.gyroscope = namespace.gyroscope = false;
      end_function();
    }
  }
  
  /* Acceso a la geolocalización */
  function checkGeolocation(end_function) {
    // TODO Si no encuentra la geolocalización puede quedarse años, ponerle un límite de espera
    if (navigator.geolocation) {
      
      var signal = { flag: ARProgrezz.Utils.Flags.WAIT };
      
      navigator.geolocation.getCurrentPosition(
        function(position) {
          namespace.geolocation = available.geolocation = true;
          signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
        },
        function(error) {
          available.geolocation = namespace.geolocation = false;
          signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
        }
      );
      
      setTimeout(function() {
        if (signal.flag == ARProgrezz.Utils.Flags.WAIT) {
          available.geolocation = namespace.geolocation = false;
          signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
        }
      }, GEO_TIMEOUT);
      
      ARProgrezz.Utils.waitCallback(signal, end_function);
    }
    else {
      
      available.geolocation = namespace.geolocation = false;
      end_function();
    }
  }
  
  /* Comprobación de soporte de WebGL */
  namespace.webglAvailable = function() {
    try {
      var canvas = document.createElement( 'canvas' );
      return !!( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) ); 
    } 
    catch ( e ) { return false; } 
  }
  
  /* TODO Completar código de las señales, y permitir activar o desactivar */
  namespace.activateVideo = function() {
    console.log("Pinguino");
  }
  
  namespace.activateGeolocation = function() {
    // TODO Poner la carga, pues está desactivada la geolocalización y desactivarla en la actualización de los objetos
    alert("No se puede desactivar la geolocalización");
  }
  
  namespace.activateGyroscope = function() {
    console.log("Pinguino");
  }
  
  namespace.Signals = function() {
  // TODO Comprobar en orden: Geolocalización, giroscopio y vídeo, si no hay geolocalización: se acabó, y si no hay giroscopio, no comprobar vídeo
  
  /* TODO Completar código de las señales, y permitir activar o desactivar */
    
    var scope = this;
    
    this.init = function() {
      
      var signals = document.createElement("div");
      signals.setAttribute("style",
                           "position: absolute;" +
                           "z-index: 1;" +
                           "bottom: 10px;" +
                           "left: 10px;");
      
      for(var i = 0; i < 3; i++) {
        
        var signal = document.createElement("img");
        var signal_button = document.createElement("a");
        
        signals.appendChild(document.createElement("br"));
        
        signal.setAttribute("style",
                            "border: outset 1px;" +
                            "margin: 2.5px;");
        
        var signal_type, signal_img;
        switch(i) {
          case 0: // Geolocalización
            signal_type = ARProgrezz.Support.geolocation;
            signal.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/geolocation.png";
            signal.onmousedown = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/geolocation-white.png";
            };
            signal.onmouseup = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/geolocation.png";
            };
            signal.onmouseleave = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/geolocation.png";
            };
            signal.ontouchstart = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/geolocation-white.png";
            };
            signal.ontouchend = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/geolocation.png";
            };
            signal.ontouchcancel = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/geolocation.png";
            };
            signal_button.onclick = ARProgrezz.Support.activateGeolocation;
          break;
          case 1: // Giroscopio
            signal_type = ARProgrezz.Support.gyroscope;
            signal.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/gyroscope.png";
            signal.onmousedown = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/gyroscope-white.png";
            };
            signal.onmouseup = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/gyroscope.png";
            };
            signal.onmouseleave = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/gyroscope.png";
            };
            signal.ontouchstart = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/gyroscope-white.png";
            };
            signal.ontouchend = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/gyroscope.png";
            };
            signal.ontouchcancel = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/gyroscope.png";
            };
            signal_button.setAttribute('onclick', 'ARProgrezz.Support.activateGyroscope();');
          break;
          case 2: // Vídeo
            signal_type = ARProgrezz.Support.video;
            signal.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/videocamera.png";
            signal.onmousedown = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/videocamera-white.png";
            };
            signal.onmouseup = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/videocamera.png";
            };
            signal.onmouseleave = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/videocamera.png";
            };
            signal.ontouchstart = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/videocamera-white.png";
            };
            signal.ontouchend = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/videocamera.png";
            };
            signal.ontouchcancel = function() {
              this.src = ARProgrezz.Utils.rootDirectory() + "/img/icons/videocamera.png";
            };
            signal_button.setAttribute('onclick', 'ARProgrezz.Support.activateVideo();');
          break;
        }
        
        if (signal_type)
          signal.style.backgroundColor = "#55FC18";
        else
          signal.style.backgroundColor = "#666666"; 
        
        signal_button.appendChild(signal);
        signals.appendChild(signal_button);
      }
        
      document.body.appendChild(signals);
    }
    
    scope.init();
  };
  
})(ARProgrezz.Support);