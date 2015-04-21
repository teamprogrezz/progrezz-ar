
/* Controles de posición */
ARProgrezz.PositionControls = function (camera) {
  
  var scope = this; // Ámbito
  
  this.camera = camera; // Cámara controlada
  this.camera.rotation.reorder( "YXZ" ); // Disposición de los ejes a utilizar (YXZ)
  
  this.enabled = true; // Indicador de controles activados
  
  // Gyroscope
  this.deviceOrientation = {}; // Orientación del dispositivo: ángulos alpha, beta y gamma, que representan un sistema de rotación de ángulos de Tait-Bryan según la convención 'ZXY'
  this.screenOrientation = 0; // Orientación de la pantalla del dispositivo
  
  var onMouseEvent = false;
  var targetX = 0, targetY = 0;
  var targetLon = 0, targetLat = 0;
  var lon = 0, lat = 0;
  var phi = 0, theta = 0;
  
  // Geolocation
  this.firstTime = true; // TODO Comentar devidamente
  this.updating = false;
  this.originLatitude = 0;
  this.originLongitude = 0;
  this.currentLatitude = 0;
  this.currentLongitude = 0;
  
  /* Cambio de orientación del dispositivo */
  var onDeviceOrientationChange = function(event) {
    
    scope.deviceOrientation.alpha = event.alpha;
    scope.deviceOrientation.beta = event.beta;
    scope.deviceOrientation.gamma = event.gamma;
  };
  
  /* Cambio en la orientación de la pantalla del dispositivo */
  var onScreenOrientationChange = function(event) {
    
    scope.screenOrientation = window.orientation || 0;
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

    if (onMouseEvent) {
    // TODO Mirar a ver que es la longitud y la latitud, y el 0.1 establecerlo como velocidad, y usar delta time
      lon = ( targetX - event.clientX ) * 0.1 + targetLon;
      lat = ( event.clientY - targetY ) * 0.1 + targetLat;
    }
  }

  /* Finalización de pulsación de ratón */
  function onMouseUp( event ) {

    onMouseEvent = false;
  }
  
  /* Actualizando la cámara */
  this.update = function () {

    if (!scope.enabled)
      return;

    var alpha = scope.deviceOrientation.alpha ? THREE.Math.degToRad( scope.deviceOrientation.alpha.toFixed(5) ) : 0; // Z
    var beta = scope.deviceOrientation.beta  ? THREE.Math.degToRad( scope.deviceOrientation.beta.toFixed(5) ) : 0; // X
    var gamma = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.gamma.toFixed(5) ) : 0; // Y
    var orient = scope.screenOrientation ? THREE.Math.degToRad( scope.screenOrientation ) : 0; // Orientation
    // TODO Hacer una cosa u otra en función del giroscopio y mirar que cojones se hace realmente
    //setObjectQuaternion(scope.camera.quaternion, alpha, beta, gamma, orient);
    lat = Math.max( - 85, Math.min( 85, lat ) );
    phi = THREE.Math.degToRad( 90 - lat );
    theta = THREE.Math.degToRad( lon );
    
    scope.camera.target.x = 3000 * Math.sin( phi ) * Math.cos( theta );
    scope.camera.target.y = 3000 * Math.cos( phi );
    scope.camera.target.z = 3000 * Math.sin( phi ) * Math.sin( theta );
    scope.camera.lookAt( camera.target );
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
   /*function distanceTwoLats (lat1, lat2) {
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
    if(scope.originLatitude < scope.currentLatitude)  {
      object.position.setX(distanceTwoLats(scope.originLatitude, scope.currentLatitude));
    }
    else {
      object.position.setX(-distanceTwoLats(scope.originLatitude, scope.currentLatitude));
    }
    if(scope.originLongitude < scope.currentLongitude)  {
      object.position.setZ(distanceTwoLongs(scope.originLongitude, scope.currentLongitude));
    }
    else {
      object.position.setZ(-distanceTwoLongs(scope.originLongitude, scope.currentLongitude));
    }
  }
  
  this.getObjectX = function(latitude) {
    return distanceTwoLats(scope.originLatitude, latitude) * ((scope.originLatitude < latitude)? 1 : -1);
  };
  
  this.getObjectZ = function(longitude) {
    return distanceTwoLongs(scope.originLongitude, longitude) * ((scope.originLongitude < longitude)? 1 : -1);
  };*/


  
  // Activando los controles
  this.activate = function() {
    
    // TODO Hay que esperar a que se ejecute por primera vez
    /*navigator.geolocation.watchPosition(
      function(pos) {
        alert("Aquí :D")
        if (scope.updating)
          return;
        
        scope.updating = true;
        alert("Aquí :D")
        if (scope.first_time) {
          alert("Aquí :D")
          scope.originLatitude = scope.currentLatitude = pos.coords.latitude;
          scope.originLongitude = scope.currentLongitude = pos.coords.longitude;
          scope.first_time = false;
        }
        else {
          scope.currentLatitude = pos.coords.latitude;
          scope.currentLongitude = pos.coords.longitude;
        }
        
        updateObject();
        
        scope.updating = false;
      },
      function() {
        alert("No se ha podido T.T"); 
      }
    );
    
    waitFor();

    function data() {
      
      alert(scope.originLatitude + " " + scope.originLongitude + "\n" + scope.currentLatitude + " " + scope.currentLongitude + "\n" + object.position.x + " " + object.position.z);
    }
    
    function cont() {
      onScreenOrientationChangeEvent(); // run once on load
  
      window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
      window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
  
      scope.enabled = true;
      
      setInterval(data ,5000);
    }
    
    function waitFor() {
      
      if (scope.first_time)
        setTimeout(waitFor, 400);
      else
        cont();
    }*/
    
    onScreenOrientationChange(); // Comprobar orientación inicial de la pantalla

    window.addEventListener( 'orientationchange', onScreenOrientationChange, false );
    window.addEventListener( 'deviceorientation', onDeviceOrientationChange, false );
    // TODO Poner solo si no funciona el giroscopio y añadir los de toque
    document.addEventListener( 'mousedown', onMouseDown, false );
    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mouseup', onMouseUp, false );
    camera.target = new THREE.Vector3( 0, 0, 0 ); // TODO Cambiar esto, usar otra variable
    scope.enabled = true;
  };

  /* Desactivando los controles */
  this.disarm = function() {

    window.removeEventListener( 'orientationchange', onScreenOrientationChange, false );
    window.removeEventListener( 'deviceorientation', onDeviceOrientationChange, false );

    scope.enabled = false;
  };
  
  /* Constructor */
  function init() {
    
    scope.activate();
  }
  
  init();
}