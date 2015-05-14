
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
      
      var signal = { flag: ARProgrezz.Flags.WAIT };
      
      navigator.getUserMedia = namespace.accessVideo;
      
      navigator.getUserMedia (
        {video: true, audio: false},
        function(localMediaStream) {
          namespace.video = available.video = true;
          namespace.videoStream = localMediaStream;
          signal.flag = ARProgrezz.Flags.SUCCESS;
        },
        function(error) {
          available.video = namespace.video = false;
          signal.flag = ARProgrezz.Flags.SUCCESS;
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
      
      var signal = { flag: ARProgrezz.Flags.WAIT };
      
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
        signal.flag = ARProgrezz.Flags.SUCCESS;
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
      
      var signal = { flag: ARProgrezz.Flags.WAIT };
      
      navigator.geolocation.getCurrentPosition(
        function(position) {
          namespace.geolocation = available.geolocation = true;
          signal.flag = ARProgrezz.Flags.SUCCESS;
        },
        function(error) {
          available.geolocation = namespace.geolocation = false;
          signal.flag = ARProgrezz.Flags.SUCCESS;
        }
      );
      
      setTimeout(function() {
        if (signal.flag == ARProgrezz.Flags.WAIT) {
          available.geolocation = namespace.geolocation = false;
          signal.flag = ARProgrezz.Flags.SUCCESS;
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
    console.log("Pinguino");
  }
  
  namespace.activateGyroscope = function() {
    console.log("Pinguino");
  }
  
  namespace.Signals = function() {
    
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
            signal.src = "img/icons/geolocation.png";
            signal_button.setAttribute('onclick', 'ARProgrezz.Support.activateGeolocation();');
          break;
          case 1: // Giroscopio
            signal_type = ARProgrezz.Support.gyroscope;
            signal.src = "img/icons/gyroscope.png";
            signal_button.setAttribute('onclick', 'ARProgrezz.Support.activateGyroscope();');
          break;
          case 2: // Vídeo
            signal_type = ARProgrezz.Support.video;
            signal.src = "img/icons/videocamera.png";
            signal_button.setAttribute('onclick', 'ARProgrezz.Support.activateVideo();');
          break;
        }
        
        if (signal_type)
          signal.style.backgroundColor = "#55FC18";
        else
          signal.style.backgroundColor = "#C4C4C4"; 
        
        signal_button.appendChild(signal);
        signals.appendChild(signal_button);
      }
        
      document.body.appendChild(signals);
    }
    
    scope.init();
  };
  
})(ARProgrezz.Support);
  
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
          video.flag = ARProgrezz.Flags.SUCCESS;
        }
        
        // Añadiendo el vídeo al documento
        document.body.appendChild(scope.arVideo);
        
        // Conectando el vídeo con la información de la cámara
        scope.arVideo.src = window.URL.createObjectURL(localMediaStream);
      },
      
      // Error Callback
      function(error) {
        alert("Error: " + error);
        video.flag = ARProgrezz.Flags.ERROR;
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
    video = { flag: ARProgrezz.Flags.WAIT };
    
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
}

