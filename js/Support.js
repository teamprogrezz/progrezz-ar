
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
                        videoSource = sourceInfos[s[i]].id;
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