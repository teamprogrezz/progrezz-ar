
/* Controles de posición */
ARProgrezz.PositionControls = function (camera) {
  
  var scope = this; // Ámbito
  
  this.camera = camera; // Cámara controlada
  this.camera.rotation.reorder( "YXZ" ); // Disposición de los ejes a utilizar (YXZ)
  
  this.enabled = true; // Indicador de controles activados
  
  this.onInit = null; // Función a ejecutar tras inicialización
  
  // Gyroscope
  var deviceOrientation = {}; // Orientación del dispositivo: ángulos alpha, beta y gamma, que representan un sistema de rotación de ángulos de Tait-Bryan según la convención 'ZXY'
  var screenOrientation = 0; // Orientación de la pantalla del dispositivo
  
  var MOUSE_ROTATION_SPEED = 0.1; // Determina la velocidad de rotación de la cámara de acuerdo al desplazamiento del ratón en pantalla
  var TOUCH_ROTATION_SPEED = 0.15; // Determina la velocidad de rotación de la cámara de acuerdo al desplazamiento de toque en pantalla
  
  var onTouchEvent = false; // Evento de toque activo
  var onMouseEvent = false; // Evento de ratón activo
  var visionTarget; // Objetivo de la cámara
  var targetX = 0, targetY = 0; // Coordenadas de pulsación en pantalla
  var targetLon = 0, targetLat = 0; // Valores de latitud y longitud iniciales, representados por el movimiento
  var lon = 0, lat = 0; // Valores de latitud y longitud finales, representados por el movimiento
  var phi = 0, theta = 0; // Grados que determinan rotación de la cámara
  
  // Geolocation
  var firstTime; // TODO Comentar debidamente
  var updating;
  var geoInited;
  var originLatitude = 0;
  var originLongitude = 0;
  var currentLatitude = 0;
  var currentLongitude = 0;
  
  /* Cambio de orientación del dispositivo */
  var onDeviceOrientationChange = function(event) {
    
    deviceOrientation.alpha = event.alpha;
    deviceOrientation.beta = event.beta;
    deviceOrientation.gamma = event.gamma;
  };
  
  /* Cambio en la orientación de la pantalla del dispositivo */
  var onScreenOrientationChange = function(event) {
    
    screenOrientation = window.orientation || 0;
  }
  
  /* Inicio de toque */
  function onTouchStart( event ) {

    event.preventDefault();

    onTouchEvent = true;

    targetX = event.targetTouches[0].clientX;
    targetY = event.targetTouches[0].clientY;

    targetLon = lon;
    targetLat = lat;
  }

  /* Movimiento de toque */
  function onTouchMove( event ) {
    
    event.preventDefault();
    
    if (onTouchEvent) {
      lon = ( targetX - event.targetTouches[0].clientX ) * TOUCH_ROTATION_SPEED + targetLon;
      lat = ( event.targetTouches[0].clientY - targetY ) * TOUCH_ROTATION_SPEED + targetLat;
    }
  }

  /* Finalización de toque */
  function onTouchEnd( event ) {

    event.preventDefault();
  
    onTouchEvent = false;
  }
  
  /* Pulsación de ratón */
  function onMouseDown( event ) {

    event.preventDefault();

    onMouseEvent = true;

    targetX = event.clientX;
    targetY = event.clientY;

    targetLon = lon;
    targetLat = lat;
  }

  /* Movimiento de ratón */
  function onMouseMove( event ) {
    
    event.preventDefault();
    
    if (onMouseEvent) {
      lon = ( targetX - event.clientX ) * MOUSE_ROTATION_SPEED + targetLon;
      lat = ( event.clientY - targetY ) * MOUSE_ROTATION_SPEED + targetLat;
    }
  }

  /* Finalización de pulsación de ratón */
  function onMouseUp( event ) {

    event.preventDefault();
  
    onMouseEvent = false;
  }
  
  /* Actualizando la cámara */
  this.update = function () {

    if (!scope.enabled)
      return;
    
    if (ARProgrezz.Support.gyroscope) {
      var alpha = deviceOrientation.alpha ? THREE.Math.degToRad( deviceOrientation.alpha.toFixed(5) ) : 0; // Z
      var beta = deviceOrientation.beta  ? THREE.Math.degToRad( deviceOrientation.beta.toFixed(5) ) : 0; // X
      var gamma = deviceOrientation.gamma ? THREE.Math.degToRad( deviceOrientation.gamma.toFixed(5) ) : 0; // Y
      var orient = screenOrientation ? THREE.Math.degToRad( screenOrientation ) : 0; // Orientation
      
      setObjectQuaternion(scope.camera.quaternion, alpha, beta, gamma, orient);
    }
    else {
      lat = Math.max( - 85, Math.min( 85, lat ) );
      phi = THREE.Math.degToRad( 90 - lat );
      theta = THREE.Math.degToRad( lon );
      
      visionTarget.x = 3000 * Math.sin( phi ) * Math.cos( theta );
      visionTarget.y = 3000 * Math.cos( phi );
      visionTarget.z = 3000 * Math.sin( phi ) * Math.sin( theta );
      scope.camera.lookAt( visionTarget );
      // TODO Mirar que cojones se hace realmente
    }

  };
  
  // TODO Cambiar esto de forma que tenga sentido para mi
  var setObjectQuaternion = function () {

    var zee = new THREE.Vector3( 0, 0, 1 );
    var euler = new THREE.Euler();
    var q0 = new THREE.Quaternion();
    var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // -PI / 2 sobre el eje x (Euler a Tait-Bryan)

    return function ( quaternion, alpha, beta, gamma, orient ) {

      euler.set( beta, alpha, - gamma, 'YXZ' );                       // Cambiamos el'ZXY' del dispositivo, por la convención 'YXZ' 
      quaternion.setFromEuler( euler );                               // Orientando el dispositivo
      quaternion.multiply( q1 );                                      // Cámara observa a la parte trasera del dispositivo, en lugar de la delantera
      quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) );    // Actualizando cámara en función de la orientación del dispositivo
    }

  }();
  
  // TODO Completar la geolocalización, e inicar una cosa u otra dependiendo de lo disponible, y permitir desactivar y activar en cada momento
  // TODO Funciones para obtener posiciones de los objetos
  function distanceTwoLats (lat1, lat2) {
    var R = 6371; // Radio medio de la tierra (km)
    var dLat = (lat2 - lat1).toRad();
    lat1 = lat1.toRad();
    lat2 = lat2.toRad();
    var a = Math.pow(Math.sin(dLat/2), 2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c * 1000; // Distancia (m)
    return d;
  }
  
  function distanceTwoLongs (lon1, lon2) {
    var R = 6371; // Radio medio de la tierra (km)
    var dLon = (lon2 - lon1).toRad();
    var a = Math.pow(Math.sin(dLon/2), 2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c * 1000; // Distancia (m)
    return d;
  }
  
  function updateObject() {
    
    // TODO Revisar para cuando cruces el meridiano y ecuador y esas cosas, no liarla
    if(originLatitude < currentLatitude)  {
      camera.position.setX(distanceTwoLats(originLatitude, currentLatitude));
    }
    else {
      camera.position.setX(-distanceTwoLats(originLatitude, currentLatitude));
    }
    if(originLongitude < currentLongitude)  {
      camera.position.setZ(distanceTwoLongs(originLongitude, currentLongitude));
    }
    else {
      camera.position.setZ(-distanceTwoLongs(originLongitude, currentLongitude));
    }
  }
  
  this.getObjectZ = function(latitude) {
    return distanceTwoLats(originLatitude, latitude) * ((originLatitude < latitude)? -1 : 1);
  };
  
  this.getObjectX = function(longitude) {
    return distanceTwoLongs(originLongitude, longitude) * ((originLongitude < longitude)? 1 : -1);
  };

  function initGyroscope() {
    
    if (ARProgrezz.Support.gyroscope) {
      
      onScreenOrientationChange(); // Comprobar orientación inicial de la pantalla
      
      /* Eventos de orientación */
      window.addEventListener( 'orientationchange', onScreenOrientationChange, false );
      window.addEventListener( 'deviceorientation', onDeviceOrientationChange, false );
    }
    else {
      
      visionTarget = new THREE.Vector3( 0, 0, 0 ); // Objetivo inicial de la cámara
      
      // Inicialización de variables auxiliares
      onTouchEvent = false;
      onMouseEvent = false;
      targetX = targetY = 0;
      targetLon = targetLat = 0;
      lon = lat = 0;
      phi = theta = 0;
      
      /* Eventos de toque */
      document.addEventListener( 'touchstart', onTouchStart, false );
      document.addEventListener( 'touchmove', onTouchMove, false );
      document.addEventListener( 'touchend', onTouchEnd, false );
      
      /* Eventos de ratón */
      document.addEventListener( 'mousedown', onMouseDown, false );
      document.addEventListener( 'mousemove', onMouseMove, false );
      document.addEventListener( 'mouseup', onMouseUp, false );
    }
  }
  
  function initGeolocation() {
    // TODO Hay que esperar a que se ejecute por primera vez
    navigator.geolocation.watchPosition(
      function(pos) {
        
        if (updating)
          return;
        
        updating = true;
        
        if (firstTime) {
          console.log("Aquí estoy");
          originLatitude = currentLatitude = pos.coords.latitude;
          originLongitude = currentLongitude = pos.coords.longitude;
          firstTime = false;
          geoInited.flag = ARProgrezz.Utils.Flags.SUCCESS;
        }
        else {
          currentLatitude = pos.coords.latitude;
          currentLongitude = pos.coords.longitude;
        }
        
        updateObject();
        
        updating = false;
      },
      function() {
        alert("No se ha podido T.T"); 
      }
    );
    
    setInterval(data,5000);
    function data() {
      
      //alert(originLatitude + " " + originLongitude + "\n" + currentLatitude + " " + currentLongitude + "\n" + camera.position.x + " " + camera.position.z);
    }
    
  }
  
  // Activando los controles
  this.activate = function() {
    
    firstTime = true; // TODO Comentar debidamente
    updating = false;
    geoInited = { flag: ARProgrezz.Utils.Flags.WAIT };
    
    initGyroscope();
    initGeolocation();
    
    scope.enabled = true;
    
    ARProgrezz.Utils.waitCallback(geoInited, function() {
      if (scope.onInit)
        scope.onInit();
    });
    
  };
  
  /* Desactivando giroscopio */
  this.disarmGyroscope = function() {
    
    if (ARProgrezz.Support.gyroscope) {
      
      /* Eventos de orientación */
      window.removeEventListener( 'orientationchange', onScreenOrientationChange, false );
      window.removeEventListener( 'deviceorientation', onDeviceOrientationChange, false );
    }
    else {
      
      /* Eventos de toque */
      document.removeEventListener( 'touchstart', onTouchStart, false );
      document.removeEventListener( 'touchmove', onTouchMove, false );
      document.removeEventListener( 'touchend', onTouchEnd, false );
      
      /* Eventos de ratón */
      document.removeEventListener( 'mousedown', onMouseDown, false );
      document.removeEventListener( 'mousemove', onMouseMove, false );
      document.removeEventListener( 'mouseup', onMouseUp, false );
    }
  }
  
  /* Desactivando geolocalización */
  this.disarmGeolocation = function() {
    
    
  }

  /* Desactivando los controles */
  this.disarm = function() {
    // TODO Esto no tiene sentido en sí
    //window.removeEventListener( 'orientationchange', onScreenOrientationChange, false );
    //window.removeEventListener( 'deviceorientation', onDeviceOrientationChange, false );

    scope.enabled = false;
  };
  
}