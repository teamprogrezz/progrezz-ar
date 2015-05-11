
/* Objetos de realidad aumentada */
ARProgrezz.Object = {};

/* Objecto básico - Tetraedro */
ARProgrezz.Object.Basic = function(lat, lon, onSel) {
  
  var scope = this;
  
  /* Constantes */
  var OBJECT_RADIUS = 1;
  var ROTATION = 0.4;
  
  /* Atributos */
  this.threeObject; // Objeto de Three.js
  this.latitude; // Latitud real del objeto
  this.longitude; // Longitud real del objeto
  this.onSelect; // Función ejecutada en evento
  
  /* Seleccionar el objeto */
  this.select = function() {
    
    scope.threeObject.material.color.setRGB( 1, 0, 0 );
  };
  
  /* Deseleccionar el objeto */
  this.unselect = function() {
    
    scope.threeObject.material.color.setRGB( 1, 1, 1 );
    scope.onSelect();
  };
  
  /* Actualizar frame del objeto */
  this.update = function(delta) {
    
    scope.threeObject.rotation.y += ROTATION * delta;
  };
  
  /* Función por defecto de respuesta a evento */
  function defaultSelect() {
    // TODO Rellenar función por defecto de respuesta a evento.
    console.log("Objeto capturado :D");
  }
  
  /* Creación del objeto */
  function init() {
    
    scope.latitude = lat; // Latitud
    scope.longitude = lon; // Longitud
    if (onSel)
      scope.onSelect = onSel; // Función de respuesta a evento
    else
      scope.onSelect = defaultSelect; // Función de respuesta a evento por defecto;
    
    // Creando textura
    var texture = THREE.ImageUtils.loadTexture( ARProgrezz.Utils.rootDirectory() + '/img/textures/sold_to_spring.jpg' );
		//texture.anisotropy = ar_renderer.getMaxAnisotropy();

    // Creando objeto de Three.js
		var material = new THREE.MeshBasicMaterial( { map: texture } );
    var geometry = new THREE.OctahedronGeometry(OBJECT_RADIUS, 0);
    
    scope.threeObject = new THREE.Mesh(geometry, material);
    scope.threeObject.ARObject = scope; // Referencia al contenedor del objeto
    
    // Ajustando posición
    // TODO Cambiar para que se ajuste a la latitud y la longitud
    scope.threeObject.position.z = -5;
    
    //object.position.x = ar_controls.getObjectX(latitude);
    //object.position.z = ar_controls.getObjectX(longitude);
  }
  
  init();
}
