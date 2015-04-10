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
  
  var WAIT_DELAY = 100 // (ms)
  
  /* Función de espera de un Callback */
  namespace.waitCallback = function(obj, end_function) {
   
    if (obj.flag == ARProgrezz.Flags.WAIT)
      setTimeout(namespace.waitCallback, WAIT_DELAY, obj, end_function)
    else
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

/* Visor de realidad aumentada */
ARProgrezz.Viewer = function (settings) {
  
  var scope = this; // Ámbito
  
  // TODO Cambiar el rango de visión, para que el máximo corresponda con el área del mensaje del jugador
  var HUMAN_FIELD_OF_VIEW = 70; // (º)
  var MIN_VISION = 0.1, MAX_VISION = 1000;
  var OBJECT_RADIUS = 1;
  
  /* Ajustes del visor */
  this.settings = {
    mode: 'normal' // 'normal' || 'stereoscopic'
  }
  
  this.inited = false;
  
  var ar_video; // Video
  var ar_scene, ar_camera, ar_renderer, ar_player, ar_controls; // Augmented Reality
  
  var objects = []; // Lista de objetos
  
  /* Actualización de ajustes */
  function updateSettings(sets) {
    
    for (s in sets)
      this.settings[s] = sets[s];
  }
  
  /* Inicialización del vídeo del visor */
  function initVideo(onSuccess) {
    
    // Comprobación de soporte de acceso a la cámara de vídeo - getUserMedia
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

    if (navigator.getUserMedia) {
      
      var video = { flag: ARProgrezz.Flags.WAIT };
      
      navigator.getUserMedia (
        
        // Restricciones
        {video: true, audio: false},
        
        // Success Callback
        function(localMediaStream) {
          
          // Creación e inicialización del vídeo
          ar_video = document.createElement('video');
          ar_video.setAttribute("style", "position: absolute; left: 0px; top: 0px; z-index: -1"); // TODO Descablear esto ?
          ar_video.width = window.innerWidth;
          ar_video.height = window.innerHeight;
          ar_video.src = window.URL.createObjectURL(localMediaStream);
          ar_video.autoplay = true;
          document.body.appendChild(ar_video);
          
          video.flag = ARProgrezz.Flags.SUCCESS;
        },
        
        // Error Callback
        function(err) {
          console.log("Error: " + err);
          video.flag = ARProgrezz.Flags.ERROR;
        }
      );
      
      ARProgrezz.Utils.waitCallback(video, onSuccess);
    }
    else {
      alert("Error: No se soporta getUserMedia");
      return ARProgrezz.Flags.ERROR;
      // TODO Alternativa para cuando no se soporte getUserMedia, y tener cuidado que el cubo se dibuja a partir del tamaño del video
    }
  }
  
  /* Inicialización del jugador en la escena de realidad aumentada */
  function initPlayer() {

    if (scope.settings.mode == 'normal') {
      
      // Creación de la cámara que representa la visión del jugador
      ar_camera = new THREE.PerspectiveCamera(HUMAN_FIELD_OF_VIEW, window.innerWidth / window.innerHeight, MIN_VISION, MAX_VISION);
      
      // Creación del controlador de posición y orientación del jugador
      // TODO Cambiar por ARProgrezz.PositionControls, y añadir la geolocalización
      //ar_controls = new ARProgrezz.PositionControls(ar_camera);
      ar_controls = new THREE.DeviceOrientationControls(ar_camera);
      
      return {vision: ar_camera, controls: ar_controls};
    }
    else if (settings.mode == 'stereoscopic') {
      
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

    ar_renderer.setSize(ar_video.width, ar_video.height); // TODO Cambiar por variables globales, y ajustar correctamente el tamaño
    ar_renderer.setClearColor( 0x000000, 0 );
    document.body.appendChild(ar_renderer.domElement);
    
    // Continuando con la inicialización
    onSuccess();
  }
  
  function updateObjects() {
    
    for (o in objects)
      objects[o].rotation.y += 0.02;
  }
  
  function playAnimation() {
    
    function render() {
      requestAnimationFrame(render);
      
      updateObjects();
      
      ar_controls.update();
      ar_renderer.render(ar_scene,ar_camera);
    }
    render();
  }
  
  this.initViewer = function(onInit, settings) {
    // TODO Comprobación de acceso al giroscopio, y a la geolocalización (y pedir permisos si fuera necesario)
    
    // Actualizando ajustes
    if (settings)
    updateSettings(settings);
    
    // Inicializar vídeo
    initVideo( function () {
      // Inicializar realidad aumentada
      initAR( function() {
        
        // Iniciar actualizado de la escena
        playAnimation();
        
        // Haciendo efectiva la inicialización
        inited = true;
        
        // Función a ejecutar tras la inicialización
        if (onInit)
          onInit()
      });
    });
  }
  
  this.addObject = function(latitude, longitude) {
    
    // TODO Utilizar la latitud y la longitud para asignar la posición al objeto
    // TODO Dibujar un objeto de verdad y reestructurar esto para que haga lo que debería hacer
    
    var texture = THREE.ImageUtils.loadTexture( 'img/textures/sold_to_spring.jpg' );
		texture.anisotropy = ar_renderer.getMaxAnisotropy();

		var material = new THREE.MeshBasicMaterial( { map: texture } );
    var geometry = new THREE.OctahedronGeometry(OBJECT_RADIUS, 0);
    
    var object = new THREE.Mesh(geometry, material);
    object.position.z = -5;
    
    objects.push(object);
    
    ar_scene.add(object);
  }
  
};