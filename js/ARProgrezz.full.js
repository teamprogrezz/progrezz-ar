var ARProgrezz = {}; // Módulo de realidad aumentada

/* Utilidades */
ARProgrezz.Utils = {};
(function (namespace) {

    'use strict';

    /* Indicadores de estado */
    namespace.Flags = {
        SUCCESS: 1,
        ERROR: -1,
        WAIT: 0
    };

    /* Conversor de grados a radianes */
    if (Number.prototype.toRad === undefined) {
        Number.prototype.toRad = function () {
            return this * Math.PI / 180;
        };
    }

    var WAIT_DELAY = 200; // (ms) Retardo de espera a Callbacks

    /* Espera de un Callback */
    namespace.waitCallback = function (obj, end_function) {

        if (!end_function) {
            return;
        }

        if (obj.flag === ARProgrezz.Utils.Flags.WAIT) {
            setTimeout(namespace.waitCallback, WAIT_DELAY, obj, end_function);
        } else if (obj.flag === ARProgrezz.Utils.Flags.SUCCESS) {
            end_function();
        }
    };

    /* Mostrar texto en pantalla (Mobile Debug) */
    namespace.debugText = function (text) {

        var p = document.querySelector("p");
        if (!p) {
            p = document.createElement("p");
            document.body.appendChild(p);
        } else {
            p.removeChild(p.childNodes[0]);
        }
        var n_text = document.createTextNode(text);
        p.appendChild(n_text);
    };

    /* Obtener ruta del directorio raíz del módulo */
    namespace.rootDirectory = function () {

        var scripts = document.getElementsByTagName("script");
        var path = null;

        var i;
        for (i = 0; i < scripts.length; i += 1) {
            if (scripts[i].src !== "") {
                path = scripts[i].src;
            }
            if (scripts[i].src.search("ARProgrezz") !== -1) {
                path = scripts[i].src;
                break;
            }
        }

        var name = path.split("/").pop();
        return path.replace("/js/" + name, "");
    };

    /* Establecer el navegador en pantalla completa */
    namespace.fullScreen = function () {

        var screen = document.documentElement;
        var requestFullScreen = screen.requestFullScreen || screen.webkitRequestFullScreen || screen.mozRequestFullScreen || screen.msRequestFullScreen;

        if (requestFullScreen) {
            requestFullScreen.call(screen);
        }
    };

    /* Bloquear la orientación del dispositivo */
    namespace.lockOrientation = function () {

        screen.lockOrientation = screen.lockOrientation || screen.webkitLockOrientation || screen.mozLockOrientation || screen.msLockOrientation;

        if (screen.lockOrientation) {
            screen.lockOrientation('landscape');
        }
    };

}(ARProgrezz.Utils));

/* Preloader del visor */
ARProgrezz.Preloader = function () {

    'use strict';

    var inited = false; // Indica si se ha iniciado
    var load_screen = null; // Pantalla de carga

    /* Inicialización del preloader */
    this.initLoad = function () {

        if (inited) {
            return;
        }

        inited = true;

        // Creación de la pantalla de carga
        load_screen = document.createElement('div');
        load_screen.setAttribute("style",
                "background: #FFF url('" + ARProgrezz.Utils.rootDirectory() + "/img/preloader.gif') no-repeat center center; " +
                "opacity: 1; " +
                "position: fixed; " +
                "z-index: 999; " +
                "top: 0px; left: 0px; " +
                "overflow: visible; " +
                "width: 100%; height: 100%; ");

        document.body.appendChild(load_screen);

    };

    /* Eliminación del preloader */
    this.endLoad = function () {

        if (!inited) {
            return;
        }

        inited = false;

        document.body.removeChild(load_screen);
    };

};

