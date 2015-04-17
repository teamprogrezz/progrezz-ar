
/* Sistema de comprobación del soporte de tecnologías requeridas */
ARProgrezz.Support = {};
(function(namespace){
  
  // Tecnologías activadas
  namespace.video = null;
  namespace.gyroscope = null;
  namespace.geolocation = null;
  
  // Función de acceso a vídeo
  namespace.accessVideo = null;
  
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
      ARProgrezz.Utils.waitCallback(signal, end_function);
    }
    else {
      
      available.geolocation = namespace.geolocation = false;
      end_function();
    }
  }
  
  /* TODO Completar código de las señales, y permitir activar o desactivar
  this.Signals = function() {
    
    var video_button;
    
    this.init = function() {
      
      
    }
    
  }*/

})(ARProgrezz.Support);

/* Vídeo del visor de realidad aumentada */
ARProgrezz.Video = function () {
  
  var scope = this; // Ámbito
    
  this.arVideo = null; // Elemento de vídeo
  this.onSuccess = null; // Función a ejecutar tras inicialización con éxito
  
  var video = null; // Objeto para indicar el estado de la inicialización
  
  /* Función de acceso al vídeo */
  function accessVideo(constraints) {
    
    // Función de acceso a los datos de vídeo
    navigator.getUserMedia = ARProgrezz.Support.accessVideo;
    
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
      // TODO Generalizar esto en support
      // Función para la comprobación de soporte de WebGL
      function webglAvailable() { 
        try {
          var canvas = document.createElement( 'canvas' );
          return !!( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) ); 
        } 
        catch ( e ) { return false; } 
      }
      // TODO Poner donde corresponda, crear una clase si es necesario
      var camera, scene, renderer, controls;
      function animate() {
        
        requestAnimationFrame( animate );
        if (controls)
          controls.update();
				renderer.render( scene, camera );
      }
			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

  /* Inicialización del vídeo del visor */
  this.initVideo = function() {
    
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
      var mesh;
      // TODO Tener cuidado con la rutas, hacerlo como en LinkSnake
      // TODO Completar para que funcione a modo de vídeo en el resize y comentar correctamente
      camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
      camera.target = new THREE.Vector3( 0, 0, 0 );
      controls = new THREE.DeviceOrientationControls(camera);
      scene = new THREE.Scene();

      var geometry = new THREE.SphereGeometry( 500, 60, 40 );
      geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
      var texture = THREE.ImageUtils.loadTexture( 'img/textures/equirectangular_city.jpg' );
      texture.minFilter = THREE.LinearFilter;
      var material = new THREE.MeshBasicMaterial({    
          map: texture
      });
      mesh = new THREE.Mesh( geometry, material );
      
      scene.add( mesh );

      
      // Creación del renderizador
      if ( webglAvailable() ) // WebGL soportado -> Renderizador WebGL
        renderer = new THREE.WebGLRenderer(); 
      else // WebGL no soportado -> Renderizador Canvas
        renderer = new THREE.CanvasRenderer();
      
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.domElement.setAttribute("style", "position: absolute; left: 0px; top: 0px; z-index: -1");
      document.body.appendChild( renderer.domElement );
      
      scope.arVideo = renderer.domElement;
      // TODO Actualizar esto al redimensionar
      scope.arVideo.videoWidth = window.innerWidth;
      scope.arVideo.videoHeight = window.innerHeight;
      window.addEventListener( 'resize', onWindowResize, false );
      
      animate();
      
      if (ARProgrezz.Support.gyroscope) {
        //code
      }
      
      /*scope.arVideo = document.createElement("img");
      scope.arVideo.setAttribute("style", "position: absolute; left: 0px; top: 0px; z-index: -1");
      scope.arVideo.src = 'img/background_video.jpg';
      scope.arVideo.width = window.innerWidth;
      scope.arVideo.height = window.innerHeight;
      
      document.body.appendChild(scope.arVideo);*/
      
      if (scope.onSuccess)
        scope.onSuccess();
      
    }
  }
  
};

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
  var MIN_VISION = 0.1, MAX_VISION = 1000; // Distancia mínima y máxima a la que enfoca la cámara (rango de visión)
  // TODO Los objetos deben crearse a parte, quitar de aquí
  var OBJECT_RADIUS = 1;
  
  /* Variables globales */
  var real_height = 0; // Alto real del visor (incluyendo espacio no utilizado por el vídeo)
  var ar_video; // Vídeo del visor - ARProgrezz.Video
  // TODO Colocar lo de realidad aumentada donde corresponda
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
      // TODO Cambiar por ARProgrezz.PositionControls, y añadir la geolocalización
      //ar_controls = new ARProgrezz.PositionControls(ar_camera);
      ar_controls = new THREE.DeviceOrientationControls(ar_camera);
      
      return {vision: ar_camera, controls: ar_controls};
    }
    else if (settings.mode === 'stereoscopic') {
      
      // TODO Cambiar en el futuro, para la visión estereoscópica
    }
    else {
      alert("Error: No se reconoce el modo seleccionado (" + ar.settings.mode + ")")
    }
  }
  
  /* Inicialización de la escena de realidad aumentada */
  function initAR(onSuccess) {
    
    // Creación de la escena
    ar_scene = new THREE.Scene();
    
    // Inicializando al jugador
    ar_player = initPlayer();
    
    // TODO Generalizar esto utilizando ARProgrezz.Support
    // Función para la comprobación de soporte de WebGL
    function webglAvailable() { 
      try {
        var canvas = document.createElement( 'canvas' );
        return !!( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) ); 
      } 
      catch ( e ) { return false; } 
    } 
    
    // Creación del renderizador
    var options = { alpha: true };
    if ( webglAvailable() ) // WebGL soportado -> Renderizador WebGL
      ar_renderer = new THREE.WebGLRenderer(options); 
    else // WebGL no soportado -> Renderizador Canvas
      ar_renderer = new THREE.CanvasRenderer(options);
    
    ar_renderer.setClearColor( 0x000000, 0 );
    document.body.appendChild(ar_renderer.domElement);
    
    // Continuando con la inicialización
    onSuccess();
  }
  
  /* Actualización de los objetos */
  function updateObjects() {
    
    for (o in objects)
      objects[o].rotation.y += 0.02;
  }
  
  /* Iniciar actualización de la escena */
  function playAnimation() {
    
    function render() {
      requestAnimationFrame(render);
      
      updateObjects();
      
      ar_controls.update();
      ar_renderer.render(ar_scene,ar_camera);
    }
    render();
  }
  
  /* Ajustar la posición y tamaño del visor */
  function adjustViewer() {
    
    setTimeout(function() {
      
      // Tamaño del vídeo
      ar_video.arVideo.width = window.innerWidth;
      ar_video.arVideo.height = real_height = window.innerHeight;
      
      // Calculando tamaño real del visor de acuerdo al vídeo
      var viewer_ratio = Math.min(ar_video.arVideo.width / ar_video.arVideo.videoWidth, ar_video.arVideo.height / ar_video.arVideo.videoHeight);
      scope.viewerWidth = viewer_ratio * ar_video.arVideo.videoWidth;
      scope.viewerHeight = viewer_ratio * ar_video.arVideo.videoHeight;
      
      // Calculando relación de aspecto
      ar_camera.aspect = scope.viewerWidth / scope.viewerHeight;
      
      // Tamaño y posición de la escena
      ar_renderer.domElement.setAttribute("style", "display: block; margin: auto; padding-top: " + Math.trunc((real_height - scope.viewerHeight) / 2.0) + "px;");
      ar_renderer.setSize(scope.viewerWidth, scope.viewerHeight);
      
    }, ORIENTATION_DELAY);
  }
  
  /* Inicializar visor de realidad aumentada */
  this.initViewer = function(settings) {
    
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
      
      // TODO Quitar chivatos
      console.log(ARProgrezz.Support);
      
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
        };
        
        // Inicializar vídeo
        ar_video.initVideo();
      });
    });
  }
  
  /* Añadir objeto geolocalizado a la escena del visor */
  this.addObject = function(latitude, longitude) {
    
    // TODO Utilizar la latitud y la longitud para asignar la posición al objeto
    // TODO Dibujar un objeto de verdad y reestructurar esto para que haga lo que debería hacer
    
    var texture = THREE.ImageUtils.loadTexture( 'img/textures/sold_to_spring.jpg' );
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