
/* Objetos de realidad aumentada */
ARProgrezz.Object = {};

/* Objecto básico - Tetraedro */
ARProgrezz.Object.Basic = function(coords, collectable, onSelectEvent) {
  
  var scope = this;
  
  /* Constantes */
  var OBJECT_RADIUS = 1;
  var ROTATION = 0.4;
  var REDUCTION_BASE = 0.15;
  var REDUCTION_ACCELERATION = 3;
  
  /* Atributos */
  this.threeObject; // Objeto de Three.js
  this.latitude = 0; // Latitud real del objeto
  this.longitude = 0; // Longitud real del objeto
  this.collectable = true; // Indica si el objeto se puede seleccionar sólo una vez
  this.onSelect = defaultSelect; // Función ejecutada en evento
  this.selected = false; // Indica si ha sido seleccionado
  
  /* Seleccionar el objeto */
  this.select = function() {
    
    scope.threeObject.material.color.setRGB( 1, 0, 0 );
  };
  
  /* Deseleccionar el objeto */
  this.unselect = function() {
    
    scope.selected = true;
    scope.threeObject.material.color.setRGB( 1, 1, 1 );
    scope.onSelect();
  };
  
  /* Actualizar frame del objeto */
  this.update = function(delta) {
    
    if (scope.collectable && scope.selected) {
      
      // Comprobación de si se ha llegado o no al tamaño mínimo
      if (scope.threeObject.scale.x > 0)
        scope.threeObject.scale.addScalar(-(REDUCTION_BASE + (1 - Math.pow(scope.threeObject.scale.x, REDUCTION_ACCELERATION))) * delta); // Reducción con aumento de aceleración
      else
        scope.threeObject.visible = false; // Se hace invisible el objeto
    }
    
    scope.threeObject.rotation.y += ROTATION * delta; // Rotación
  };
  
  /* Función por defecto de respuesta a evento */
  function defaultSelect() {
    // TODO Rellenar función por defecto de respuesta a evento.
    console.log("Objeto capturado :D");
  }
  
  /* Actualizar las características del objeto */
  function setOptions() {
    
    if (coords) {
      scope.latitude = coords.latitude; // Latitud
      scope.longitude = coords.longitude; // Longitud
    }
    else
      console.log("Error: Coordenadas de objeto no válidas");
    
    if (collectable)
      scope.collectable = collectable; // Indicador de obtenible
      
    if (onSelectEvent)
      scope.onSelect = onSelectEvent; // Función de respuesta a evento
  }
  
  /* Creación del objeto */
  function init() {
    
    // Actualizando características
    setOptions();
    
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