/* Controles de posición */
ARProgrezz.PositionControls = function (camera) {

    'use strict';

    var scope = this; // Ámbito

    this.camera = camera; // Cámara controlada
    this.camera.rotation.reorder("YXZ"); // Disposición de los ejes a utilizar (YXZ)

    this.giroscopeEnabled = false; // Indicador de controles activados

    this.onInit = null; // Función a ejecutar tras inicialización

    // Gyroscope
    var deviceOrientation = {}; // Orientación del dispositivo: ángulos alpha, beta y gamma, que representan un sistema de rotación de ángulos de Tait-Bryan según la convención 'ZXY'
    var screenOrientation = 0; // Orientación de la pantalla del dispositivo

    var MOUSE_ROTATION_SPEED = 0.1; // Determina la velocidad de rotación de la cámara de acuerdo al desplazamiento del ratón en pantalla
    var TOUCH_ROTATION_SPEED = 0.15; // Determina la velocidad de rotación de la cámara de acuerdo al desplazamiento de toque en pantalla
    var GYROSCOPE_ACCURACY = 5; // Número de decimales de precisión del ángulo de los ejes del giroscopio

    var onTouchEvent = false; // Evento de toque activo
    var onMouseEvent = false; // Evento de ratón activo
    var visionTarget; // Objetivo de la cámara
    var targetX = 0, targetY = 0; // Coordenadas de pulsación en pantalla
    var targetLon = 0, targetLat = 0; // Valores de latitud y longitud iniciales, representados por el movimiento
    var lon = 0, lat = 0; // Valores de latitud y longitud finales, representados por el movimiento
    var phi = 0, theta = 0; // Grados que determinan rotación de la cámara

    // Geolocation
    var firstTime; // Indica acceso a la geolocalización por primera vez
    var updating; // Indica si se están actualizando las coordenadas
    var geoInited; // Indica si se ha iniciado la geolocalización
    var originLatitude = 0; // Latitud de inicio del visor - coordenada z = 0
    var originLongitude = 0; // Longitud de inicio del visor - coordenada x = 0

    /* Cambio de orientación del dispositivo */
    var onDeviceOrientationChange = function (event) {

        deviceOrientation.alpha = event.alpha;
        deviceOrientation.beta = event.beta;
        deviceOrientation.gamma = event.gamma;
    };

    /* Cambio en la orientación de la pantalla del dispositivo */
    var onScreenOrientationChange = function () {

        screenOrientation = window.orientation || 0;
    };

    /* Inicio de toque */
    function onTouchStart (event) {

        onTouchEvent = true;

        targetX = event.targetTouches[0].clientX;
        targetY = event.targetTouches[0].clientY;

        targetLon = lon;
        targetLat = lat;
    }

    /* Movimiento de toque */
    function onTouchMove (event) {

        if (onTouchEvent) {
            lon = (targetX - event.targetTouches[0].clientX) * TOUCH_ROTATION_SPEED + targetLon;
            lat = (event.targetTouches[0].clientY - targetY) * TOUCH_ROTATION_SPEED + targetLat;
        }
    }

    /* Finalización de toque */
    function onTouchEnd () {

        onTouchEvent = false;
    }

    /* Pulsación de ratón */
    function onMouseDown (event) {

        event.preventDefault();

        onMouseEvent = true;

        targetX = event.clientX;
        targetY = event.clientY;

        targetLon = lon;
        targetLat = lat;
    }

    /* Movimiento de ratón */
    function onMouseMove (event) {

        event.preventDefault();

        if (onMouseEvent) {
            lon = (targetX - event.clientX) * MOUSE_ROTATION_SPEED + targetLon; // Grados de desplazamiento en horizontal
            lat = (event.clientY - targetY) * MOUSE_ROTATION_SPEED + targetLat; // Grados de desplazamiento en vertical
        }
    }

    /* Finalización de pulsación de ratón */
    function onMouseUp (event) {

        event.preventDefault();

        onMouseEvent = false;
    }

    /* Actualizando la cámara */
    this.update = function () {

        if (!scope.giroscopeEnabled) {
            return;
        }

        // Actualizado de acuerdo al giroscopio
        if (ARProgrezz.Support.gyroscope) {

            // Ángulos de rotación del dispositivo
            var alpha = deviceOrientation.alpha
                ? THREE.Math.degToRad(deviceOrientation.alpha.toFixed(GYROSCOPE_ACCURACY))
                : 0; // Z
            var beta = deviceOrientation.beta
                ? THREE.Math.degToRad(deviceOrientation.beta.toFixed(GYROSCOPE_ACCURACY))
                : 0; // X
            var gamma = deviceOrientation.gamma
                ? THREE.Math.degToRad(deviceOrientation.gamma.toFixed(GYROSCOPE_ACCURACY))
                : 0; // Y
            var orient = screenOrientation
                ? THREE.Math.degToRad(screenOrientation)
                : 0; // Orientación

            // Modificando el cuaternión de la cámara (determina su orientación), de acuerdo a los ángulos de rotación del dispositivo
            setObjectQuaternion(scope.camera.quaternion, alpha, beta, gamma, orient);

        } else { // Actualizado a partir de eventos

            lat = Math.max(-89, Math.min(89, lat)); // Acotando grados de desplazamiento vertical entre -89º y 89º (para evitar dar la vuelta completa en ese sentido)
            phi = THREE.Math.degToRad(90 - lat); // Ángulo de desplazamiento vertical
            theta = THREE.Math.degToRad(lon); // Ángulo de desplazamiento horizontal

            // Estableciendo coordenadas del vector de acuerdo a los ángulos de desplazamiento
            visionTarget.x = Math.sin(phi) * Math.cos(theta);
            visionTarget.y = Math.cos(phi);
            visionTarget.z = Math.sin(phi) * Math.sin(theta);
            scope.camera.lookAt(visionTarget); // Asignando la orientación de la cámara en el sentido del vector
        }

    };

    /* Modificación de un cuaternión de acuerdo a la posición del dispositivo */
    var setObjectQuaternion = (function () {

        var zee = new THREE.Vector3(0, 0, 1);
        var euler = new THREE.Euler();
        var q0 = new THREE.Quaternion();
        var q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -PI / 2 sobre el eje x (Euler a Tait-Bryan)

        return function (quaternion, alpha, beta, gamma, orient) {

            euler.set(beta, alpha, -gamma, 'YXZ'); // Se cambia el'ZXY' del dispositivo, por la convención 'YXZ'
            quaternion.setFromEuler(euler); // Orientando el dispositivo
            quaternion.multiply(q1); // Cámara observa a la parte trasera del dispositivo, en lugar de la delantera
            quaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // Actualizando cámara en función de la orientación del dispositivo
        };

    }());

    /* Distancia (m) entre dos latitudes */
    function distanceTwoLats (lat1, lat2) {
        var R = 6371; // Radio medio de la tierra (km)
        var dLat = lat2 - lat1;
        dLat = dLat.toRad();
        lat1 = lat1.toRad();
        lat2 = lat2.toRad();
        var a = Math.pow(Math.sin(dLat/2), 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c * 1000; // Distancia (m)
        return d;
    }

    /* Distancia (m) entre dos longitudes */
    function distanceTwoLongs (lat, lon1, lon2) {
        var R = 6371; // Radio medio de la tierra (km)
        var dLon = lon2 - lon1;
        dLon = dLon.toRad();
        var a = Math.pow(Math.cos(lat), 2) * Math.pow(Math.sin(dLon / 2), 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c * 1000; // Distancia (m)
        return d;
    }

    /* Posición en el eje Z de un objeto, dada su latitud */
    this.getObjectZ = function (latitude) {
        return distanceTwoLats(originLatitude, latitude) * ((originLatitude < latitude)
            ? -1
            : 1);
    };

    /* Posición en el eje X de un objeto, dada su longitud */
    this.getObjectX = function (longitude) {
        return distanceTwoLongs(originLatitude, originLongitude, longitude) * ((originLongitude < longitude)
            ? 1
            : -1);
    };

    /* Iniciando giroscopio */
    function initGyroscope () {

        if (ARProgrezz.Support.gyroscope) {

            onScreenOrientationChange(); // Comprobar orientación inicial de la pantalla

            /* Eventos de orientación */
            window.addEventListener('orientationchange', onScreenOrientationChange, false);
            window.addEventListener('deviceorientation', onDeviceOrientationChange, false);
        } else {

            visionTarget = new THREE.Vector3(0, 0, 0); // Objetivo inicial de la cámara

            // Inicialización de variables auxiliares
            onTouchEvent = false;
            onMouseEvent = false;
            targetX = 0;
            targetY = 0;
            targetLon = 0;
            targetLat = 0;
            lon = 0;
            lat = 0;
            phi = 0;
            theta = 0;

            /* Eventos de toque */
            document.addEventListener('touchstart', onTouchStart, false);
            document.addEventListener('touchmove', onTouchMove, false);
            document.addEventListener('touchend', onTouchEnd, false);

            /* Eventos de ratón */
            document.addEventListener('mousedown', onMouseDown, false);
            document.addEventListener('mousemove', onMouseMove, false);
            document.addEventListener('mouseup', onMouseUp, false);
        }
    }

    /* Iniciando geolocalización */
    function initGeolocation () {

        // Cambiando callback de geolocalización para actualización del jugador
        ARProgrezz.Support.geoCallback = function (pos) {

            if (updating) {
                return;
            }

            updating = true;

            originLatitude = pos.coords.latitude;
            originLongitude = pos.coords.longitude;

            if (firstTime) {

                firstTime = false;
                geoInited.flag = ARProgrezz.Utils.Flags.SUCCESS;
            }

            updating = false;
        };
    }

    // Activando los controles
    this.activate = function () {

        firstTime = true; // Indicando que la geolocalización se actualiza la primera vez
        updating = false; // Indicando que no se está actualizando
        geoInited = {flag: ARProgrezz.Utils.Flags.WAIT}; // Indicando que no se ha iniciado la geolocalización

        // Iniciando giroscopio y geoocalización
        initGyroscope();
        initGeolocation();

        scope.giroscopeEnabled = true;

        // Esperando a la inicialización de la geolocalización
        ARProgrezz.Utils.waitCallback(geoInited, function () {
            if (scope.onInit) {
                scope.onInit();
            }
        });

    };

    /* Activando giroscopio */
    this.activateGyroscope = function () {

        initGyroscope();
        scope.giroscopeEnabled = true;
    };

    /* Desactivando giroscopio */
    this.disarmGyroscope = function () {

        if (ARProgrezz.Support.gyroscope) {

            /* Eventos de orientación */
            window.removeEventListener('orientationchange', onScreenOrientationChange, false);
            window.removeEventListener('deviceorientation', onDeviceOrientationChange, false);
        } else {

            /* Eventos de toque */
            document.removeEventListener('touchstart', onTouchStart, false);
            document.removeEventListener('touchmove', onTouchMove, false);
            document.removeEventListener('touchend', onTouchEnd, false);

            /* Eventos de ratón */
            document.removeEventListener('mousedown', onMouseDown, false);
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);
        }

        scope.giroscopeEnabled = false;
    };

};

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

/* Sistema de comprobación del soporte de tecnologías requeridas */
ARProgrezz.Support = {};
(function (namespace) {

    'use strict';

    var GEO_TIMEOUT = 8000; // (ms)
    var SIGNAL_ON_COLOR = "#55FC18"; // green
    var SIGNAL_OFF_COLOR = "#666666"; // gray

    // Tecnologías activadas
    namespace.video = null;
    namespace.gyroscope = null;
    namespace.geolocation = null;

    // Funciones de activación/desactivación
    namespace.onChangeVideo = null;
    namespace.onChangeGyroscope = null;
    namespace.onChangeGeolocation = null;

    // Vídeo stream
    namespace.videoStream = null;

    // Callback de obtención de coordenadas
    namespace.geoCallback = null;

    // Tecnologías soportadas
    var available = {
        video: false,
        gyroscope: false,
        geolocation: false
    };

    /* Comprobación de acceso a vídeo, giroscopio, y geolocalización */
    namespace.check = function (end_function) {
        checkGeolocation(function () {

            if (!available.geolocation) { // Si no hay acceso a la geolocalización, se detiene la carga
                alert(">> El visor no ha podido iniciarse por no ser capaz de acceder a la geolocalización <<");
                return;
            }

            checkGyroscope(function () {

                if (!available.gyroscope) { // Sin giroscopio, no es necesario comprobar la carga del vídeo
                    available.video = false;
                    namespace.video = false;
                    if (end_function) {
                        end_function();
                    }
                    return;
                }

                checkVideoCamera(function () {
                    if (end_function) {
                        end_function();
                    }
                });
            });
        });
    };

    /* Acceso al vídeo */
    function accessVideo (constraints, end_function) {

        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

        if (navigator.getUserMedia) {

            var signal = {flag: ARProgrezz.Utils.Flags.WAIT};

            navigator.getUserMedia(
                constraints, // Reestricciones de acceso a la cámara trasera
                function (localMediaStream) { // Obteniendo datos de vídeo
                    namespace.video = true;
                    available.video = true;
                    namespace.videoStream = localMediaStream;
                    signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
                },
                function () { // Vídeo no accesible
                    available.video = false;
                    namespace.video = false;
                    signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
                }
            );
            ARProgrezz.Utils.waitCallback(signal, end_function);
        } else {

            available.video = false;
            namespace.video = false;
            end_function();
        }
    }

    /* Acceso a la cámara de vídeo (getUserMedia) */
    function checkVideoCamera (end_function) {

        // Accediendo a la cámara trasera dependiendo del navegador
        var nav = navigator.userAgent.toLowerCase();

        if (nav.indexOf("chrome") !== -1) { // En Chrome se utiliza por defecto la cámara frontal, por lo que se selecciona la trasera de forma manual

            MediaStreamTrack.getSources(function (sourceInfos) {

                // Seleccionando la cámara trasera del dispositivo
                var i, s = Object.keys(sourceInfos), videoSource = null;
                for (i = 0; i < s.length; i += 1) {
                    if (sourceInfos[s[i]].kind === 'video' && sourceInfos[s[i]].facing !== 'user') {
                        videoSource = sourceInfos[s].id;
                    }
                }

                accessVideo({video: {optional: [{sourceId: videoSource}]}, audio: false}, end_function);
            });
        } else if (nav.indexOf("firefox") !== -1) { // En Firefox el usuario decide que cámara compartir
            accessVideo({video: true, audio: false}, end_function);
        } else { // Otros navegadores - Acceso estándar
            accessVideo({video: true, audio: false}, end_function);
        }
    }

    /* Acceso al giroscopio */
    function checkGyroscope (end_function) {

        if (window.DeviceOrientationEvent) {

            var signal = {flag: ARProgrezz.Utils.Flags.WAIT};

            var EVENT_TIME = 1000;
            var count = 0;

            var onEvent = function () {

                count += 1;
            };

            var onEnd = function () {

                window.removeEventListener('deviceorientation', onEvent, false);

                if (count > 1) {
                    available.gyroscope = true;
                    namespace.gyroscope = true;
                } else {
                    available.gyroscope = false;
                    namespace.gyroscope = false;
                }
                signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
            };

            window.addEventListener('deviceorientation', onEvent, false);
            ARProgrezz.Utils.waitCallback(signal, end_function);
            setTimeout(onEnd, EVENT_TIME);
        } else {

            available.gyroscope = false;
            namespace.gyroscope = false;
            end_function();
        }
    }

    /* Acceso a la geolocalización */
    function checkGeolocation (end_function) {

        if (navigator.geolocation) {

            var signal = {flag: ARProgrezz.Utils.Flags.WAIT};

            // Callback de acceso a la geolocalización
            namespace.geoCallback = function () {

                if (namespace.geolocation !== null) {
                    return;
                }

                namespace.geolocation = true;
                available.geolocation = true;
                signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
            };
            navigator.geolocation.watchPosition(function (data) {
                namespace.geoCallback(data);
            });

            setTimeout(function () {
                if (signal.flag === ARProgrezz.Utils.Flags.WAIT) {
                    available.geolocation = false;
                    namespace.geolocation = false;
                    signal.flag = ARProgrezz.Utils.Flags.SUCCESS;
                }
            }, GEO_TIMEOUT);

            ARProgrezz.Utils.waitCallback(signal, end_function);
        } else {

            available.geolocation = false;
            namespace.geolocation = false;
            end_function();
        }
    }

    /* Comprobación de soporte de WebGL */
    namespace.webglAvailable = function () {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            console.log(e);
            return false;
        }
    };

    /* Solicitud de activación/desactivación del vídeo */
    function activateVideo () {

        if (!namespace.gyroscope) {
            alert(">> No se puede activar el vídeo con el giroscopio desactivado <<");
            return;
        }

        if (!available.video) {
            alert(">> Vídeo no disponible <<");
            return;
        }

        if (namespace.onChangeVideo) {
            namespace.onChangeVideo();
        }
    }

    /* Solicitud de activación/desactivación de la geolocalización */
    function activateGeolocation () {

        alert(">> No se puede utilizar el visor sin geolocalización <<");
    }

    /* Solicitud de activación/desactivación del giroscopio */
    function activateGyroscope () {

        if (!available.gyroscope) { // Giroscopio no disponible
            alert(">> Giroscopio no disponible <<");
            return;
        }

        if (namespace.video) {// Si el vídeo está activado, se desactiva también
            activateVideo();
        }

        if (namespace.onChangeGyroscope) {
            namespace.onChangeGyroscope();
        }
    }

    /* Señales que indican la disponibilidad de las tecnologías, permitiendo su activación/desactivación */
    namespace.Signals = function () {

        var scope = this; // Ámbito

        var PATH = "/img/icons/"; // Ruta de los iconos
        var EXT = ".png"; // Extensión de los iconos
        var WHITE_EXT = "-white"; // Sufijo de imagen blanca

        var container; // Contenedor de la señales
        var signals = { // Señales
            geolocation: null,
            gyroscope: null,
            video: null
        };

        /* Cambiar el tipo (color) de una señal */
        this.changeSignalType = function (name) {
            if (ARProgrezz.Support[name]) {
                signals[name].style.backgroundColor = SIGNAL_ON_COLOR;
            } else {
                signals[name].style.backgroundColor = SIGNAL_OFF_COLOR;
            }
        };

        /* Inicialización de las señales */
        this.init = function () {

            // Creación del contenedor
            container = document.createElement("div");
            container.setAttribute("style",
                    "position: absolute;" +
                    "z-index: 1;" +
                    "bottom: 10px;" +
                    "left: 10px;");

            // Creación de las señales
            var getSetImage = function (name) {

                return function () {
                    this.src = ARProgrezz.Utils.rootDirectory() + PATH + name + EXT;
                };
            };

            var getSetWhiteImage = function (name) {

                return function () {
                    this.src = ARProgrezz.Utils.rootDirectory() + PATH + name + WHITE_EXT + EXT;
                };
            };

            var i, signal_name, activate_function, setImage, setWhiteImage;
            for (i = 0; i < 3; i += 1) {

                switch (i) {
                case 0:
                    signal_name = 'geolocation';
                    activate_function = activateGeolocation;
                    break;
                case 1:
                    signal_name = 'gyroscope';
                    activate_function = activateGyroscope;
                    break;
                case 2:
                    signal_name = 'video';
                    activate_function = activateVideo;
                    break;
                }

                signals[signal_name] = document.createElement("img");
                signals[signal_name].setAttribute("style",
                        "border: outset 1px;" +
                        "margin: 2.5px;");

                setImage = getSetImage(signal_name);
                setWhiteImage = getSetWhiteImage(signal_name);

                signals[signal_name].src = ARProgrezz.Utils.rootDirectory() + PATH + signal_name + EXT;

                signals[signal_name].addEventListener("mousedown", setWhiteImage);
                signals[signal_name].addEventListener("mouseup", setImage);
                signals[signal_name].addEventListener("mouseleave", setImage);
                signals[signal_name].addEventListener("touchstart", setWhiteImage);
                signals[signal_name].addEventListener("touchend", setImage);
                signals[signal_name].addEventListener("touchcancel", setImage);

                signals[signal_name].addEventListener('click', activate_function);

                if (ARProgrezz.Support[signal_name]) {
                    signals[signal_name].style.backgroundColor = SIGNAL_ON_COLOR;
                } else {
                    signals[signal_name].style.backgroundColor = SIGNAL_OFF_COLOR;
                }

                container.appendChild(document.createElement("br"));
                container.appendChild(signals[signal_name]);
            }

            document.body.appendChild(container); // Añadiendo señales al documento
        };

        scope.init();
    };

}(ARProgrezz.Support));

