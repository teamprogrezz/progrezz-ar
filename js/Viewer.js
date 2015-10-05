
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
            alert(real_height + " " + posY + " " + scope.viewerHeight);
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

        ar_video.initVideo(ar_scene, scope.settings.range + AUX_VISION, (scope.settings.mode === 'stereoscopic')); // Iniciando vídeo
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