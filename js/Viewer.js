
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
  
  /* Variables globales */
  var clock = new THREE.Clock(); // Reloj para la obtención de tiempo entre frames (delta)
  var delta; // Tiempo entre frames (ms)
  var real_height = 0; // Alto real del visor (incluyendo espacio no utilizado por el vídeo)
  var ar_video; // Vídeo del visor - ARProgrezz.Video
  // TODO Colocar lo de realidad aumentada donde corresponda
  // TODO Evento de ratón y toque en controls
  var ar_scene, ar_camera, ar_renderer, ar_player, ar_controls; // Escena de realidad aumentada
  var objects; // Lista de objetos
  var targetVector; // Vector de pulsación en pantalla
  var raycaster; // 'raycaster' para eventos de objetos
  var selectedObject = null;
  
  /* Actualización de ajustes */
  function updateSettings(sets) {
    for (s in sets)
      this.settings[s] = sets[s];
  }
  
  /* Inicialización del jugador en la escena de realidad aumentada */
  function initPlayer(onPlayerInit) {

    if (scope.settings.mode === 'normal') {
      
      // Creación de la cámara que representa la visión del jugador
      ar_camera = new THREE.PerspectiveCamera(GAME_FOV, window.innerWidth / window.innerHeight, MIN_VISION, MAX_VISION);
      
      // Creación del controlador de posición y orientación del jugador
      ar_controls = new ARProgrezz.PositionControls(ar_camera);
      ar_controls.onInit = onPlayerInit;
      ar_controls.activate();
      
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
    
    // TODO Comentar debidamente, y al final de la función, y lo de iniciar al jugador
    var ar_inited = { flag: ARProgrezz.Utils.Flags.WAIT };
    
    // Creación de la escena
    ar_scene = new THREE.Scene();
    
    // Inicializando al jugador
    ar_player = initPlayer(function() { // TODO Evitar pedir la geolocalización dos veces
      ar_inited.flag = ARProgrezz.Utils.Flags.SUCCESS;
    });
    
    // Creación del renderizador
    var options = { alpha: true };
    if (ARProgrezz.Support.webglAvailable()) // WebGL soportado -> Renderizador WebGL
      ar_renderer = new THREE.WebGLRenderer(options); 
    else // WebGL no soportado -> Renderizador Canvas
      ar_renderer = new THREE.CanvasRenderer(options);
    ar_renderer.setClearColor( 0x000000, 0 );
    ar_renderer.setPixelRatio( window.devicePixelRatio );
    document.body.appendChild(ar_renderer.domElement);
    
    ARProgrezz.Utils.waitCallback(ar_inited, function () {
      // Continuando con la inicialización
      onSuccess();
    });

  }
  
  /* Actualización de los objetos */
  function updateObjects() {
    
    for (o in objects.children)
      objects.children[o].ARObject.update(delta);
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
  
  // TODO Plantearse poner esto en ARProgrezz.Object
  /* Inicializar gestión y eventos de objetos */
  function initObjects() {
    
    objects = new THREE.Object3D(); // Creando contenedor de objetos
    
    ar_scene.add(objects); // Añadiendo objetos a la escena
    
    targetVector = new THREE.Vector2(); // Creando vector para indicar pulsación en pantalla
    
    raycaster = new THREE.Raycaster(); // Creando 'raycaster' para eventos de ratón
    
    // Eventos de ratón
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup', onTargetEnd, false);
    
    // Eventos de toque
    window.addEventListener('touchstart', onTouchStart, false);
    window.addEventListener('touchend', onTargetEnd, false);
  }
  
  // TODO Referencia: http://soledadpenades.com/articles/three-js-tutorials/object-picking/
  // TODO http://threejs.org/examples/#canvas_interactive_particles
  
  /* Pulsación del visor - MouseDown */
  function onMouseDown(event) {
    
    detectIntersectedObjects(event.clientX, event.clientY);
    if (selectedObject)
      selectedObject.select();
  }
  
  /* Pulsación del visor - TouchDown */
  function onTouchStart(event) {
    
    detectIntersectedObjects(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
    if (selectedObject)
      selectedObject.select();
  }

  /* Pulsación del visor - MouseUp/TouchEnd */
  function onTargetEnd(event) {
    
    if (!selectedObject)
      return;
    
    selectedObject.unselect();
    selectedObject = null;
  }
  
  /* Detección de objetos intersectados */
  function detectIntersectedObjects(posX, posY) {
    
    targetVector.x = 2 * (posX / scope.viewerWidth) - 1;
    targetVector.y = 1 - 2 * (posY / scope.viewerHeight);
    
    raycaster.setFromCamera( targetVector, ar_camera );
    
    var intersects = raycaster.intersectObjects( objects.children );
    
    if (intersects.length > 0)
      selectedObject = intersects[0].object.ARObject;
  }
  
  /* Inicializar visor de realidad aumentada */
  this.initViewer = function(settings) {
    
    // Estableciendo pantalla completa
    document.addEventListener('click', ARProgrezz.Utils.fullScreen, false);
    
    // Bloqueando orientación apaisada
    ARProgrezz.Utils.lockOrientation();
    
    // Iniciando preloader
    var preloader = new ARProgrezz.Preloader();
    preloader.initLoad();
    
    // Actualizando ajustes
    if (settings)
      updateSettings(settings);
    
    // Comprobando soporte de tecnologías
    var checked = { flag: ARProgrezz.Utils.Flags.WAIT };
    ARProgrezz.Support.check( function () {
      checked.flag = ARProgrezz.Utils.Flags.SUCCESS;
    });
    
    // Esperando a que se chequeen las tecnologías disponibles, para la inicialización
    ARProgrezz.Utils.waitCallback(checked, function () {
      
      var signals = new ARProgrezz.Support.Signals(); // TODO Avisos
      
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
          
          // Iniciando gestión de objetos
          initObjects();
          
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
  this.addObject = function(options) {
    
    var object;
    
    // TODO Utilizar la latitud y la longitud para asignar la posición al objeto
    switch(options.type) {
      case 'basic':
        object = new ARProgrezz.Object.Basic(options.coords, options.collectable, options.onSelect, ar_controls);
      break;
      default:
        console.log("Error: Tipo de objeto '" + options.type + "' desconocido");
        return;
      break;
    }
    
    objects.add(object.threeObject);
  }
  
};