/* Vídeo del visor de realidad aumentada */
ARProgrezz.Video = function () {

    'use strict';

    var scope = this; // Ámbito

    this.arVideo = null; // Elemento de vídeo
    this.arVideoStereo = null; // Elemento de vídeo auxiliar para la visión estereoscópica
    this.onSuccess = null; // Función a ejecutar tras inicialización con éxito

    var video = null; // Objeto para indicar el estado de la inicialización

    /* Redimensionado del vídeo */
    this.updateSize = function () {

        if (scope.arVideo instanceof ARProgrezz.Video.Panorama) {
            scope.arVideo.updateSize();
        } else {

            scope.arVideo.height = window.innerHeight;

            if (!scope.arVideoStereo) {
                scope.arVideo.width = window.innerWidth;
            } else {
                scope.arVideo.width = window.innerWidth / 2.0;
                scope.arVideoStereo.width = window.innerWidth / 2.0;
                scope.arVideoStereo.height = window.innerHeight;
            }
        }
    };

    /* Eliminación del vídeo */
    this.removeVideo = function () {

        if (scope.arVideo instanceof ARProgrezz.Video.Panorama) {
            scope.arVideo.destroy();
        } else {
            if (scope.arVideoStereo) {
                scope.disarmStereoscopicVideo();
            }
            document.body.removeChild(scope.arVideo);
        }
    };

    /* Acceso al vídeo */
    function accessVideo() {

        // Estableciendo formato del vídeo
        scope.arVideo = document.createElement('video');
        scope.arVideo.setAttribute("style",
                "position: absolute;" +
                "left: 0px;" +
                "top: 0px;" +
                "z-index: -1;" +
                "background-size: cover;");
        scope.arVideo.width = window.innerWidth;
        scope.arVideo.height = window.innerHeight;
        scope.arVideo.autoplay = true;

        scope.arVideo.onloadedmetadata = function () {

            // Estableciendo el vídeo como cargado, requisito para continuar con el resto de inicializaciones
            video.flag = ARProgrezz.Utils.Flags.SUCCESS;
        };

        // Añadiendo el vídeo al documento
        document.body.appendChild(scope.arVideo);

        // Asignando datos de stream (solicitado por Support) al vídeo
        scope.arVideo.src = window.URL.createObjectURL(ARProgrezz.Support.videoStream);
    }

    this.disarmStereoscopicVideo = function () {

        if (scope.arVideo instanceof ARProgrezz.Video.Panorama) {
            return;
        }

        // Modificando el vídeo original a su tamaño original
        scope.arVideo.width = window.innerWidth;

        // Eliminando el vídeo auxiliar de la parte derecha
        document.body.removeChild(scope.arVideoStereo);
        scope.arVideoStereo = null;
    };

    this.activateStereoscopicVideo = function () {

        if (scope.arVideo instanceof ARProgrezz.Video.Panorama) {
            return;
        }

        // Modificando vídeo de la parte izquierda
        scope.arVideo.width = window.innerWidth / 2.0;

        // Creación del vídeo auxiliar de la parte derecha
        scope.arVideoStereo = document.createElement('video');
        scope.arVideoStereo.setAttribute("style", "position: absolute; left: 50%; top: 0px; z-index: -1");
        scope.arVideoStereo.width = window.innerWidth / 2.0;
        scope.arVideoStereo.height = window.innerHeight;
        scope.arVideoStereo.autoplay = true;

        document.body.appendChild(scope.arVideoStereo);

        scope.arVideoStereo.src = window.URL.createObjectURL(ARProgrezz.Support.videoStream);
    };

    /* Inicialización del vídeo del visor */
    this.initVideo = function (scene, range, stereoscopic) {

        // Indicador del estado de acceso
        video = {flag: ARProgrezz.Utils.Flags.WAIT};

        // Comprobación de soporte de acceso a la cámara de vídeo y al giroscopio
        if (ARProgrezz.Support.video && ARProgrezz.Support.gyroscope) {

            // Accediendo y cargando el vídeo
            accessVideo();

            // Creando vídeo en modo estereoscópico
            if (stereoscopic) {
                scope.activateStereoscopicVideo();
            }

            // Esperando a que el vídeo se cargue correctamente
            ARProgrezz.Utils.waitCallback(video, scope.onSuccess);
        } else {

            // Creando panorama como alternativa al vídeo
            scope.arVideo = new ARProgrezz.Video.Panorama(scene, range);

            if (scope.onSuccess) {
                scope.onSuccess();
            }
        }
    };

};

