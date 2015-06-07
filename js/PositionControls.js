
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