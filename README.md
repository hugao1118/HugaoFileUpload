# HugaoFileUpload -- GeneXus User Control

Este User Control le permitirá subir archivos a su servidor desde su aplicación sin utilizar Flash Player, está pensado para utilizarlo desde GeneXus Evolution 1 hasta GeneXus Evolution 3.

A partir de GeneXus 15, GeneXus implementó un User Control propio llamado FileUpload y es recomednable que lo utilice, está basado en HTML5 y tiene algunas cosas de GUI que aún no tienen este control, sin embargo con la ayuda con la comunidad puede que aumente la funcionalidad de este control.

## Comenzando 🚀

_Este proyecto nació de la necesidad de no utilizar **Flash Player** como tecnología en las aplicaciones web, debido a su obsolecencia tecnologíca y ante la noticia de que los navegadores (al menos los más comerciales) dejarían de soportarlo, adicional a esto, no encontramos User Control en la marketplace que supla esta necesidad para esta versión.
Por lo tanto emprendimos la tarea de crear un **User Control** compatible con **GeneXus Evolution 1** (Era nuestro problema, pues en las KBs hechas en GX15 o superior ya contabamos con el UC propio de GeneXus **FileUpload**_

_Lo bueno de este control, es que si bien lo hicimos pensando en **GeneXus Evolution 1** se puede usar facilmente en GeneXus Evolution 2 y 3._

## Pre-requisitos 📋

_¿Qué se necesita para modificar y agregar funcionalidades?_

**Conocimientos Técnicos**

```
* HTML
* Javascript (Medio)
* CSS
* Ajax
* POO
* GxGral (Core Javascript de GeneXus)
```

**Herramientas**

```
* ATOM
* Git
```

## Instalación 🔧

_¿Cómo se instala en GeneXus para usarlo en la KB?_


* Descargar la carpeta con los archivos
* Copiar la carpeta descargada a la ruta **<Ruta_Instalacion_GeneXus>\UserControls**
* Desde una consola de cmd ejecutar **<Ruta_Instalacion_GeneXus>\GeneXus.exe /install**

## Uso 💻

Abrir GeneXus y ya al tener un WebPanel abierto en la paleta de **Toolbox** bajo el grupo **Hugao Controls** encontrará el User Control, arrastrarlo al webform, se importará automáticamente los recursos del User Control que quedarán bajo el Root Module o Folder raíz Objects.

El User Control tiene un evento **OnSimpleUploadComplete** que se dispara siempre que un archivo es terminado de cargar al servidor.

Ejemplo de evento, recorriendo los archivos cargados.

```js
Event HugaoFileUpload.OnSimpleUploadComplete()
	For &HugaoUploadedFile In &HugaoUploadedFiles
		Msg(!"Archivo subido!, Nombre Original -> " + &HugaoUploadedFile.OringinalName + !" Nombre Cargado -> " + &HugaoUploadedFile.UploadedFileName)
	EndFor
EndEvent
```

## Seguridad 🔐

En el folder creado por el UC en su primera importación encontrará dos procedimientos que le permitirán extender la seguridad de su aplicación en la carga de archivos.

Para estos procedimientos, la recomendación es crear uno nuevo y en él hacer su código y modificar los entregados, solo para llamar los suyos, esto es porque GeneXus cada vez que se arrastre el UC a un webform re-importará el XPZ de recursos y puede que sobre-escriba su código.

### Validación de seguridad

El procedimiento **InternalSecurityValidation** permitirá que ud haga alguna validación de seguridad, ya sea verificar un valor en la websession o un login, lo importante es respetar la estructura y la documentación mencionada en el procedimiento, debe siempre retornar **True** o **False** dependiendo de la validación, teniendo en cuenta que este resultado le indicará al User Control si debe continuar o no con el cargue de la información.

### Dominios aprobados

El procedimiento **GetAllAllowedDomains** permitirá que ud haga un filtro de dominios permitidos que pueden llamar y usar la respuesta del procedimiento de carga de archivos, siga el ejemplo escrito en el procedimiento para personalizar.

## Licencia 📄

Este proyecto está bajo la Licencia (Creative Commons)

## Expresiones de Gratitud 🎁

* Comente a otros sobre este proyecto 📢
* Invite una cerveza 🍺 o un café ☕ a alguien del equipo.
* De las gracias públicamente 🤓.
* etc.
