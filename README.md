# TechPulse

Plataforma web de noticias tecnológicas para las **entregas 1 y 2** del módulo Desarrollo de Front-end.

## Descripción

TechPulse permite explorar un catálogo de noticias, abrir el detalle de cada una, guardar favoritas y enviar un formulario de contacto. También incluye una pantalla de administración para crear y eliminar noticias.

Los textos del catálogo son ficticios y se escribieron para este proyecto académico. No provienen de medios reales.

Esta etapa usa HTML, CSS, JavaScript y un JSON local. Angular queda para una entrega posterior y no forma parte de este código.

## Objetivo

Construir una interfaz multipágina, responsive y fácil de explicar en una sustentación, con renderizado dinámico, persistencia en el navegador y responsabilidades separadas en JavaScript.

## Tecnologías

- HTML5 semántico
- CSS3 propio, sin Bootstrap
- JavaScript moderno (ES6+)
- JSON local (`data/noticias.json`)
- `localStorage`


## Estructura

```text
plataforma-noticias/
├── index.html
├── noticias.html
├── detalle.html
├── favoritos.html
├── contacto.html
├── admin.html
├── css/
│   ├── styles.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── noticias.js
│   ├── detalle.js
│   ├── favoritos.js
│   ├── contacto.js
│   └── crud.js
├── data/
│   └── noticias.json
├── assets/
│   ├── images/
│   └── icons/
├── .gitignore
└── README.md
```

## Funcionalidades

- Inicio con encabezado, menú, hero, noticias destacadas, llamado a contacto y pie de página.
- Listado de noticias en cards generadas desde el JSON. Cada card muestra imagen, título, descripción breve y el enlace **Ver más**.
- Filtro por categoría en el listado.
- Detalle en `detalle.html?id=1`, con imagen, título, categoría, fecha, contenido, favorito y regreso al listado.
- Favoritos en `localStorage`: agregar, quitar, estado visual del botón y mensaje cuando la lista está vacía.
- Contacto con nombre, correo, asunto y mensaje. Los campos son obligatorios, el correo se valida y, si todo es correcto, se muestra una confirmación y se limpia el formulario.
- Administración para ver, crear y eliminar noticias en el navegador.

## Cómo ejecutar el proyecto

El catálogo se lee con `fetch`. Esa petición funciona cuando la carpeta se sirve por HTTP. Si abres `index.html` con doble clic (`file://`), el navegador bloquea el JSON.

Desde la carpeta del proyecto:

```bash
python -m http.server 5500
```

Abre [http://localhost:5500](http://localhost:5500).

También puedes usar la extensión Live Server del editor. La raíz del sitio debe ser la carpeta `plataforma-noticias`, para que las rutas `css/`, `js/`, `data/` y `assets/` resuelvan bien.

## localStorage

El archivo JSON es la semilla del catálogo y no se reescribe. El navegador guarda tres listas:

| Clave | Contenido |
| --- | --- |
| `techpulse_favoritos` | Ids de noticias marcadas, sin duplicados |
| `techpulse_noticias_creadas` | Noticias creadas en Administración |
| `techpulse_noticias_eliminadas` | Ids ocultos en este navegador |

`app.js` mezcla esas listas cada vez que una página pide el catálogo. Por eso el inicio, el listado, el detalle, favoritos y la administración ven los mismos datos.

Los favoritos guardan solo el id. Al mostrarlos, la página vuelve a buscar la noticia en el catálogo. Si el id ya no existe, se elimina de la lista.

El formulario de contacto no se guarda: solo se valida y se confirma en pantalla.
