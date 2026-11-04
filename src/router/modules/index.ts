import type { ModuleKey } from '@/config/site'
import type { ModuleDef } from '../defineModule'
import inicio from './inicio'
import bancos from './bancos'
import contabilidad from './contabilidad'
import cxp from './cxp'
import facturacion from './facturacion'
import cxc from './cxc'
import impuestos from './impuestos'
import inventario from './inventario'
import configuracion from './configuracion'

/** Un archivo por módulo: cada agente toca solo el suyo. */
export const modules: Record<ModuleKey, ModuleDef> = {
  inicio,
  bancos,
  contabilidad,
  cxp,
  facturacion,
  cxc,
  impuestos,
  inventario,
  configuracion,
}
