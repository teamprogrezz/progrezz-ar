#Progrezz AR Module
Módulo de realidad aumentada de Progrezz.

##Descripción
El presente trabajo consiste en un visor de realidad aumentada geolocalizada. La finalidad básica es monitorizar la geolocalización real del dispositivo, de tal manera que se puedan visualizar y capturar/seleccionar en el visor objetos también geolocalizados que se hayan añadido previamente.
Dicho módulo precisa el acceso a distintas tecnologías:
- **Geolocalización**: Monitorización de la posición del dispositivo para la visualización de los objetos geolocalizados.

> **Nota**: Si no se accede a la geolocalización, no se podrá hacer uso del módulo.

- **Giroscopico**: Se utiliza para la orientación de la escena y visualización de los objetos en función de la posición del dispositivo móvil.

> **Nota**: Si no se accede al giroscopio, se sustituirá por eventos de toque/ratón.

- **Cámara de vídeo**: Visualización constante del vídeo de la cámara trasera.

> **Nota**: Si no se accede al vídeo (o al giroscopio) se visualizará el panorama de una ciudad como alternativa.

Se cuenta con botones en la esquina inferior izquierda del visor, que indican la disponibilidad de cada una de estas tecnologías, permitiendo su activación/desactivación (siempre que sea posible).

Por último, el visor cuenta con la posibilidad de establecerse en modo visión estereoscópica (con un botón en la esquina inferior derecha para su activación/desactivación), de tal manera que se muestra la pantalla dividida, para gafas de realidad virtual basadas en dispositivos móviles.
> ***Nota:*** Se recomienda emplear el modo estereoscópico con la cámara de vídeo desactivada, ya que al carecer los dispositivos móviles de dos cámaras traseras, la visión estereoscópica solo se puede simular en la escena 3D de realidad aumentada.

##Recursos
- **Gráficos** - [***three.js***](http://threejs.org/) - *Licencia MIT*: Librería de gráficos 3D para javascript.
  - ***lib/three.min.js***: Núcleo de la librería.
  - ***lib/renderers/Projector.js***: Librería auxiliar para el renderizado.
  - ***lib/renderers/CanvasRenderer.js***: Renderizador en Canvas para cuando no se soporte WebGL.
  - ***lib/effects/StereoEffect.js***: Librería para renderizado en modo estereoscópico.

> **Importante:** Es necesario incluir todas las dependencias de 'three.js' a la hora de utilizar el módulo, para garantizar su correcto funcionamiento.

- **Imágenes**:
  - ***Iconos*** - [**ionicons**](http://ionicons.com/) - *Licencia MIT*: Plataforma de iconos gratuitos, de la que se han obtenido todos los iconos del visor, ubicados en 'img/icons'.
  - ***Preloader*** - [**Chimply**](http://www.chimply.com/Generator): Página web con generador de imágenes de carga personalizables, utilizada para generar 'preloader.gif'.

##Instalación
Para el empleo del visor de realidad aumentada en un proyecto existen dos opciones:
- Copiar las carpetas 'js', 'img' y 'lib' y su contenido en el lugar deseado.

> **Importante:** Es necesario que la carpeta 'img' y 'js' se encuentren en el mismo directorio para el acceso correcto a los recursos del visor.

- Añadir el proyecto como submódulo de git, de la siguiente manera:
```
$ git submodule add https://github.com/teamprogrezz/progrezz-ar my-subdirectory/progrezz-ar
```
  Para inicializarlo:
```
$ git submodule init
```
  Y para mantenerlo actualizado, ejecutar:
```
$ git submodule update --remote --merge
```
> **Info**: Documentación acerca de los ['submódulos'](http://git-scm.com/docs/git-submodule) de git.

Por último, bastaría con incluir el script 'js/ARProgrezz.min.js' (además de las dependencias anteriores) en el documento HMTL en el que se quiera ubicar el módulo.

##Utilización
El juego emplea el espacio de nombres 'ARProgrezz', siendo necesario para iniciar el visor, crear un objeto de tipo 'ARProgrezz.Viewer'.
Es necesario llamar a la función 'initViewer()' para la inicialización de todos los componentes, indicando una serie de opciones:
- ***mode*** [string] - Default ['normal']: Modo de inicio del visor. A elegir entre modo 'normal', o 'stereoscopic' (visión estereoscópica con pantalla dividida para gafas de realidad virtual).
- ***range*** [integer] - Default [50]: Rango de detección del visor. Sólo se visualizaran aquellos objetos a una distancia del dispositivo igual o inferior al rango indicado; además, el tamaño de los objetos se distribuirá dependerá de forma lineal de la distancia con el dispositivo y el rango de visión.
- ***signals*** [boolean] - Default [true]: Indicador de si mostrar las señales de estado de las tecnologías disponibles y el modo estereosócico (con posibilidad de activación/desactivación).

Dado que la inicialización se realiza de forma asíncrona, se proporciona el parámetro 'onInit' del visor, que consiste en una función a indicar por el usuario, que será ejecutada al termino de la inicialización satisfactoria del visor.

Para la creación y adición de los objetos se emplea la función 'addObject(options)' del visor, siendo las posibles opciones:
- ***coords*** [object] - Requerido: Coordenadas geográficas del objeto.
  - ***latitude*** [float]: Latitud del objeto.
  - ***longitude*** [float]: Longitud del objeto.
- ***type*** [string] - Default ['basic']: Tipo de objeto creado.
  - ***'basic'***: Objeto básico, representado por un tetraedro con rotación constante y textura con degradado.
- ***onSelect*** [function] - Default [alert]: Función que se ejecutará en caso de que el objeto sea seleccionado (mediante evento de pulsación en pantalla).
- ***collectable*** [boolean] - Default [true]: Indicador de si el objeto es recolectable (sólo se pude seleccionar una vez, desapareciendo tras la selección), o puede ser seleccionado todas las veces que se desee.

> **Nota:** Tanto las opciones de inicialización del visor, como de creación de los objetos, se pasan empleando un objeto como parámetro, correspondiendo las opciones con los atributos de mismo nombre de dicho objeto.

## Código de ejemplo
```html
<!DOCTYPE html>
<html>
<head>
  <title>AR Progrezz</title>
  <script type="text/javascript" src="lib/three.js/three.min.js"></script>
  <script type="text/javascript" src="lib/three.js/effects/StereoEffect.js"></script>
  <script type="text/javascript" src="lib/three.js/renderers/CanvasRenderer.js"></script>
  <script type="text/javascript" src="lib/three.js/renderers/Projector.js"></script>
  <script type="text/javascript" src="js/ARProgrezz.min.js"></script>
</head>
<body style="margin:0px; padding:0px;">
  <script>
  
    var ARViewer = new ARProgrezz.Viewer();
    
    ARViewer.onInit = function() {
      
      var options = {
        coords: { latitude: 28.482124, longitude: -16.325994 },
        type: 'basic',
        onSelect: function() { setTimeout(function() { window.location.assign("http://www.w3schools.com"); }, 1000); },
        collectable: true
      }
      ARViewer.addObject(options);
    };
    
    ARViewer.initViewer({ mode: 'normal', range: 100 });
    
  </script>
</body>
</html>
```
> **Nota:** El script incluido en "index.html" presenta un ejemplo simple funcional del empleo del módulo.

##Autor
- Cristo "Shylpx" González Rodríguez - cristogr.93@gmail.com

##Version
- 1.0.0

##Licencia
The MIT License (MIT)

Copyright (c) 2014 teamprogrezz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
