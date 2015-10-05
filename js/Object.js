
/* Objetos de realidad aumentada */
ARProgrezz.Object = {};

/* Objecto básico - Tetraedro */
ARProgrezz.Object.Basic = function (coords, collectable, onSelectEvent, arControls, anisotropy, range) {

    'use strict';

    var scope = this; // Ámbito

    /* Constantes */
    var RADIUS_RATIO = 0.03; // Relación entre el rango de visión y el radio de un objeto para la adecuación en tamaño de los objetos en rango
    var OBJECT_RADIUS = 1.5; // Radio del objeto
    var ROTATION = 0.4; // Velocidad de rotación del objeto
    var REDUCTION_BASE = 0.15; // Constante que indica la reducción de escalan del objeto
    var REDUCTION_ACCELERATION = 3; // Determina el aumento de velocidad en la reducción de escala del objeto
    var COLOR_DELAY = 250; // Tiempo (ms) que permanece el objeto con el color que indica selección
    var COLOR_DEFAULT = 0xffffff; // Color por defecto del objeto
    var COLOR_SELECT = 0xff0000; // Color de selección del objeto
    var IMAGE_PATH = '/img/textures/sold_to_spring.jpg'; // Ruta de la textura del objeto

    /* Función por defecto de respuesta a evento */
    function defaultSelect () {

        alert(" > Objeto obtenido <\n > Coordenadas:\n     - Latitud: " + scope.latitude + "\n     - Longitud: " + scope.longitude);
    }

    /* Atributos */
    this.threeObject = null; // Objeto de Three.js
    this.latitude = 0; // Latitud real del objeto
    this.longitude = 0; // Longitud real del objeto
    this.collectable = true; // Indica si el objeto se puede seleccionar sólo una vez
    this.onSelect = defaultSelect; // Función ejecutada en evento

    /* Variables */
    var selected = false; // Indica si ha sido seleccionado
    var positionControls; // Objeto de ARProgrezz.PositionControls que calculará la posición de los objetos

    /* Seleccionar el objeto */
    this.select = function () {

        scope.threeObject.material.color.setHex(COLOR_SELECT);
    };

    /* Deseleccionar el objeto */
    this.unselect = function () {

        if (selected && scope.collectable) {
            return;
        }

        selected = true;

        setTimeout(function () {
            scope.threeObject.material.color.setHex(COLOR_DEFAULT);
        }, COLOR_DELAY);
alert("Estoy aquíiii");
alert(JSON.stringify(scope.onSelect));
        scope.onSelect();
    };

    /* Actualizar frame del objeto */
    this.updateAnimation = function (delta) {

        if (scope.collectable && selected) {

            var reduction = (REDUCTION_BASE + (1 - Math.pow(scope.threeObject.scale.x, REDUCTION_ACCELERATION))) * delta; // Reducción con aumento de aceleración

            // Comprobación de si se ha llegado o no al tamaño mínimo
            if ((scope.threeObject.scale.x - reduction) > 0) {
                scope.threeObject.scale.addScalar(-reduction); // Aplicando reducción a la escala
            } else {
                scope.threeObject.visible = false; // Se hace invisible el objeto
            }
        }

        scope.threeObject.rotation.y += ROTATION * delta; // Rotación
    };

    /* Actualización de la posición */
    this.updatePosition = function () {

        // Ajustando posición de acuerdo a la latitud y longitud
        scope.threeObject.position.z = positionControls.getObjectZ(scope.latitude); // Latitud -> Eje Z (invertido)
        scope.threeObject.position.x = positionControls.getObjectX(scope.longitude); // Longitud -> Eje X
    };

    /* Actualizar las características del objeto */
    function setOptions () {

        positionControls = arControls;

        if (coords) {
            scope.latitude = coords.latitude; // Latitud
            scope.longitude = coords.longitude; // Longitud
        } else {
            console.log("Error: Coordenadas de objeto no válidas");
        }

        if (collectable) {
            scope.collectable = collectable; // Indicador de obtenible
        }

        if (onSelectEvent) {
            scope.onSelect = onSelectEvent; // Función de respuesta a evento
        }

        if (range) {
            OBJECT_RADIUS = range * RADIUS_RATIO;
        }
    }

    /* Creación del objeto */
    function init() {

        // Actualizando características
        setOptions();

        // Creando textura
        var texture = THREE.ImageUtils.loadTexture(ARProgrezz.Utils.rootDirectory() + IMAGE_PATH);
        texture.anisotropy = anisotropy;

        // Creando objeto de Three.js
        var material = new THREE.MeshBasicMaterial({map: texture});
        var geometry = new THREE.OctahedronGeometry(OBJECT_RADIUS, 0);

        scope.threeObject = new THREE.Mesh(geometry, material);
        scope.threeObject.ARObject = scope; // Referencia al contenedor del objeto

        // Inicializando posición
        scope.updatePosition();
    }

    init();
};