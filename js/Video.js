
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
    var AUX_RADIUS = 50; // (m) Radio auxiliar para garantizar la visión de todos los objetos cercanos

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

        var geometry = new THREE.SphereGeometry(p_radius + AUX_RADIUS, WIDTH_SEGMENTS, HEIGHT_SEGMENTS);
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