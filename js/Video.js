
/* Vídeo del visor de realidad aumentada */
ARProgrezz.Video = function () {
  
  var scope = this; // Ámbito
    
  this.arVideo = null; // Elemento de vídeo
  this.onSuccess = null; // Función a ejecutar tras inicialización con éxito
  
  var video = null; // Objeto para indicar el estado de la inicialización
  
  /* Redimensionado del vídeo */
  this.updateSize = function() {
    
    if (scope.arVideo instanceof ARProgrezz.Video.Panorama)
      scope.arVideo.updateSize();
    else {
      scope.arVideo.width = window.innerWidth;
      scope.arVideo.height = window.innerHeight;
    }
  }

  /* Acceso al vídeo */
  function accessVideo() {
    
    // Estableciendo formato del vídeo
    scope.arVideo = document.createElement('video');
    scope.arVideo.setAttribute("style", "position: absolute; left: 0px; top: 0px; z-index: -1");
    scope.arVideo.width = window.innerWidth;
    scope.arVideo.height = window.innerHeight;
    scope.arVideo.autoplay = true;
    
    scope.arVideo.onloadedmetadata = function() {
      
      // Estableciendo el vídeo como cargado, requisito para continuar con el resto de inicializaciones
      video.flag = ARProgrezz.Utils.Flags.SUCCESS;
    }
        
    // Añadiendo el vídeo al documento
    document.body.appendChild(scope.arVideo);
        
    // Asignando datos de stream (solicitado por Support) al vídeo
    scope.arVideo.src = window.URL.createObjectURL(ARProgrezz.Support.videoStream);
  }

  /* Inicialización del vídeo del visor */
  this.initVideo = function(scene) {
    
    // Indicador del estado de acceso
    video = { flag: ARProgrezz.Utils.Flags.WAIT };
    
    // Comprobación de soporte de acceso a la cámara de vídeo y al giroscopio
    if (ARProgrezz.Support.video && ARProgrezz.Support.gyroscope) {
      
      // Accediendo y cargando el vídeo
      accessVideo();
      
      // Esperando a que el vídeo se cargue correctamente
      ARProgrezz.Utils.waitCallback(video, scope.onSuccess);
    }
    else {
      
      // Creando panorama como alternativa al vídeo
      scope.arVideo = new ARProgrezz.Video.Panorama(scene);
      
      if (scope.onSuccess)
        scope.onSuccess();
    }
  }
  
};

/* Alternativa al vídeo: panorama a partir de imagen equirectangular */
ARProgrezz.Video.Panorama = function(scene) {
  
  var scope = this; // Ámbito
  
  // Dimensiones del panorama y del "vídeo"
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.videoWidth = window.innerWidth;
  this.videoHeight = window.innerHeight;
  
  // Constantes
  var RADIUS = 1000; // TODO Tener cuidado, para que el radio de esto sea igual al rango máximo de la cámara
  var WIDTH_SEGMENTS = 45, HEIGHT_SEGMENTS = 30;
  
  var p_scene = scene; // Escena 3D del visor
  
  /* Redimensionado del "vídeo" */
  this.updateSize = function() {
    
    scope.videoWidth = scope.width = window.innerWidth;
    scope.videoHeight = scope.height = window.innerHeight;
  }
  
  /* Constructor */
  function init() {
    
    var geometry = new THREE.SphereGeometry( RADIUS, WIDTH_SEGMENTS, HEIGHT_SEGMENTS );
    geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

    var texture = THREE.ImageUtils.loadTexture( ARProgrezz.Utils.rootDirectory() + '/img/textures/equirectangular_city.jpg' );
    texture.minFilter = THREE.LinearFilter;
    
    var material = new THREE.MeshBasicMaterial({ map: texture });
    
    var panorama = new THREE.Mesh( geometry, material );
    p_scene.add(panorama);
  }
  
  init();
};