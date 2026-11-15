# IRID · Revisión independiente de la maqueta

**Resultado: PASS / VERIFIED** para las reglas de negocio, permisos simulados y exportaciones automáticas ejercitadas. Los tres hallazgos bloqueantes de la revisión quedaron corregidos y se repitieron sus comprobaciones negativas. La interacción visual se verifica por separado.

Candidato revisado: `outputs/IRID-maqueta-interactiva.html`, SHA-256 `ae4a2864508b04f57bf50c1279f036c2b280e87d984e4480a1250e942d7789e8`, 1.317.252 bytes. El directorio de trabajo carece de revisión Git. Verifiqué que el HTML contiene exactamente los cinco módulos fuente, con la transformación de exportaciones que usa `build.py`.

| Archivo | SHA-256 |
| --- | --- |
| `domain.js` | `eb5813aeb16602fc546384f4a6c9e87f28f1a066c5f83ad4b4bdb94f17120447` |
| `main.js` | `ee226a0b1c34a8fd1dd3002cd00f2aba1bd5baf680fb8668c785059eca52a5d0` |
| `operations.js` | `ab8ec16a51fc40a9b0df409e6e831da8a88731f549c3c47915e96f7c0a4f7f7d` |
| `management.js` | `03499ba0d217c9f87c509344201071503785a8217d6dbe152b9936145aad3150` |
| `finance.js` | `18d666572fcd4ea6122b0f016768d1466f99a6ca6eee5335b1a5490900fd1e0a` |
| `tests/domain.test.js` | `8ee65f97cbd3a2721f6ea121b4ed320d095707354e2f1c1d333d52d4acc7457d` |
| `tests/exports.test.js` | `c94a99c5741148b0dc25c6f75605cf25a41b6df67ed131e41d542b4657f44a31` |

Criterios según `contract.md`, `reference/spec.md` y `reference/ux.md`. La revisión se concentró en alcance por rol, baja con sesión abierta, diferencias de odómetro, estados y asignación de viajes, respaldos de versiones emitidas, confirmación de emisión y filtros de reportes.

## Hallazgos corregidos y comprobación repetida

1. **Alta · CA-16 / D-022 · La baja podía revertirse desde otra pestaña.** En la primera versión cada pestaña conservaba su copia del estado y escribía todos los datos al guardar. Abrí dos contextos de Node `vm` que ejecutaban `main.js`, con `localStorage` compartido y sesiones distintas. A inició como Diego y B como Alejandro. B dio de baja a Diego y A intentó abrir Móvil 01 con 50.000 km antes de recibir el evento `storage`. El candidato sincroniza antes de aplicar la operación y al recibir cambios. El intento se rechazó, A volvió al ingreso, la baja siguió persistida y el turno quedó sin abrir. Un segundo ensayo confirmó que una novedad escrita por Diego y un ajuste posterior de Alejandro se preservan juntos. [main.js:26](../main.js#L26), [main.js:70](../main.js#L70).
2. **Alta · CA-09 / D-012 · Era posible abrir un turno con una lectura negativa pendiente.** Con Diego, informá 49.990 km para Móvil 01 con referencia de 50.000 km. Antes, volver a ingresar 50.000 permitía abrir y dejaba el aviso pendiente. En el retest, `Domain.apply` rechazó ese intento tanto para Diego como Walter. También rechazó corregir el cierre a 49.991 km. Walter corrigió el cierre a 49.990 km con motivo y Diego pudo abrir con el valor real. La revisión quedó resuelta y conservó la lectura informada. [domain.js:309](../domain.js#L309), [domain.js:377](../domain.js#L377).
3. **Alta · UX-030 · Una segunda pestaña podía alterar el total ya mostrado para confirmar.** En dos contextos Node `vm` con almacenamiento compartido, A abrió la confirmación de Transp SERV de octubre. B ajustó el importe de `t-oct-diego` a 55.000 y A confirmó antes de recibir el evento `storage`. Al sincronizar la vista previa, la confirmación detectó el cambio, mostró «Los datos cambiaron» y no creó una versión. Se ejercitó el manejador real de `finance.js` con un DOM mínimo. [main.js:28](../main.js#L28), [finance.js:731](../finance.js#L731).

## Evidencia ejecutada

- `npm test` con Node `v24.20.0` desde `work/irid-prototype`. **22/22** pruebas pasaron. Incluyen permisos, contraseñas temporales, vigencia de tarifas, inmutabilidad de versiones, combustible con y sin foto, separación por rol y filtros en reportes, formato básico XLSX/PDF, asignaciones, generación mensual y reprogramación sin cambios parciales.
- `node --input-type=module` en memoria, con `node:assert/strict` y `node:vm`. Pasaron los cuatro escenarios detallados arriba. Los ensayos de sesión usaron una `Map` compartida para imitar almacenamiento, dispararon las acciones ordenadamente y comprobaron persistencia y resultado. El ensayo de odómetro usó `seed`, `apply` y aserciones sobre el estado devuelto.
- `python -` de solo lectura para comparar los cinco módulos transformados con el HTML. Coincidieron `Domain`, `Operations`, `Management`, `Finance` y `main`.
- `node --input-type=module` en memoria con `node:vm.Script` sobre el JavaScript extraído del HTML entregable. Los cuatro perfiles renderizaron su pantalla inicial sin errores. Para Walter, Secretaria y Diego también se comprobó que la navegación inicial excluye tarifas, liquidaciones y usuarios.

## Verificaciones fuera de esta revisión

La revisión de interacción real, teclado, responsive y descarga en navegador corresponde a la evidencia de QA del orquestador. Los ensayos de sincronización cubrieron mutaciones sucesivas con estado obsoleto. La escritura simultánea entre procesos y el comportamiento de almacenamiento de `file:` en navegadores distintos quedaron sin comprobar. Se usaron datos ficticios y permisos simulados del HTML local. La seguridad, los respaldos, la restauración, la capacidad productiva y la validación con usuarios quedan fuera de la verificación. Q-001, Q-002 y Q-003 siguen pendientes.
