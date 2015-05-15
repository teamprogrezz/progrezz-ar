
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
  function accessVideo(constraints) {
    
    // Función de acceso a los datos de vídeo
    navigator.getUserMedia = ARProgrezz.Support.accessVideo;

    // TODO Utilizar el vídeo ya pedido, pedirlo correctamente en Support, y no hacerlo aquí
    //scope.arVideo.src = window.URL.createObjectURL(ARProgrezz.Support.videoStream);
    
    // Obtención de datos de vídeo
    navigator.getUserMedia (
      
      // Restricciones
      constraints,
      
      // Success Callback
      function(localMediaStream) {
        
        // Creación e inicialización del vídeo
        scope.arVideo = document.createElement('video');
        scope.arVideo.setAttribute("style", "position: absolute; left: 0px; top: 0px; z-index: -1");
        scope.arVideo.width = window.innerWidth;
        scope.arVideo.height = window.innerHeight;
        scope.arVideo.autoplay = true;
        
        // Callback de carga del vídeo
        scope.arVideo.onloadedmetadata = function() {
          
          // Estableciendo el vídeo como cargado, requisito para continuar con el resto de inicializaciones
          video.flag = ARProgrezz.Utils.Flags.SUCCESS;
        }
        
        // Añadiendo el vídeo al documento
        document.body.appendChild(scope.arVideo);
        
        // Conectando el vídeo con la información de la cámara
        scope.arVideo.src = window.URL.createObjectURL(localMediaStream);
      },
      
      // Error Callback
      function(error) {
        alert("Error: " + error);
        video.flag = ARProgrezz.Utils.Flags.ERROR;
      }
    );
  }
  
  /* Accediendo a la cámara trasera dependiendo del navegador */
  function accessRearCamera() {
    
    var nav = navigator.userAgent.toLowerCase();
    
    if (nav.indexOf("chrome") != -1) { // En Chrome se utiliza por defecto la cámara frontal, por lo que se selecciona la trasera de forma manual
      
      MediaStreamTrack.getSources(function(sourceInfos) {
        
        // Seleccionando la cámara trasera del dispositivo
        var videoSource = null;
        for (s in sourceInfos)
          if (sourceInfos[s].kind === 'video' && sourceInfos[s].facing != 'user') {
            alert(JSON.stringify(sourceInfos[s]));
            videoSource = sourceInfos[s].id;
          }
        
        accessVideo({video: {optional: [{sourceId: videoSource}]}, audio: false});
      });
    }
    else if (nav.indexOf("firefox") != -1) { // En Firefox el usuario decide que cámara compartir
      accessVideo({video: true, audio: false});
    }
    else { // TODO Contemplar el caso de otros navegadores
      alert (nav); // TODO Quitar alerta
      accessVideo({video: true, audio: false});
    }
    
  }

  /* Inicialización del vídeo del visor */
  this.initVideo = function(scene) {
    
    // Indicador del estado de acceso
    video = { flag: ARProgrezz.Utils.Flags.WAIT };
    
    // Comprobación de soporte de acceso a la cámara de vídeo y al giroscopio
    if (ARProgrezz.Support.video && ARProgrezz.Support.gyroscope) {
      
      // Acceso al vídeo de la cámara trasera
      accessRearCamera();
      
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