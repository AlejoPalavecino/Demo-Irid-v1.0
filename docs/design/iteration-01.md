# Iteración visual 01 · IRID

Autorizada por Alejo el 15/11/2026: mejorar diseño, colores y espaciados, conservando flujos y adaptando el sistema a distintos dispositivos.

## Dirección

La interfaz debe facilitar una jornada operativa: horarios y estados se reconocen primero, los formularios conservan espacio para leer y las acciones principales no compiten entre sí. Se conserva el carácter institucional cálido de IRID, sin introducir una identidad diferente.

Paleta: bordó `#7B1F36` para acciones y selección, bordó profundo `#501322` para contraste, rosa claro `#F3E7EB` para contexto, fondo claro `#F8F7F4`, blanco `#FFFFFF` para superficies y grafito `#292529` para texto. Los estados usan verde, ámbar y azul con etiquetas; nunca dependen sólo del color.

Montserrat permanece como única familia. Texto base 14–16 px, controles 14 px, títulos de sección 20–24 px y títulos de página fluidos 28–38 px. Se reducen mayúsculas decorativas y tracking excesivo; cifras tabulares para horarios, kilómetros e importes.

## Estructura

Escritorio: barra lateral compacta, cabecera estable y contenido con ancho máximo. Mi jornada conserva turno → comprobantes → viajes por horario, con ancho legible. En agenda, la fecha y los filtros tienen prioridad frente a la lista. En administración, las tablas aprovechan el ancho disponible.

Tablet: navegación en panel desplegable cuando ya no queda espacio para contenido y menú juntos; filtros y resúmenes en dos columnas cuando alcanzan.

Celular: cabecera con logo y menú, formularios de una columna, acciones amplias, listas administrativas legibles por registro y tablas financieras con desplazamiento local indicado. Los modales se adaptan al alto disponible y al teclado; su título y acciones permanecen accesibles.

```
Escritorio                     Celular
┌ menú ┬ cabecera ──────────┐   ┌ logo · sección · menú ┐
│      │ título + acciones │   │ título y acción       │
│      │ contenido fluido  │   │ formulario / listado │
│      │ hasta 1320 px     │   │ una columna          │
└──────┴───────────────────┘   └───────────────────────┘
```

## Criterios

- Sin scroll horizontal del documento a 320, 390, 768, 1024, 1440 y 1920 px; las tablas anchas pueden desplazarse dentro de su región.
- Texto y acciones sin recortes; nombres e importes largos pueden acomodarse sin tapar controles.
- Contraste legible, estados explícitos, controles táctiles principales de al menos 44 px, foco visible y navegación por teclado.
- Menú móvil con cierre y retorno de foco; formularios y confirmaciones mantienen los datos y reglas ya acordados.
- Verificación de pantallas representativas de los cuatro roles y prueba de tareas, no sólo capturas.

La base visual y los flujos ya están aprobados; esta iteración ejecuta el refinamiento solicitado. Q-001, Q-002 y Q-003 permanecen abiertas. No agrega funciones comerciales ni configura producción.
