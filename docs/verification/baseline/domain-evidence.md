# TASK-002 · Motor de demostración IRID

La API ESM del motor expone `seed`, `can`, `login`, `home`, `apply` y `preview`. Implementa las 28 acciones y las tres vistas previas del contrato. Las acciones devuelven un estado nuevo y las consultas devuelven copias.

## Ejecución

| Etapa | Comando desde `work/irid-prototype` | Resultado observado |
| --- | --- | --- |
| RED inicial | `node --test --test-name-pattern "apertura positiva" tests/domain.test.js` | Código 1. La evaluación falló porque abrir 20 km por encima del último cierre omitía la revisión. |
| RED de D-012 | `node --test --test-name-pattern "una lectura inferior" tests/domain.test.js` | Código 1. El segundo chofer podía abrir el vehículo con una lectura mayor pese a un aviso negativo pendiente del primero. |
| GREEN | `npm test` | Código 0. Pasaron 18 pruebas de dominio y 4 de exportación. |
| Sintaxis | `node --check domain.js` | Código 0. |

Las pruebas ejercitan permisos y cambio obligatorio de contraseña, apertura y cierre supervisado, registro explícito de pasajeros, no realización, lecturas reales incompatibles, comprobantes, gastos, colisiones, repetición de generación mensual, exclusiones de reprogramación, bajas con efectos históricos, tarifas por vigencia, bloqueo de emisión, cambios de chofer después de emisión y snapshots inmutables.

La fecha de demostración es el 16/11/2026. Diego puede abrir `v-1` con referencia 50.000 km y ejecutar `t-diego-08`. `s-old` permite practicar cierre supervisado. `rr-positive` conserva 41.220 km frente a 41.200 km y `rr-negative` conserva 30.970 km frente a 31.000 km, con apertura bloqueada para ese vehículo hasta corregir la referencia. `f-no-receipt`, `f-pending` y `f-verified` cubren los tres estados de comprobante. `ls-walter-oct-v1` es una emisión previa apta para comparar una versión corregida. Transp SERV de octubre está disponible para primera emisión y noviembre conserva viajes sin resolver.

La unidad utiliza cuentas y comprobantes ficticios. Los tiempos de los eventos son deterministas para reproducir la maqueta. Q-001, Q-002 y Q-003 siguen abiertas. Las pruebas del motor y exportación cubren el estado local. La aceptación en navegador corresponde a la verificación de integración.
