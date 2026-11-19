/* =====================================================================
   Asistente TECNO LAB (chat de preguntas)
   Funciona sin internet: responde con los contenidos del laboratorio
   (partes, temas y glosario). Entiende errores de escritura y propone
   “¿Quisiste decir…?”. No es un servicio de inteligencia artificial en
   línea: busca en la información que trae la propia aplicación.
   ===================================================================== */
/* Glosario: [término, alias separados por |, explicación sencilla, explicación detallada (3.°+), grado, tema] */
const GLOSSARY = [
  ['Tecnología', 'tecnologia|la tecnologia', 'Es todo lo que las personas crean para resolver problemas y hacer la vida más fácil, como el lápiz, la bicicleta o el computador.', null, 1, '1a'],
  ['Artefacto', 'artefacto|artefactos|objeto tecnologico', 'Es un objeto creado por las personas para resolver una necesidad, como una silla, una cuchara o un computador.', null, 1, '1a'],
  ['Computador', 'computador|computadora|ordenador|pc|computadores', 'Es una máquina que recibe información, la procesa, la guarda y nos muestra resultados. Sus partes principales son el monitor, la torre, el teclado y el mouse.', 'Es un sistema electrónico que recibe datos (entrada), los procesa con el procesador, los guarda (almacenamiento) y entrega resultados (salida).', 1, '1b'],
  ['Partes del computador', 'partes del computador|partes de la computadora|partes del pc|partes', null, null, 1, '1b', 'parts'],
  ['Partes internas', 'partes internas|por dentro del computador|dentro de la torre|componentes internos|partes de adentro', null, null, 3, '3b', 'interno'],
  ['Hardware', 'hardware|jarguer|hardwer', 'Son las partes del computador que se pueden ver y tocar: el teclado, el monitor, el mouse, el procesador y los cables.', null, 3, '3a'],
  ['Software', 'software|sofware|softwer', 'Son los programas e instrucciones que le dicen al computador qué hacer. No se pueden tocar: por ejemplo un juego, un navegador o el sistema operativo.', null, 3, '3a'],
  ['Sistema operativo', 'sistema operativo|windows|linux|android|macos|ios|so', 'Es el programa principal que se carga al encender el computador y lo administra todo. Ejemplos: Windows, macOS, Linux, Android e iOS.', null, 4, '4b'],
  ['Programa o aplicación', 'programa|programas|aplicacion|aplicaciones|app|apps', 'Es un software que sirve para una tarea: un juego, un navegador, un programa de dibujo o un procesador de texto.', null, 4, '4b'],
  ['Periférico', 'periferico|perifericos', 'Es un dispositivo que se conecta a la unidad central para enviar o recibir información, como el teclado, el mouse o la impresora.', null, 4, '4a'],
  ['Dispositivos de entrada', 'dispositivo de entrada|dispositivos de entrada|perifericos de entrada|entrada', 'Envían información AL computador.', null, 2, '2a', 'entrada'],
  ['Dispositivos de salida', 'dispositivo de salida|dispositivos de salida|perifericos de salida|salida', 'Muestran o entregan la información que sale DEL computador.', null, 2, '2a', 'salida'],
  ['Dispositivos de entrada y salida', 'dispositivos de entrada y salida|dispositivo mixto|dispositivos mixtos|perifericos mixtos|mixtos|entrada y salida', 'Envían y reciben información, como la pantalla táctil, la impresora multifuncional, el router y la memoria USB.', null, 4, '4a', 'mixto'],
  ['Almacenamiento', 'almacenamiento|dispositivos de almacenamiento|guardar informacion', 'Son las partes que guardan la información: el disco duro, la SSD, la memoria USB y la nube.', null, 3, '3c', 'almacenamiento'],
  ['Entrada, proceso y salida', 'entrada proceso salida|entrada proceso y salida|ciclo de la informacion|computador como sistema|sistema', 'El computador funciona como un sistema: recibe datos (entrada), los procesa (proceso), los guarda (almacenamiento) y muestra resultados (salida).', null, 5, '5a'],
  ['Puerto USB', 'puerto usb|puertos usb|cable usb|conector usb', 'Es un conector rectangular donde se conectan teclados, mouse, memorias e impresoras. USB significa Bus Universal en Serie.', null, 2, '5b'],
  ['Puertos', 'puerto|puertos|conectores', 'Son las entradas del computador donde se conectan los cables: USB, HDMI, red (Ethernet) y audio.', null, 4, '5b'],
  ['HDMI', 'hdmi|cable hdmi|puerto hdmi', 'Es el cable y el puerto que lleva la imagen y el sonido del computador al monitor, al televisor o al proyector.', null, 4, '4a'],
  ['Cable de red (Ethernet)', 'ethernet|cable de red|rj45|rj 45|puerto de red', 'Es el cable que conecta el computador con el router para tener internet sin wifi.', null, 5, '5b'],
  ['Bluetooth', 'bluetooth|blutu|blututh', 'Es una conexión sin cables de corto alcance, por ejemplo para audífonos, parlantes o controles.', null, 4, '4a'],
  ['Wifi', 'wifi|wi fi|guifi|internet inalambrico', 'Es la conexión a internet sin cables que reparte el router.', null, 4, '4d'],
  ['Internet', 'internet|la red de redes', 'Es la red más grande del mundo: une millones de redes de computadores para compartir información.', null, 4, '4d'],
  ['Red', 'red|redes|red de computadores', 'Es un grupo de dispositivos conectados que comparten información.', null, 4, '4d'],
  ['Navegador', 'navegador|navegadores|chrome|firefox|edge|safari|explorador', 'Es el programa para visitar páginas web, como Chrome, Firefox o Edge.', null, 4, '4d'],
  ['Página web', 'pagina web|paginas web|sitio web|web', 'Es un documento de internet con textos, imágenes y videos que vemos en el navegador.', null, 4, '4d'],
  ['Contraseña', 'contrasena|contrasenas|clave|password', 'Es una palabra secreta que protege tus cuentas. Una contraseña segura es larga, mezcla letras, números y símbolos, y no se comparte con nadie.', null, 4, '4d'],
  ['Ciberacoso', 'ciberacoso|ciberbullying|bullying|acoso en internet', 'Son burlas o amenazas repetidas por medios digitales. Si lo ves, no participes, no lo compartas y cuéntale a un adulto de confianza.', null, 5, '5e'],
  ['Huella digital', 'huella digital|rastro digital', 'Es el rastro que dejamos con todo lo que hacemos y publicamos en internet. Puede durar mucho tiempo, por eso pensamos antes de publicar.', null, 5, '5e'],
  ['Ciudadanía digital', 'ciudadania digital', 'Es usar la tecnología con respeto, seguridad y responsabilidad: cuidar nuestros datos, respetar a los demás y verificar la información.', null, 5, '5e'],
  ['La nube', 'nube|la nube|almacenamiento en la nube|drive', 'Es guardar archivos en computadores de otras empresas a los que llegamos por internet.', null, 3, '3c'],
  ['Archivo', 'archivo|archivos', 'Es un trabajo guardado: un texto, un dibujo, una canción o un video.', null, 3, '3c'],
  ['Carpeta', 'carpeta|carpetas', 'Sirve para organizar los archivos, como los cajones de un escritorio.', null, 3, '3c'],
  ['Extensión de archivo', 'extension|extensiones|extension de archivo|docx|jpg|png|mp3|mp4', 'Es el final del nombre de un archivo que dice qué tipo es: .docx es un documento, .jpg o .png una imagen, .mp3 un sonido y .mp4 un video.', null, 4, '4b'],
  ['Copia de seguridad', 'copia de seguridad|backup|respaldo', 'Es una copia extra de tus archivos importantes para no perderlos.', null, 3, '3c'],
  ['Procesador de texto', 'procesador de texto|procesadores de texto|word|google docs|writer', 'Es un programa para escribir documentos y darles formato, como Word, Google Docs o LibreOffice Writer.', null, 3, '3d'],
  ['Programa de dibujo (Paint)', 'paint|programa de dibujo|dibujo digital', 'Es un programa para dibujar en el computador con lápiz, pincel, borrador, balde de relleno y formas.', null, 2, '2c'],
  ['Bit', 'bit|bits', 'Es la unidad más pequeña de información: un 0 o un 1.', null, 4, '4c'],
  ['Byte', 'byte|bytes|bait', 'Es un grupo de 8 bits. Más o menos lo que ocupa una letra.', null, 4, '4c'],
  ['Kilobyte (KB)', 'kilobyte|kilobytes|kb|kilo', 'Un kilobyte (KB) son 1024 bytes.', null, 4, '4c'],
  ['Megabyte (MB)', 'megabyte|megabytes|mb|megas', 'Un megabyte (MB) son 1024 KB. Una foto puede pesar unos pocos MB.', null, 4, '4c'],
  ['Gigabyte (GB)', 'gigabyte|gigabytes|gb|gigas', 'Un gigabyte (GB) son 1024 MB. Con GB medimos memorias USB, la RAM y los discos.', null, 4, '4c'],
  ['Terabyte (TB)', 'terabyte|terabytes|tb|teras', 'Un terabyte (TB) son 1024 GB. Muchos discos duros se miden en TB.', null, 4, '4c'],
  ['Unidades de información', 'unidades de informacion|unidades de medida|medidas de informacion', 'De la más pequeña a la más grande: bit, byte, kilobyte (KB), megabyte (MB), gigabyte (GB) y terabyte (TB). 8 bits son 1 byte y cada unidad siguiente es 1024 veces la anterior.', null, 4, '4c'],
  ['Sistema binario', 'binario|sistema binario|numeros binarios|codigo binario', 'Es la forma de contar del computador: solo usa 0 y 1. Cada posición vale el doble que la anterior (1, 2, 4, 8, 16…). Por ejemplo, 101 es 4 + 1 = 5.', null, 4, '4c'],
  ['Píxel', 'pixel|pixeles|pixels', 'Es un puntito de color diminuto. Millones de píxeles forman la imagen de la pantalla.', null, 3, null],
  ['Resolución', 'resolucion', 'Es la cantidad de píxeles de una pantalla, por ejemplo 1920 × 1080. A más píxeles, más detalle.', null, 4, null],
  ['Gigahercio (GHz)', 'ghz|gigahercio|gigahercios', 'Es la unidad con la que se mide la velocidad del procesador.', null, 5, null],
  ['Núcleos del procesador', 'nucleo|nucleos|nucleos del procesador', 'Son las partes del procesador que trabajan; varios núcleos trabajan al mismo tiempo.', null, 5, null],
  ['BIOS o UEFI', 'bios|uefi', 'Es un pequeño programa de la tarjeta madre que revisa el equipo y lo arranca cuando lo enciendes.', null, 5, '5b'],
  ['Zócalo (socket)', 'socket|zocalo', 'Es el lugar de la tarjeta madre donde se instala el procesador.', null, 5, '5b'],
  ['Chipset', 'chipset', 'Es el chip de la tarjeta madre que coordina la comunicación entre las piezas.', null, 5, '5b'],
  ['Pila de la tarjeta madre', 'pila cmos|cmos|pila de la tarjeta madre|pila de la board', 'Es una pila de botón que guarda la fecha y la hora aunque el computador esté desconectado.', null, 5, '5b'],
  ['Clic', 'clic|click|hacer clic|un clic', 'Es presionar una vez el botón izquierdo del mouse para seleccionar algo.', null, 1, '1d'],
  ['Doble clic', 'doble clic|doble click', 'Es presionar dos veces rápido el botón izquierdo del mouse para abrir algo.', null, 1, '1d'],
  ['Clic derecho', 'clic derecho|click derecho|boton derecho', 'Es presionar el botón derecho del mouse para ver un menú con más opciones.', null, 1, '1d'],
  ['Arrastrar', 'arrastrar|arrastre', 'Es mantener presionado el botón del mouse mientras lo mueves, para llevar algo de un lugar a otro.', null, 1, '1d'],
  ['Barra espaciadora', 'barra espaciadora|espaciadora|tecla espacio', 'Es la tecla más larga del teclado: deja un espacio entre palabras.', null, 2, '2b'],
  ['Tecla Enter', 'enter|intro|tecla enter', 'Sirve para pasar a la siguiente línea o para aceptar.', null, 2, '2b'],
  ['Tecla Shift', 'shift|mayus|tecla mayuscula|mayuscula', 'Sirve para escribir una letra mayúscula o el símbolo de arriba de una tecla.', null, 2, '2b'],
  ['Tecla de retroceso', 'retroceso|backspace|tecla borrar|tecla de borrar', 'Borra lo que está a la izquierda del cursor.', null, 2, '2b'],
  ['Bloq Mayús', 'bloq mayus|bloqueo mayusculas|caps lock|bloq mayusculas', 'Deja todas las letras en mayúscula hasta que la vuelvas a presionar.', null, 2, '2b'],
  ['Fila guía', 'fila guia|fila de inicio|asdf', 'Es la fila donde descansan los dedos: A S D F con la mano izquierda y J K L Ñ con la derecha. La F y la J tienen un relieve.', null, 2, '2b'],
  ['QWERTY', 'qwerty|qwert', 'Es la forma más común de ordenar las letras del teclado; se llama así por las primeras letras de la fila de arriba.', null, 2, '2b'],
  ['Encender el computador', 'encender|prender|como prender|encender el computador|prender el computador|como se enciende', 'Primero enciende el regulador, luego presiona el botón de la torre y, si hace falta, el del monitor. Espera a que aparezca el escritorio.', null, 1, '1c'],
  ['Apagar el computador', 'apagar|como apagar|apagar el computador|como se apaga', 'Cierra los programas, ve al menú Inicio y elige Apagar. Espera a que la pantalla quede negra y al final apaga el regulador.', null, 1, '1c'],
  ['Normas de la sala de informática', 'normas|reglas|normas de la sala|reglas de la sala|sala de informatica', 'Manos limpias, sin comida ni bebidas cerca de los equipos, no halar los cables, sentarse bien y avisar a la profesora si algo falla.', null, 1, '1e'],
  ['Buena postura', 'postura|como sentarme|sentarse bien', 'Espalda derecha y apoyada, pies en el piso y la pantalla a la distancia de un brazo, a la altura de los ojos.', null, 1, '1e'],
  ['Regla 20-20-20', 'regla 20 20 20|20 20 20|descansar los ojos|cuidar los ojos', 'Cada 20 minutos frente a la pantalla, mira algo lejano durante 20 segundos para que tus ojos descansen.', null, 2, '2f'],
  ['Seguridad con los aparatos', 'seguridad|cuidarme|enchufes|seguridad electrica|manos mojadas', 'Usa los aparatos con las manos secas, no metas dedos ni objetos en los enchufes, no hales los cables y avisa a un adulto si algo saca chispas o huele a quemado.', null, 1, '1f'],
  ['Materiales', 'materiales|material|de que estan hechos', 'Son lo que se usa para fabricar los artefactos: madera, metal, plástico, vidrio, papel, tela y caucho.', null, 2, '2e'],
  ['Materiales naturales y transformados', 'material natural|materiales naturales|material transformado|materiales transformados|materiales artificiales', 'Los naturales vienen de la naturaleza (madera, piedra, algodón, lana). Los transformados los fabrican las personas (plástico, vidrio, papel, metales).', null, 2, '2e'],
  ['Reciclar', 'reciclar|reciclaje|reutilizar', 'Es convertir materiales usados en objetos nuevos. Se reciclan el papel, el cartón, el vidrio, el plástico y el aluminio.', null, 2, '2e'],
  ['Herramienta', 'herramienta|herramientas|herramientas manuales', 'Es un objeto que nos ayuda a hacer un trabajo con menos esfuerzo y más precisión, como el martillo, el destornillador o el alicate.', null, 3, '3e'],
  ['Martillo', 'martillo', 'Herramienta para clavar puntillas.', null, 3, '3e'],
  ['Destornillador', 'destornillador|desarmador', 'Herramienta para poner y quitar tornillos.', null, 3, '3e'],
  ['Alicate', 'alicate|alicates|pinza|pinzas', 'Herramienta para sujetar, doblar y cortar alambres.', null, 3, '3e'],
  ['Serrucho', 'serrucho|sierra', 'Herramienta con dientes para cortar madera.', null, 3, '3e'],
  ['Metro', 'metro|cinta metrica|flexometro', 'Herramienta para medir longitudes.', null, 3, '3e'],
  ['Llave', 'llave|llave de tuercas|llave inglesa', 'Herramienta para apretar o aflojar tuercas.', null, 3, '3e'],
  ['Máquinas simples', 'maquina simple|maquinas simples', 'Son mecanismos sencillos que nos ayudan a mover o levantar cosas con menos fuerza: palanca, plano inclinado, polea, rueda y eje, cuña y tornillo.', null, 3, '3f'],
  ['Palanca', 'palanca|palancas', 'Es una barra que gira sobre un punto de apoyo. Ejemplos: el balancín, la carretilla y las tijeras.', null, 3, '3f'],
  ['Polea', 'polea|poleas', 'Es una rueda con una cuerda para levantar cosas con menos fuerza, como en un pozo o en el asta de la bandera.', null, 3, '3f'],
  ['Plano inclinado', 'plano inclinado|rampa|rampas', 'Es una rampa: permite subir objetos con menos fuerza.', null, 3, '3f'],
  ['Rueda y eje', 'rueda y eje|rueda|eje', 'Es una rueda unida a una barra que gira con ella, como en la bicicleta o el carro.', null, 3, '3f'],
  ['Cuña', 'cuna|cuñas|cunas', 'Es una pieza en punta que corta o separa, como el hacha o el cuchillo.', null, 3, '3f'],
  ['Tornillo (máquina simple)', 'tornillo|tornillos', 'Es un plano inclinado enrollado: al girarlo avanza y une piezas.', null, 3, '3f'],
  ['Electricidad', 'electricidad|energia electrica|corriente electrica', 'Es una forma de energía que viaja por los cables y hace funcionar muchos aparatos: la nevera, el televisor y el computador.', 'Es el movimiento de cargas eléctricas por un conductor. Llega a las casas como corriente alterna y las pilas dan corriente continua.', 1, '1f'],
  ['Energía', 'energia|la energia|que es la energia', 'Es la capacidad de producir cambios: mover, calentar, iluminar o hacer sonar algo.', null, 5, '5h'],
  ['Tipos de energía', 'tipos de energia|formas de energia|clases de energia|tipos de energias', 'Mecánica (movimiento), eléctrica, térmica o calórica (calor), lumínica (luz), sonora (sonido), química (alimentos, pilas, combustibles) y nuclear (centro de los átomos).', null, 5, '5h'],
  ['Energía mecánica', 'energia mecanica|energia cinetica|energia potencial', 'Es la energía de los objetos que se mueven (cinética) o que están en lo alto (potencial).', null, 5, '5h'],
  ['Energía térmica', 'energia termica|energia calorica|calor', 'Es la energía del calor, como la del fuego o la de una estufa.', null, 5, '5h'],
  ['Energía lumínica', 'energia luminica|energia luminosa|luz', 'Es la energía de la luz, como la del sol o la de un bombillo.', null, 5, '5h'],
  ['Energía sonora', 'energia sonora|sonido', 'Es la energía del sonido, como la que sale de un parlante o de un tambor.', null, 5, '5h'],
  ['Energía química', 'energia quimica', 'Es la energía guardada en los alimentos, las pilas y los combustibles.', null, 5, '5h'],
  ['Energía nuclear', 'energia nuclear|nuclear', 'Es la energía que está en el centro (núcleo) de los átomos.', null, 5, '5h'],
  ['Transformación de la energía', 'transformacion de la energia|transformacion de energia|se transforma|transformar energia', 'La energía no se crea ni se destruye: se transforma. El bombillo convierte energía eléctrica en luz y calor; el parlante, en sonido; la pila, energía química en eléctrica.', null, 5, '5h'],
  ['Fuentes de energía', 'fuentes de energia|fuente de energia|de donde viene la energia|de donde sale la energia', 'Son de donde obtenemos la energía. Renovables: solar, eólica, hidráulica, biomasa y geotérmica. No renovables: petróleo, carbón y gas natural.', null, 5, '5i'],
  ['Energías renovables', 'energia renovable|energias renovables|renovable|renovables', 'Se renuevan de forma natural y no se agotan: solar, eólica, hidráulica, biomasa y geotérmica.', null, 5, '5i'],
  ['Energías no renovables', 'energia no renovable|energias no renovables|no renovable|no renovables|petroleo|carbon|gas natural', 'Se agotan porque tardan millones de años en formarse: petróleo, carbón y gas natural. Además contaminan más.', null, 5, '5i'],
  ['Energía solar', 'energia solar|solar|panel solar|paneles solares', 'Es la energía del sol; los paneles solares la transforman en electricidad.', null, 5, '5i'],
  ['Energía eólica', 'energia eolica|eolica|aerogenerador|viento', 'Es la energía del viento; los aerogeneradores la convierten en electricidad.', null, 5, '5i'],
  ['Energía hidráulica', 'energia hidraulica|hidraulica|hidroelectrica|represa', 'Es la energía del agua de los ríos. En Colombia la mayor parte de la electricidad viene de centrales hidroeléctricas.', null, 5, '5i'],
  ['Corriente continua', 'corriente continua|cc|dc|corriente directa', 'Es la corriente que viaja siempre en el mismo sentido. La entregan las pilas y las baterías.', null, 5, '5j'],
  ['Corriente alterna', 'corriente alterna|ca|ac', 'Es la corriente que cambia de sentido muchas veces por segundo (60 en Colombia). Es la del tomacorriente de la casa, de unos 120 voltios.', null, 5, '5j'],
  ['Voltaje', 'voltaje|voltios|voltio|tension electrica', 'Es la “fuerza” que empuja la corriente eléctrica; se mide en voltios (V). En Colombia el tomacorriente tiene unos 120 V.', null, 4, '4f'],
  ['Vatio (potencia)', 'vatio|vatios|watt|watts|potencia', 'Es la unidad de potencia: dice cuánta energía usa un aparato cada segundo.', null, 5, '5f'],
  ['Kilovatio hora', 'kilovatio hora|kwh|factura de la luz', 'Es la unidad de energía con la que se cobra la factura de la luz.', null, 5, '5f'],
  ['Ahorro de energía', 'ahorrar energia|ahorro de energia|ahorrar luz', 'Apaga el monitor y el computador cuando no los uses, activa el modo de suspensión, desconecta los cargadores y aprovecha la luz del día.', null, 5, '5f'],
  ['Circuito eléctrico', 'circuito|circuitos|circuito electrico', 'Es un camino cerrado por donde viaja la corriente. Tiene fuente (pila), conductor (cable), receptor (bombillo) e interruptor.', null, 4, '4e'],
  ['Circuito en serie', 'circuito en serie|serie|en serie', 'Los bombillos están en un solo camino: si uno se daña, todos se apagan.', null, 4, '4g'],
  ['Circuito en paralelo', 'circuito en paralelo|paralelo|en paralelo', 'Cada bombillo tiene su propio camino: si uno se daña, los demás siguen encendidos. Así son las instalaciones de las casas.', null, 4, '4g'],
  ['Conductor', 'conductor|conductores|material conductor', 'Es un material que deja pasar la electricidad, como el cobre, el aluminio y el hierro.', null, 4, '4e'],
  ['Aislante', 'aislante|aislantes|material aislante', 'Es un material que detiene la electricidad, como el plástico, el caucho, la madera seca y el vidrio. Por eso los cables están forrados en plástico.', null, 4, '4e'],
  ['Interruptor', 'interruptor|switch', 'Abre o cierra el circuito para apagar o encender un aparato.', null, 4, '4e'],
  ['Pila o batería', 'pila|pilas|bateria|baterias', 'Guarda energía química y la entrega como corriente continua. Las pilas usadas se llevan a puntos de recolección.', null, 2, '5j'],
  ['Tomacorriente', 'tomacorriente|enchufe|toma|toma corriente', 'Es el conector de la pared que da electricidad (corriente alterna de unos 120 V en Colombia).', null, 1, '1f'],
  ['Polo a tierra', 'polo a tierra|tierra|tercer pin', 'Es el tercer pin redondo del enchufe; lleva a tierra las corrientes peligrosas y nos protege.', null, 4, '4f'],
  ['RAEE', 'raee|residuos electronicos|basura electronica|residuos de aparatos', 'Son los residuos de aparatos eléctricos y electrónicos. Se llevan a puntos de recolección o programas de posconsumo para reciclarlos.', null, 5, '5f'],
  ['Algoritmo', 'algoritmo|algoritmos', 'Es una lista de pasos ordenados para resolver un problema, como una receta de cocina.', null, 5, '5d'],
  ['Bucle', 'bucle|bucles|ciclo|repeticion|loop', 'Es repetir instrucciones varias veces.', null, 5, '5d'],
  ['Condicional', 'condicional|condicionales|si entonces', 'Es una instrucción del tipo “si pasa esto, entonces haz aquello”.', null, 5, '5d'],
  ['Depurar', 'depurar|bug|bugs|error de programa', 'Es encontrar y corregir errores en un programa.', null, 5, '5d'],
  ['Programar', 'programar|programacion|codigo|codificar', 'Es escribir instrucciones para que el computador haga algo. Con Scratch se programa uniendo bloques.', null, 5, '5d'],
  ['Scratch', 'scratch|escrach', 'Es un programa para crear juegos y animaciones uniendo bloques de colores, sin escribir código.', null, 5, '5d'],
  ['Pensamiento computacional', 'pensamiento computacional', 'Es resolver problemas como lo haría un programador: dividir el problema, encontrar patrones y crear algoritmos.', null, 5, '5d'],
  ['Inteligencia artificial', 'inteligencia artificial|ia|ai|chatgpt|gemini', 'Son programas que aprenden de muchísimos ejemplos para reconocer patrones o crear contenido. Se pueden equivocar: siempre revisa la información y no compartas datos personales.', null, 5, '5g'],
  ['Realidad aumentada', 'realidad aumentada|ra|ar', 'Es una tecnología que muestra objetos virtuales sobre el mundo real a través de la cámara, como las partes que aparecen sobre el marcador de TECNO LAB.', null, 1, null],
  ['Realidad virtual', 'realidad virtual|rv|vr', 'Es una tecnología que te lleva a un mundo 3D creado por computador, con un visor o en la pantalla.', null, 1, null],
  ['Marcador de RA', 'marcador|el marcador|marcador de realidad aumentada', 'Es la imagen en blanco y negro que la cámara reconoce para hacer aparecer las partes en realidad aumentada. Lo descargas en la sección Realidad aumentada.', null, 1, null],
  ['ENIAC', 'eniac', 'Fue uno de los primeros computadores electrónicos (1946). Usaba tubos de vacío y pesaba unas 27 toneladas.', null, 5, '5c'],
  ['Ada Lovelace', 'ada lovelace|ada|lovelace|primera programadora', 'Es considerada la primera programadora de la historia: en el siglo XIX escribió un programa para la máquina analítica de Charles Babbage.', null, 5, '5c'],
  ['Pascalina', 'pascalina|blaise pascal|pascal', 'Es una calculadora mecánica que inventó Blaise Pascal en 1642.', null, 5, '5c'],
  ['Ábaco', 'abaco', 'Es un instrumento muy antiguo para hacer cuentas moviendo bolitas.', null, 2, '2d'],
  ['Transistor', 'transistor|transistores', 'Es una pieza diminuta que reemplazó a los tubos de vacío; con ella empezó la segunda generación de computadores.', null, 5, '5c'],
  ['Microprocesador', 'microprocesador|microprocesadores', 'Es un procesador en un solo chip (desde 1971); permitió crear los computadores personales.', null, 5, '5c'],
  ['Generaciones de computadores', 'generaciones|generaciones de computadores|historia del computador|historia de los computadores', 'Primera: tubos de vacío. Segunda: transistores. Tercera: circuitos integrados. Cuarta: el microprocesador. Hoy: portátiles, celulares, internet e inteligencia artificial.', null, 5, '5c'],
  ['Evolución de los artefactos', 'evolucion|evolucion de la tecnologia|artefactos de ayer y hoy|antes y ahora', 'Los artefactos cambian para ser más útiles: de la lámpara de aceite al bombillo, de la carta al correo electrónico, del teléfono fijo al celular.', null, 2, '2d'],
  ['Impresora multifuncional', 'multifuncional|impresora multifuncional', 'Es una impresora que también escanea; por eso es de entrada y salida.', null, 4, '4a'],
  ['Computador portátil', 'portatil|laptop|computador portatil|portatiles', 'Es un computador que lleva pantalla, teclado, mouse táctil y batería en una sola pieza.', null, 2, null],
  ['Pantalla', 'pantalla|pantallas', 'Muestra imágenes y textos. Si se toca y responde, es una pantalla táctil.', null, 1, '1b']
];
/* Alias extra para las partes */
const PART_ALIASES = {
  monitor: 'monitor|pantalla del computador|monitores', teclado: 'teclado|teclados|keyboard', mouse: 'mouse|raton|maus|mause|mouses',
  cpu: 'unidad central|torre|cpu|gabinete|case|caja del computador|chasis', parlantes: 'parlantes|parlante|altavoz|altavoces|bafle|bafles|cornetas|bocinas',
  audifonos: 'audifonos|audifono|auriculares|diadema|cascos|headset', microfono: 'microfono|microfonos|mic', camara: 'camara web|webcam|camara',
  impresora: 'impresora|impresoras', escaner: 'escaner|scanner|escaneres', pantalla_tactil: 'pantalla tactil|tablet|tableta|touch',
  usb: 'memoria usb|usb|pendrive|memoria flash|memorias usb', proyector: 'proyector|video beam|videobeam|beam', regulador: 'regulador|regulador de voltaje|estabilizador',
  ups: 'ups|no break|nobreak', router: 'router|enrutador|modem|ruter', control: 'control|control de videojuegos|joystick|gamepad|mando',
  tarjeta_madre: 'tarjeta madre|placa base|placa madre|motherboard|board|mainboard', procesador: 'procesador|microprocesador del computador|cerebro del computador|cpu procesador',
  ram: 'memoria ram|ram|memoria de acceso aleatorio', disco_duro: 'disco duro|hdd|disco', ssd: 'ssd|unidad ssd|disco solido|estado solido|m.2|m2',
  fuente: 'fuente de poder|fuente|fuente de alimentacion', tarjeta_grafica: 'tarjeta de video|tarjeta grafica|gpu|tarjeta de graficos', ventilador: 'ventilador|disipador|cooler|abanico'
};
const STOP = new Set('que es son un una unos unas el la los las lo de del al a y o u para sirve sirven significa significan significado como cual cuales me mi explica explicas explicame dime decir define definicion por favor porfa porfis hola en se hace hacen funciona funcionan quiero saber sobre esto eso este esta su sus mas tiene tienen hay con le les nos te tu ya pero muy bien oye profe asistente necesito ayudame puedes podrias entender aprender cuentame explicame hablame cuentes'.split(' '));
const Chat = {
  open: false, msgs: [], kb: null,
  norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.]+/g, ' ').replace(/\s+/g, ' ').trim(); },
  sing(t) { return t.length > 4 ? t.replace(/(es|s)$/, '') : t; },
  lev(a, b) { // distancia de Damerau-Levenshtein (con transposiciones)
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1; d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  },
  sim(a, b) { if (a === b) return 1; if (a.length <= 2 || b.length <= 2) return 0; const s1 = 1 - this.lev(a, b) / Math.max(a.length, b.length); const s2 = 1 - this.lev(this.sing(a), this.sing(b)) / Math.max(this.sing(a).length, this.sing(b).length, 1); return Math.max(s1, s2) + (a.length === b.length ? .015 : 0); },
  build() {
    if (this.kb) return this.kb;
    const mk = (aliases) => aliases.split('|').map(a => { const n = this.norm(a); return { n, t: n.split(' ').filter(w => !STOP.has(w) && w.length > 0) }; }).filter(a => a.n);
    const kb = PARTS.map(p => ({ kind: 'part', id: p.id, name: p.n, g: p.g, topic: (ALL_TOPICS.find(t => t.parts.includes(p.id)) || {}).id || null, al: mk(PART_ALIASES[p.id] || p.n) }));
    GLOSSARY.forEach(([k, al, d, dx, g, topic, list], i) => kb.push({ kind: 'term', id: 'g' + i, name: k, d, dx, g, topic, list: list || null, al: mk(al + '|' + k) }));
    return (this.kb = kb);
  },
  intent(q) {
    const t = ' ' + q + ' ';
    if (/^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|ola|saludos)\b/.test(q) && q.split(' ').length <= 3) return 'hola';
    if (/\b(gracias|muchas gracias|thank)/.test(q)) return 'gracias';
    if (/\b(quien eres|como te llamas|que eres|eres un robot|eres una ia)\b/.test(q)) return 'quien';
    if (/^(ayuda|help)$|\b(que puedes hacer|como funcionas|que te puedo preguntar|que se te puede preguntar)\b/.test(q)) return 'ayuda';
    if (/\b(chiste|chistes|algo divertido)\b/.test(q)) return 'chiste';
    if (/\b(diferencia|diferencias|diferente|diferentes|comparar|compara|versus|vs)\b/.test(q)) return 'diff';
    if (/ (para que sirve|para que sirven|para que se usa|para que se usan|funcion|funciones|que hace|que hacen|utilidad|uso) /.test(t)) return 'fn';
    if (/ (entrada o salida|salida o entrada|es de entrada|es de salida|que tipo|tipo de dispositivo|es entrada|es salida|es un dispositivo de) /.test(t)) return 'tipo';
    if (/ (donde va|donde esta|donde se conecta|donde queda|donde se ubica|se conecta|como se conecta|conecta|ubica) /.test(t)) return 'donde';
    if (/ (cuido|cuidar|cuidado|cuidados|limpio|limpiar) /.test(t)) return 'cuidado';
    if (/ (dato curioso|curiosidad|sabias que|quien invento|quien creo|quien hizo|cuando se invento|historia de) /.test(t)) return 'curioso';
    if (/ (caracteristica|caracteristicas|como es|como son) /.test(t)) return 'car';
    if (/ (energia|electricidad|corriente|se alimenta|voltaje) /.test(t)) return 'energia';
    if (/ (ejemplo|ejemplos|cuales son|lista|nombra|menciona) /.test(t)) return 'ejemplos';
    return 'que';
  },
  /* Busca las entradas que coinciden con la pregunta (tolerando errores de escritura) */
  match(qn) {
    const kb = this.build(); const toks = qn.split(' ').filter(w => !STOP.has(w) && w.length > 1);
    const res = [];
    for (const e of kb) {
      let best = 0, exact = false;
      for (const a of e.al) {
        if ((' ' + qn + ' ').includes(' ' + a.n + ' ')) { const s = 1.2 + a.n.length / 100; if (s > best) { best = s; exact = true; } continue; }
        if (!a.t.length || !toks.length) continue;
        let tot = 0, w = 0; const used = new Set();
        for (const at of a.t) { let b = 0, bi = -1; toks.forEach((qt, i) => { const s = this.sim(qt, at); if (s > b) { b = s; bi = i; } }); tot += Math.min(1, b) * at.length; w += at.length; if (b >= .66) used.add(bi); }
        const cover = used.size / toks.length; const s = (tot / w) * .82 + cover * .18;
        if (s > best && !exact) best = s;
      }
      if (best >= .58) res.push({ e, s: best, exact });
    }
    return res.sort((a, b) => b.s - a.s);
  },
  /* ---------- respuestas ---------- */
  listFor(kind) {
    const g = Store.grade;
    if (kind === 'parts') return partsForGrade(g).map(p => p.n);
    if (kind === 'interno') return PARTS.filter(p => p.ubic === 'interno').map(p => p.n);
    return PARTS.filter(p => p.tipo === kind && p.g <= Math.max(g, kind === 'mixto' ? 4 : 2)).map(p => p.n);
  },
  gradeNote(e) { const g = Store.grade; return e.g > g ? `<p class="chat-note">${icon('grad')} Esto se estudia en ${e.g}.°. ¡Qué bien que ya lo quieras aprender!</p>` : ''; },
  answerPart(p, intent) {
    const g = Store.grade, art = cap(withArt(p)), es = p.pl ? 'son' : 'es';
    let txt;
    switch (intent) {
      case 'fn': txt = `${art} ${p.pl ? 'sirven' : 'sirve'} para: ${lc(p.fn)}`; break;
      case 'tipo': txt = `${art} ${es} ${p.pl ? 'dispositivos' : 'un dispositivo'} de ${TIPOS[p.tipo].n.toLowerCase()}: ${TIPOS[p.tipo].d.toLowerCase()}`; break;
      case 'donde': txt = `${p.ubic === 'interno' ? `${art} va${p.pl ? 'n' : ''} dentro de la torre (unidad central).` : `${art} ${es} ${p.pl ? 'periféricos externos' : 'un periférico externo'}.`} ${p.con}`; break;
      case 'cuidado': txt = p.cui; break;
      case 'curioso': txt = `Dato curioso: ${p.cur}`; break;
      case 'car': txt = g <= 2 ? `${p.s} ${p.dib ? 'Para reconocerlo fíjate en: ' + p.dib.join(', ').toLowerCase() + '.' : ''}` : 'Características: ' + p.car.join(' '); break;
      case 'energia': txt = g >= 3 ? p.ene : 'Funciona con electricidad. ' + p.cui; break;
      default: txt = g <= 2 ? `${p.s} ${art} ${es} de ${TIPOS[p.tipo].n.toLowerCase()}.` : `${p.que} Su función: ${lc(p.fn)}`;
    }
    return txt;
  },
  answerTerm(e, intent) {
    if (e.list) {
      const items = this.listFor(e.list);
      return `${e.d ? e.d + ' ' : ''}${e.list === 'parts' ? `Las partes que estudias en ${Store.grade}.° son` : 'Por ejemplo'}: ${items.join(', ')}.`;
    }
    return Store.grade >= 3 && e.dx ? e.dx : e.d;
  },
  askAgain(intent, name) {
    const pp = PARTS.find(x => x.n === name); const n = pp ? withArt(pp) : lc(name); const de = ('de ' + n).replace(/^de el /, 'del ');
    if (!pp) return `Cuéntame sobre ${n}`;
    const v = pp.pl ? 'n' : '';
    return ({ fn: `¿Para qué sirve${v} ${n}?`, tipo: `¿${cap(n)} ${pp.pl ? 'son' : 'es'} de entrada o de salida?`, donde: `¿Dónde va${v} ${n}?`, cuidado: `¿Cómo cuido ${n}?`, curioso: `Dato curioso ${de}`, car: `¿Cómo ${pp.pl ? 'son' : 'es'} ${n}?`, energia: `¿Cómo recibe${v} energía ${n}?` }[intent]) || `¿Qué ${pp.pl ? 'son' : 'es'} ${n}?`;
  },
  respond(q) {
    const qn = this.norm(q); if (!qn) return null;
    const intent = this.intent(qn);
    if (intent === 'hola') return { html: `¡Hola! 😊 Soy el asistente de TECNO LAB. Pregúntame lo que quieras recordar de tecnología, por ejemplo: <i>¿Qué es la memoria RAM?</i>`, chips: this.starters() };
    if (intent === 'gracias') return { html: '¡Con mucho gusto! Pregúntame cuando quieras. 🚀' };
    if (intent === 'quien') return { html: 'Soy el asistente de TECNO LAB. Respondo con la información de los temas y las partes del laboratorio, y funciono sin internet. Si escribes con algún error, igual intento entenderte.' };
    if (intent === 'ayuda') return { html: 'Puedes preguntarme <b>qué es</b> algo, <b>para qué sirve</b>, si es <b>de entrada o de salida</b>, <b>dónde va</b>, cómo se <b>cuida</b>, un <b>dato curioso</b> o la <b>diferencia</b> entre dos cosas.', chips: this.starters() };
    if (intent === 'chiste') return { html: pick(['¿Por qué el computador fue al médico? ¡Porque tenía un virus! 🤒💻', '¿Qué le dijo el mouse al teclado? ¡Tú escribes y yo te sigo! 🖱️⌨️', '¿Por qué la memoria USB es tan buena amiga? ¡Porque guarda todos tus secretos… digo, archivos! 💾']) };
    const found = this.match(qn);
    if (intent === 'diff') {
      const two = []; for (const f of found) { if (!two.some(x => x.e.id === f.e.id) && f.s >= .8) two.push(f); if (two.length === 2) break; }
      if (two.length === 2) {
        const parts = two.map(({ e }) => `<p><b>${esc(e.name)}:</b> ${esc(e.kind === 'part' ? this.answerPart(PART[e.id], 'que') : this.answerTerm(e))}</p>`).join('');
        const both = two.every(x => x.e.kind === 'part'); const [a, b] = two.map(x => PART[x.e.id]);
        const extra = both && a.tipo !== b.tipo ? `<p>La gran diferencia: ${esc(a.n)} es de ${TIPOS[a.tipo].n.toLowerCase()} y ${esc(b.n)} es de ${TIPOS[b.tipo].n.toLowerCase()}.</p>` : both && a.id === 'ram' || both && b.id === 'ram' ? '<p>La RAM guarda solo mientras el computador está encendido; el almacenamiento guarda aunque lo apagues.</p>' : '';
        return { html: `Te cuento la diferencia:${parts}${extra}`, actions: two.filter(x => x.e.kind === 'part').map(x => ({ t: '3d', id: x.e.id, n: x.e.name })) };
      }
    }
    if (!found.length) return this.fallback(qn);
    if (['fn', 'tipo', 'donde', 'cuidado', 'curioso', 'car', 'energia'].includes(intent)) { const pi = found.findIndex(f => f.e.kind === 'part' && (f.exact || f.s >= .8)); if (pi > 0) found.unshift(found.splice(pi, 1)[0]); }
    const top = found[0], alts = found.filter(f => f.e.id !== top.e.id && f.s >= Math.max(.62, top.s - .14)).slice(0, 3);
    const confident = top.exact || top.s >= .86;
    if (!confident || (alts.length && alts[0].s >= top.s - .02 && !top.exact)) {
      const cands = [top, ...alts].slice(0, 3);
      return { html: `🤔 ¿Quisiste decir ${cands.map(c => `<b>${esc(lc(c.e.name))}</b>`).join(' o ')}?`, chips: [...new Set(cands.map(c => this.askAgain(intent, c.e.name)))] };
    }
    const e = top.e;
    const body = e.kind === 'part' ? this.answerPart(PART[e.id], intent) : this.answerTerm(e, intent);
    const fix = !top.exact ? `<p class="chat-note">¿Quisiste decir <b>${esc(lc(e.name))}</b>? Te cuento:</p>` : '';
    const more = alts.length ? alts.map(a => this.askAgain('que', a.e.name)) : [];
    const follow = e.kind === 'part' ? ['fn', 'tipo', 'curioso', 'donde'].filter(i => i !== intent).slice(0, 3).map(i => this.askAgain(i, e.name))
      : this.build().filter(x => x.kind === 'term' && x.topic && x.topic === e.topic && x.id !== e.id).slice(0, 3).map(x => this.askAgain('que', x.name));
    const actions = [];
    if (e.kind === 'part') actions.push(Models.has(e.id) ? { t: '3d', id: e.id, n: e.name } : { t: 'ficha', id: e.id, n: e.name }, ...(Models.has(e.id) ? [{ t: 'ar', id: e.id, n: e.name }] : []));
    if (e.topic) actions.push({ t: 'topic', id: e.topic, n: TOPIC[e.topic]?.t });
    if (e.kind === 'part') actions.push({ t: 'quiz', id: e.id });
    return { html: `${fix}<p><b>${esc(e.name)}</b></p><p>${esc(body)}</p>${this.gradeNote(e)}`, speak: `${e.name}. ${body}`, chips: [...new Set([...more, ...follow])].slice(0, 4), actions };
  },
  fallback(qn) {
    const toks = qn.split(' ').filter(w => !STOP.has(w) && w.length > 2); let best = null;
    if (toks.length) for (const t of ALL_TOPICS) {
      for (const [h, p] of [[t.t, t.r], ...t.sec]) {
        const words = this.norm(h + ' ' + p).split(' '); let hits = 0;
        toks.forEach(qt => { if (words.some(w => w.length > 2 && this.sim(qt, w) >= .84)) hits++; });
        const sc = hits / toks.length; if (sc > 0 && (!best || sc > best.sc)) best = { sc, t, h, p };
      }
    }
    if (best && best.sc >= .5) return { html: `Encontré algo en el tema <b>${esc(best.t.t)}</b> (${best.t.g}.°):<p>${esc(best.p)}</p>`, speak: best.p, actions: [{ t: 'topic', id: best.t.id, n: best.t.t }] };
    return { html: '¡Buena pregunta! 🌟 Esa todavía la estoy aprendiendo. Prueba con otras palabras o pregúntame por alguno de estos temas:', chips: this.starters() };
  },
  starters() {
    const g = Store.grade; const ps = shuffle(partsForGrade(g)).slice(0, 2).map(p => this.askAgain(pick(['que', 'fn', g >= 2 ? 'tipo' : 'que']), p.n));
    const ts = shuffle(this.build().filter(e => e.kind === 'term' && e.g === g && !e.list)).slice(0, 2).map(e => this.askAgain('que', e.name));
    return [...new Set([...ps, ...ts])];
  },
  /* ---------- interfaz ---------- */
  init() {
    const fab = document.createElement('button'); fab.type = 'button'; fab.className = 'chat-fab'; fab.id = 'chatFab'; fab.setAttribute('aria-label', 'Abrir el asistente de preguntas'); fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = `${icon('bot')}<span>Pregúntame</span>`; document.body.appendChild(fab);
    const pn = document.createElement('section'); pn.className = 'chat-panel'; pn.id = 'chatPanel'; pn.hidden = true; pn.setAttribute('role', 'dialog'); pn.setAttribute('aria-label', 'Asistente TECNO LAB');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    pn.innerHTML = `<header class="chat-head"><span class="chat-av">${icon('bot')}</span><div class="grow"><strong>Asistente TECNO LAB</strong><small>Responde con los temas del laboratorio · funciona sin internet</small></div><button class="icon-btn" id="chatClose" aria-label="Cerrar el asistente">${icon('x')}</button></header>
      <div class="chat-log" id="chatLog" aria-live="polite"></div>
      <form class="chat-form" id="chatForm" autocomplete="off"><input class="input" id="chatIn" maxlength="200" placeholder="Escribe tu pregunta… ej.: ¿qué es la RAM?" aria-label="Escribe tu pregunta">${SR ? `<button type="button" class="icon-btn" id="chatMic" aria-label="Dictar la pregunta con la voz" title="Dictar con la voz (en Chrome necesita internet)">${icon('mic')}</button>` : ''}<button class="icon-btn chat-send" type="submit" aria-label="Enviar">${icon('send')}</button></form>`;
    document.body.appendChild(pn);
    fab.onclick = () => this.toggle(true); $('#chatClose').onclick = () => this.toggle(false);
    $('#chatForm').onsubmit = e => { e.preventDefault(); const v = $('#chatIn').value.trim(); if (v) { $('#chatIn').value = ''; this.ask(v); } };
    pn.addEventListener('keydown', e => { if (e.key === 'Escape') this.toggle(false); });
    if (SR) $('#chatMic').onclick = () => {
      try { const r = new SR(); r.lang = 'es-CO'; r.interimResults = false; r.maxAlternatives = 1; const b = $('#chatMic'); b.setAttribute('aria-pressed', 'true');
        r.onresult = ev => { const t = ev.results[0][0].transcript; this.ask(t); }; r.onerror = () => toast('El dictado por voz necesita permiso del micrófono y, en Chrome, internet. Puedes escribir la pregunta.', 'info', 4200);
        r.onend = () => b.setAttribute('aria-pressed', 'false'); r.start(); } catch { toast('El dictado por voz no está disponible aquí. Escribe tu pregunta.', 'info'); }
    };
  },
  toggle(on) {
    this.open = on; $('#chatPanel').hidden = !on; $('#chatFab').setAttribute('aria-expanded', on); $('#chatFab').classList.toggle('hide', on);
    if (on) { if (!this.msgs.length) this.bot({ html: `¡Hola! 👋 Soy el asistente de TECNO LAB. ¿Se te olvidó algo? Pregúntame qué es, para qué sirve o si es de entrada o de salida. Aunque escribas con errores, intento entenderte.`, chips: this.starters() }); setTimeout(() => $('#chatIn').focus(), 50); }
    else { Voice.stop(); $('#chatFab').focus(); }
  },
  add(who, node) { const log = $('#chatLog'); node.classList.add('chat-msg', who); log.appendChild(node); log.scrollTop = log.scrollHeight; this.msgs.push(who); },
  ask(q) {
    const m = document.createElement('div'); m.textContent = q; this.add('me', m);
    const typing = document.createElement('div'); typing.innerHTML = '<span class="chat-typing"><i></i><i></i><i></i></span>'; this.add('bot', typing);
    setTimeout(() => { typing.remove(); this.msgs.pop(); this.bot(this.respond(q) || { html: 'Escribe una pregunta 🙂' }); }, 420 + Math.random() * 300);
  },
  bot(r) {
    const m = document.createElement('div'); m.innerHTML = `<div class="chat-text">${r.html}</div>`;
    const acts = document.createElement('div'); acts.className = 'chat-acts';
    if (r.speak) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm'; b.innerHTML = icon('volume') + '<span>Escuchar</span>'; b.onclick = () => Voice.toggle(r.speak); acts.appendChild(b); }
    (r.actions || []).forEach(a => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm';
      if (a.t === '3d') { b.innerHTML = icon('cube') + '<span>' + (Models.has(a.id) ? 'Ver en 3D' : 'Ver ficha') + '</span>'; b.onclick = () => { this.mobileClose(); Router.go('explore/' + a.id); }; }
      if (a.t === 'ficha') { b.innerHTML = icon('book') + '<span>Ver ficha</span>'; b.onclick = () => { this.mobileClose(); Router.go('explore/' + a.id); }; }
      if (a.t === 'ar') { b.innerHTML = icon('scan') + '<span>Ver en RA</span>'; b.onclick = () => { this.toggle(false); ARRun.start(a.id, Models.viewableAll(), { id: 'free' }); }; }
      if (a.t === 'topic') { b.innerHTML = icon('book') + `<span>Abrir el tema</span>`; b.title = a.n || ''; b.onclick = () => { this.mobileClose(); Router.go('study/learn/' + a.id); }; }
      if (a.t === 'quiz') { b.innerHTML = icon('quiz') + '<span>Ponte a prueba</span>'; b.onclick = () => { this.mobileClose(); Router.go('study/quiz?part=' + a.id); }; }
      acts.appendChild(b);
    });
    if (acts.children.length) m.appendChild(acts);
    if (r.chips && r.chips.length) { const c = document.createElement('div'); c.className = 'chat-chips'; r.chips.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chat-chip'; b.textContent = t; b.onclick = () => this.ask(t); c.appendChild(b); }); m.appendChild(c); }
    this.add('bot', m);
  },
  mobileClose() { if (ENV.mobile) this.toggle(false); }
};