/* Alternativa al vídeo: panorama a partir de imagen equirectangular */
ARProgrezz.Video.Panorama = function (scene, radius) {

    'use strict';

    var scope = this; // Ámbito

    // Dimensiones del panorama y del "vídeo"
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.videoWidth = window.innerWidth;
    this.videoHeight = window.innerHeight;

    // Constantes
    var WIDTH_SEGMENTS = 45, HEIGHT_SEGMENTS = 30; // Segmentos en horizontal y vertical

    var p_scene = scene; // Escena 3D del visor
    var p_radius = radius; // Radio de la esfera del panorama
    var panorama; // Panorama equirectangular

    /* Redimensionado del "vídeo" */
    this.updateSize = function () {

        scope.width = window.innerWidth;
        scope.videoWidth = scope.width;

        scope.height = window.innerHeight;
        scope.videoHeight = scope.height;
    };

    /* Constructor */
    function init () {

        var geometry = new THREE.SphereGeometry(p_radius, WIDTH_SEGMENTS, HEIGHT_SEGMENTS);
        geometry.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));

        var texture = THREE.ImageUtils.loadTexture(ARProgrezz.Utils.rootDirectory() + '/img/textures/equirectangular_city.jpg');
        texture.minFilter = THREE.LinearFilter;

        var material = new THREE.MeshBasicMaterial({map: texture});

        panorama = new THREE.Mesh(geometry, material);
        p_scene.add(panorama);
    }

    /* Destructor */
    this.destroy = function () {

        p_scene.remove(panorama);
    };

    init();
};