/* Visor de realidad aumentada */
ARProgrezz.Viewer = function (settings) {
  
  var scope = this; // Ámbito
  
  /* Ajustes del visor */
  this.settings = {
    mode: 'normal' // 'normal' || 'stereoscopic'
  }
  
  /* Atributos */
  this.inited = false; // Indicador de si ha sido iniciado
  this.onInit = null; // Función ejectuada al iniciar
  this.viewerWidth = 0; // Ancho del visor
  this.viewerHeight = 0; // Alto del visor
  
  /* Constantes globales */
  var ORIENTATION_DELAY = 300 // (ms) Retardo de espera para obtención de dimensiones del dispositivo tras cambio de orientación
  var GAME_FOV = 60; // (º) Campo de visión
  // TODO Cambiar el rango de visión, para que el máximo corresponda con el área del mensaje del jugador
  var MIN_VISION = 0.1, MAX_VISION = 3000; // Distancia mínima y máxima a la que enfoca la cámara (rango de visión)
  // TODO Los objetos deben crearse a parte, quitar de aquí
  var OBJECT_RADIUS = 1;
  var ROTATION = 0.4;
  
  /* Variables globales */
  var clock = new THREE.Clock(); // Reloj para la obtención de tiempo entre frames (delta)
  var delta; // Tiempo entre frames (ms)
  var real_height = 0; // Alto real del visor (incluyendo espacio no utilizado por el vídeo)
  var ar_video; // Vídeo del visor - ARProgrezz.Video
  // TODO Colocar lo de realidad aumentada donde corresponda
  // TODO Evento de ratón y toque en controls
  var ar_scene, ar_camera, ar_renderer, ar_player, ar_controls; // Escena de realidad aumentada
  var objects = []; // Lista de objetos
  
  /* Actualización de ajustes */
  function updateSettings(sets) {
    for (s in sets)
      this.settings[s] = sets[s];
  }
  
  /* Inicialización del jugador en la escena de realidad aumentada */
  function initPlayer() {

    if (scope.settings.mode === 'normal') {
      
      // Creación de la cámara que representa la visión del jugador
      ar_camera = new THREE.PerspectiveCamera(GAME_FOV, window.innerWidth / window.innerHeight, MIN_VISION, MAX_VISION);
      
      // Creación del controlador de posición y orientación del jugador
      ar_controls = new ARProgrezz.PositionControls(ar_camera);
      
      return {vision: ar_camera, controls: ar_controls};
    }
    else if (settings.mode === 'stereoscopic') {
      
      // TODO Cambiar en el futuro, para la visión estereoscópica
    }
    else {
      alert("Error: No se reconoce el modo seleccionado (" + ar.settings.mode + ")");
    }
  }
  
  /* Inicialización de la escena de realidad aumentada */
  function initAR(onSuccess) {
    
    // Creación de la escena
    ar_scene = new THREE.Scene();
    
    // Inicializando al jugador
    ar_player = initPlayer();
    
    // Creación del renderizador
    var options = { alpha: true };
    if (ARProgrezz.Support.webglAvailable()) // WebGL soportado -> Renderizador WebGL
      ar_renderer = new THREE.WebGLRenderer(options); 
    else // WebGL no soportado -> Renderizador Canvas
      ar_renderer = new THREE.CanvasRenderer(options);
    ar_renderer.setClearColor( 0x000000, 0 );
    ar_renderer.setPixelRatio( window.devicePixelRatio );
    document.body.appendChild(ar_renderer.domElement);
    
    // Continuando con la inicialización
    onSuccess();
  }
  
  /* Actualización de los objetos */
  function updateObjects() {
    
    for (o in objects)
      objects[o].rotation.y += ROTATION * delta;
  }
  
  /* Iniciar actualización de la escena */
  function playAnimation() {
    
    function render() {
      
      requestAnimationFrame(render);
      
      delta = clock.getDelta(); // Obteniendo tiempo entre frames (delta)
      
      updateObjects(); // Actualizando objetos
      
      ar_controls.update(); // Actualizando cámara
      
      ar_renderer.render(ar_scene, ar_camera); // Renderizado
    }
    
    render();
  }
  
  /* Ajustar la posición y tamaño del visor */
  function adjustViewer() {
    
    setTimeout(function() {
      
      // Tamaño del vídeo
      ar_video.updateSize();
      real_height = ar_video.arVideo.height;
      
      // Calculando tamaño real del visor de acuerdo al vídeo
      var viewer_ratio = Math.min(ar_video.arVideo.width / ar_video.arVideo.videoWidth, ar_video.arVideo.height / ar_video.arVideo.videoHeight);
      scope.viewerWidth = viewer_ratio * ar_video.arVideo.videoWidth;
      scope.viewerHeight = viewer_ratio * ar_video.arVideo.videoHeight;
      
      // Calculando relación de aspecto
      ar_camera.aspect = scope.viewerWidth / scope.viewerHeight;
      ar_camera.updateProjectionMatrix();
      
      // Tamaño y posición de la escena
      ar_renderer.domElement.setAttribute("style", "display: block; margin: auto; padding-top: " + Math.trunc((real_height - scope.viewerHeight) / 2.0) + "px;");
      ar_renderer.setSize(scope.viewerWidth, scope.viewerHeight);
      ar_renderer.setPixelRatio( window.devicePixelRatio );
      
    }, ORIENTATION_DELAY);
  }
  
  /* Inicializar visor de realidad aumentada */
  this.initViewer = function(settings) {
    
    // Estableciendo pantalla completa
    document.addEventListener("click", ARProgrezz.Utils.fullScreen, false);
    
    // Bloqueando orientación apaisada
    ARProgrezz.Utils.lockOrientation();
    
    // Iniciando preloader
    var preloader = new ARProgrezz.Preloader();
    preloader.initLoad();
    
    // Actualizando ajustes
    if (settings)
      updateSettings(settings);
    
    // Comprobando soporte de tecnologías
    var checked = { flag: ARProgrezz.Flags.WAIT };
    ARProgrezz.Support.check( function () {
      checked.flag = ARProgrezz.Flags.SUCCESS;
    });
    
    // Esperando a que se chequeen las tecnologías disponibles, para la inicialización
    ARProgrezz.Utils.waitCallback(checked, function () {
      //console.log(ARProgrezz.Support);
      var signals = new ARProgrezz.Support.Signals(); // TODO Avisos
      // TODO Quitar chivatos
      //alert("Vídeo: " + ARProgrezz.Support.video + " | Geo: " + ARProgrezz.Support.geolocation + " | Gyro: " + ARProgrezz.Support.gyroscope);
      //ARProgrezz.Support.gyroscope = false;
      // Inicializar realidad aumentada
      initAR( function () {
        
        // Creación del vídeo
        ar_video = new ARProgrezz.Video();
        
        // Ejecución tras inicializar vídeo
        ar_video.onSuccess = function() {
          
          // Evento de ajuste de dimensiones y posición del visor
          adjustViewer();
          window.addEventListener( 'orientationchange', adjustViewer, false );
          window.addEventListener( 'resize', adjustViewer, false );
          
          // Iniciar actualizado de la escena
          playAnimation();
          
          // Haciendo efectiva la inicialización
          inited = true;
          
          // Función a ejecutar tras la inicialización
          if (scope.onInit)
            scope.onInit()
          
          // Eliminando preloader
          preloader.endLoad();
        };
        
        // Inicializar vídeo
        ar_video.initVideo(ar_scene);
      });
    });
  }
  
  /* Añadir objeto geolocalizado a la escena del visor */
  this.addObject = function(latitude, longitude) {
    
    // TODO Utilizar la latitud y la longitud para asignar la posición al objeto
    // TODO Dibujar un objeto de verdad y reestructurar esto para que haga lo que debería hacer
    
    var texture = THREE.ImageUtils.loadTexture( ARProgrezz.Utils.rootDirectory() + '/img/textures/sold_to_spring.jpg' );
		texture.anisotropy = ar_renderer.getMaxAnisotropy();

		var material = new THREE.MeshBasicMaterial( { map: texture } );
    var geometry = new THREE.OctahedronGeometry(OBJECT_RADIUS, 0);
    
    var object = new THREE.Mesh(geometry, material);
    object.position.z = -5;
    //object.position.x = ar_controls.getObjectX(latitude);
    //object.position.z = ar_controls.getObjectX(longitude);
    
    objects.push(object);
    
    ar_scene.add(object);
  }
  
};