/* Visor de realidad aumentada */
ARProgrezz.Viewer = function () {

    'use strict';

    var scope = this; // Ámbito

    /* Ajustes del visor */
    this.settings = {
        mode: 'normal', // 'normal' || 'stereoscopic'
        range: 50, // Distancia máxima (m) a la que se ven los objetos
        signals: true // Indicadores visibles
    };

    /* Atributos */
    this.inited = false; // Indicador de si ha sido iniciado
    this.onInit = null; // Función ejectuada al iniciar
    this.viewerWidth = 0; // Ancho del visor
    this.viewerHeight = 0; // Alto del visor

    /* Constantes globales */
    var ORIENTATION_DELAY = 300; // (ms) Retardo de espera para obtención de dimensiones del dispositivo tras cambio de orientación
    var GAME_FOV = 60; // (º) Campo de visión
    var STEREO_EYE_SEPARATION = 5; // Separación entre los ojos para visión estereoscópica
    var AUX_VISION = 50; // Distancia (m) auxiliar, para ver siempre lo que hay a máximo rango
    var MIN_VISION = 0.1, MAX_VISION; // Distancia mínima y máxima a la que enfoca la cámara (rango de visión)
    var STEREO_ICON_PATH = "/img/icons/stereo.png";
    var STEREO_WHITE_ICON_PATH = "/img/icons/stereo-white.png";

    /* Variables globales */
    var clock = new THREE.Clock(); // Reloj para la obtención de tiempo entre frames (delta)
    var delta; // Tiempo entre frames (ms)
    var real_height = 0; // Alto real del visor (incluyendo espacio no utilizado por el vídeo)
    var ar_video; // Vídeo del visor - ARProgrezz.Video
    var ar_scene, ar_camera, ar_renderer, ar_controls, ar_stereo; // Escena de realidad aumentada
    var real_renderer; // Renderizador que se encarga del dibujado de la escena
    var signals; // Señales que indican estado de activación de tecnologías - ARProgrezz.Support.Signals
    var stereo_signal; // Señal que indica el estado de activación del modo estereoscópico
    var objects; // Lista de objetos
    var targetVector; // Vector de pulsación en pantalla
    var raycaster; // 'raycaster' para eventos de objetos
    var selectedObject = null; // Objeto seleccionado

    /* Actualización de ajustes */
    function updateSettings (sets) {
        var i, s = Object.keys(sets);
        for (i = 0; i < s.length; i += 1) {
            scope.settings[s[i]] = sets[s[i]];
        }
    }

    /* Activación de la visión estereoscópica */
    function activateStereoscopy () {

        scope.settings.mode = 'stereoscopic';
        real_renderer = ar_stereo;
        stereo_signal.style.backgroundColor = "#55FC18";
        ar_video.activateStereoscopicVideo();
    }

    /* Desactivación de la visión estereoscópica */
    function deactivateStereoscopy () {

        scope.settings.mode = 'normal';
        real_renderer = ar_renderer;
        stereo_signal.style.backgroundColor = "#666666";
        ar_video.disarmStereoscopicVideo();
    }

    /* Cambio del estado de la visión estereoscópica */
    function changeStereoscopy () {

        if (scope.settings.mode === 'normal') { // Activación del modo estereoscópico
            activateStereoscopy();
        } else if (scope.settings.mode === 'stereoscopic') { // Desactivación del modo estereoscópico
            deactivateStereoscopy();
        }

        adjustViewer();
    }

    /* Inicialización del botón de visión estereoscópica */
    function initStereoButton () {

        var container = document.createElement("div");
        container.setAttribute("style",
                "position: absolute;" +
                "z-index: 1;" +
                "bottom: 10px;" +
                "right: 10px;");

        stereo_signal = document.createElement("img");
        stereo_signal.setAttribute("style",
                "border: outset 1px;" +
                "margin: 2.5px;");

        var setImage = function () {
            this.src = ARProgrezz.Utils.rootDirectory() + STEREO_ICON_PATH;
        };

        var setWhiteImage = function () {
            this.src = ARProgrezz.Utils.rootDirectory() + STEREO_WHITE_ICON_PATH;
        };

        stereo_signal.src = ARProgrezz.Utils.rootDirectory() + STEREO_ICON_PATH;

        stereo_signal.addEventListener("mousedown", setWhiteImage);
        stereo_signal.addEventListener("mouseup", setImage);
        stereo_signal.addEventListener("mouseleave", setImage);
        stereo_signal.addEventListener("touchstart", setWhiteImage);
        stereo_signal.addEventListener("touchend", setImage);
        stereo_signal.addEventListener("touchcancel", setImage);

        stereo_signal.addEventListener("click", changeStereoscopy);

        container.appendChild(stereo_signal);
        document.body.appendChild(container);

        if (scope.settings.mode === 'normal') {
            stereo_signal.style.backgroundColor = "#666666";
        } else if (scope.settings.mode === 'stereoscopic') {
            stereo_signal.style.backgroundColor = "#55FC18";
        }
    }

    /* Inicialización del jugador en la escena de realidad aumentada */
    function initPlayer (onPlayerInit) {

        // Creación de la cámara que representa la visión del jugador
        MAX_VISION = scope.settings.range;
        ar_camera = new THREE.PerspectiveCamera(GAME_FOV, window.innerWidth / window.innerHeight, MIN_VISION, MAX_VISION + AUX_VISION);

        // Creación del controlador de posición y orientación del jugador
        ar_controls = new ARProgrezz.PositionControls(ar_camera);
        ar_controls.onInit = onPlayerInit;
        ar_controls.activate();
    }

    /* Incialización y creación del renderizador en función del modo */
    function initRenderer () {

        var options = {alpha: true};

        if (ARProgrezz.Support.webglAvailable()) { // WebGL soportado -> Renderizador WebGL
            ar_renderer = new THREE.WebGLRenderer(options);
        } else { // WebGL no soportado -> Renderizador Canvas
            ar_renderer = new THREE.CanvasRenderer(options);
        }

        ar_renderer.setClearColor(0x000000, 0);
        ar_renderer.setPixelRatio(window.devicePixelRatio);
        ar_renderer.autoClear = false;
        document.body.appendChild(ar_renderer.domElement);

        ar_stereo = new THREE.StereoEffect(ar_renderer);
        ar_stereo.eyeSeparation = STEREO_EYE_SEPARATION;

        // Selección del modo
        if (scope.settings.mode === 'normal') { // Modo normal
            return ar_renderer;
        } else if (scope.settings.mode === 'stereoscopic') {// Modo estereoscópico
            return ar_stereo;
        } else {
            alert("Error: No se reconoce el modo seleccionado (" + scope.settings.mode + ")");
            scope.settings.mode = 'normal';
            return ar_renderer;
        }
    }

    /* Inicialización de la escena de realidad aumentada */
    function initAR (onSuccess) {

        var ar_inited = {flag: ARProgrezz.Utils.Flags.WAIT};

        // Creación de la escena
        ar_scene = new THREE.Scene();

        // Creación del renderizador
        real_renderer = initRenderer();

        // Inicializando al jugador
        initPlayer(function () {
            ar_inited.flag = ARProgrezz.Utils.Flags.SUCCESS;
        });

        ARProgrezz.Utils.waitCallback(ar_inited, function () {
            onSuccess(); // Continuando con la inicialización
        });

    }

    /* Actualización de los objetos */
    function updateObjects () {

        var i, o = Object.keys(objects.children);
        for (i = 0; i < o.length; i += 1) {
            objects.children[o[i]].ARObject.updateAnimation(delta); // Actualizando animación
            objects.children[o[i]].ARObject.updatePosition(); // Actualizando posición
        }
    }

    /* Iniciar actualización de la escena */
    function playAnimation () {

        function render () {

            requestAnimationFrame(render);

            delta = clock.getDelta(); // Obteniendo tiempo entre frames (delta)

            updateObjects(); // Actualizando objetos

            ar_controls.update(); // Actualizando cámara

            if (scope.settings.mode === 'normal') {
                ar_renderer.clear(); // Limpiando escena
            }

            real_renderer.render(ar_scene, ar_camera); // Renderizado
        }

        render();
    }

    /* Ajustar la posición y tamaño del visor */
    function adjustViewer () {

        setTimeout(function () {

            // Tamaño del vídeo
            ar_video.updateSize();
            real_height = ar_video.arVideo.height;

            // Calculando tamaño real del visor de acuerdo al vídeo
            var viewer_ratio = Math.min(ar_video.arVideo.width / ar_video.arVideo.videoWidth, ar_video.arVideo.height / ar_video.arVideo.videoHeight);
            scope.viewerWidth = ((scope.settings.mode === 'normal' || !ARProgrezz.Support.video)
                ? viewer_ratio * ar_video.arVideo.videoWidth
                : window.innerWidth);
            scope.viewerHeight = viewer_ratio * ar_video.arVideo.videoHeight;

            // Calculando relación de aspecto
            ar_camera.aspect = scope.viewerWidth / scope.viewerHeight;
            ar_camera.updateProjectionMatrix();

            // Tamaño y posición de la escena
            ar_renderer.domElement.setAttribute("style", "display: block; margin: auto; padding-top: " + Math.trunc((real_height - scope.viewerHeight) / 2.0) + "px;");
            ar_renderer.setPixelRatio(window.devicePixelRatio);
            real_renderer.setSize(scope.viewerWidth, scope.viewerHeight);

        }, ORIENTATION_DELAY);
    }

    /* Inicializar gestión y eventos de objetos */
    function initObjects () {

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

    /* Pulsación del visor - MouseDown */
    function onMouseDown (event) {

        detectIntersectedObjects(event.clientX, event.clientY);
        if (selectedObject) {
            selectedObject.select();
        }
    }

    /* Pulsación del visor - TouchDown */
    function onTouchStart (event) {

        detectIntersectedObjects(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
        if (selectedObject) {
            selectedObject.select();
        }
    }

    /* Pulsación del visor - MouseUp/TouchEnd */
    function onTargetEnd () {

        if (!selectedObject) {
            return;
        }

        selectedObject.unselect();
        selectedObject = null;
    }

    /* Detección de objetos interceptados */
    function detectIntersectedObjects (posX, posY) {

        // Coordenadas en pantalla
        if (scope.settings.mode === 'normal') { // Posición convertida en intervalo [-1, 1]
            targetVector.x = 2 * (posX / scope.viewerWidth) - 1;
            targetVector.y = 1 - 2 * (posY / scope.viewerHeight);
        } else if (scope.settings.mode === 'stereoscopic') { // En modo estereoscópico se lanza hacia el centro
            targetVector.x = 0;
            targetVector.y = 0;
        }

        // Establecimiento de la cámara y el vector de lanzamiento
        raycaster.setFromCamera(targetVector, ar_camera);

        // Interceptar objetos
        var intersects = raycaster.intersectObjects(objects.children);

        if (intersects.length > 0) {
            selectedObject = intersects[0].object.ARObject;
        }
    }

    /* Activación/desactivación del vídeo */
    function changeVideo () {

        ar_video.removeVideo(); // Eliminando vídeo
        ARProgrezz.Support.video = !ARProgrezz.Support.video; // Cambiando estado
        ar_video = new ARProgrezz.Video(); // Creando vídeo

        // Función tras inicio del vídeo
        ar_video.onSuccess = function () {
            signals.changeSignalType('video'); // Cambiando el color de la señal
            adjustViewer(); // Ajustar dimensiones del visor
        };

        ar_video.initVideo(ar_scene, scope.settings.range, (scope.settings.mode === 'stereoscopic')); // Iniciando vídeo
    }

    /* Activación/desactivación del giroscopio */
    function changeGyroscope () {

        ar_controls.disarmGyroscope(); // Desactivando giroscopio

        ARProgrezz.Support.gyroscope = !ARProgrezz.Support.gyroscope; // Cambiando estado

        signals.changeSignalType('gyroscope'); // Cambiando el color de la señal
        ar_controls.activateGyroscope(); // Activando giroscopio para el nuevo estado
    }

    /* Inicializar visor de realidad aumentada */
    this.initViewer = function (settings) {

        // Estableciendo pantalla completa
        document.addEventListener('click', ARProgrezz.Utils.fullScreen, false);

        // Bloqueando orientación apaisada
        ARProgrezz.Utils.lockOrientation();

        // Iniciando preloader
        var preloader = new ARProgrezz.Preloader();
        preloader.initLoad();

        // Actualizando ajustes
        if (settings) {
            updateSettings(settings);
        }

        // Comprobando soporte de tecnologías
        var checked = {flag: ARProgrezz.Utils.Flags.WAIT};
        ARProgrezz.Support.check(function () {

            checked.flag = ARProgrezz.Utils.Flags.SUCCESS;
        });

        // Esperando a que se chequeen las tecnologías disponibles, para la inicialización
        ARProgrezz.Utils.waitCallback(checked, function () {

            if (scope.settings.signals) {
                ARProgrezz.Support.onChangeVideo = changeVideo; // Función de activación/desactivación del vídeo
                ARProgrezz.Support.onChangeGyroscope = changeGyroscope; // Función de activación/desactivación del giroscopio
                signals = new ARProgrezz.Support.Signals(); // Avisos
            }

            // Inicializar realidad aumentada
            initAR(function () {

                // Creación del vídeo
                ar_video = new ARProgrezz.Video();

                // Ejecución tras inicializar vídeo
                ar_video.onSuccess = function () {

                    // Creación del botón indicador de visión estereoscópica
                    if (scope.settings.signals) {
                        initStereoButton();
                    }

                    // Evento de ajuste de dimensiones y posición del visor
                    adjustViewer();
                    window.addEventListener('orientationchange', adjustViewer, false);
                    window.addEventListener('resize', adjustViewer, false);

                    // Iniciando gestión de objetos
                    initObjects();

                    // Iniciar actualizado de la escena
                    playAnimation();

                    // Haciendo efectiva la inicialización
                    scope.inited = true;

                    // Función a ejecutar tras la inicialización
                    if (scope.onInit) {
                        scope.onInit();
                    }

                    // Eliminando preloader
                    preloader.endLoad();
                };

                // Inicializar vídeo
                ar_video.initVideo(ar_scene, scope.settings.range, (scope.settings.mode === 'stereoscopic'));
            });
        });
    };

    /* Añadir objeto geolocalizado a la escena del visor */
    this.addObject = function (options) {

        var object;

        // Creación del objeto dependiendo del tipo
        switch (options.type) {
        case 'basic':
            object = new ARProgrezz.Object.Basic(options.coords, options.collectable, options.onSelect, ar_controls, ar_renderer.getMaxAnisotropy(), scope.settings.range);
            break;
        default:
            console.log("Error: Tipo de objeto '" + options.type + "' desconocido");
            return;
        }

        objects.add(object.threeObject);
    };

};