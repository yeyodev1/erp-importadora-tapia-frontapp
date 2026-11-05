import APIBase from './httpBase'
import type { AccountMapKey, ErpUser, PayrollRates, Role, Settings } from '@/types'

export interface UserInput {
  email: string
  password: string
  name: string
  phone: string
  role: Role
  warehouseId: string | null
  isActive: boolean
}

class SettingsService extends APIBase {
  async load() {
    const { data } = await this.get<Settings>('settings')
    return data
  }

  /** Empresa, ambiente SRI, mapa contable y/o SBU y tasas de nómina (el API valida que las cuentas sean de movimiento). */
  async save(body: { company?: Settings['company']; sriEnvironment?: 1 | 2; accounts?: Partial<Record<AccountMapKey, string>>; payroll?: PayrollRates }) {
    const { data } = await this.put<Settings>('settings', body)
    return data
  }

  /** Cierra hasta "AAAA-MM" inclusive; null reabre todo. */
  async lock(period: string | null) {
    const { data } = await this.put<Settings>('settings/lock', { period })
    return data
  }

  async listUsers() {
    const { data } = await this.get<ErpUser[]>('settings/users')
    return data
  }

  async createUser(body: Omit<UserInput, 'isActive'>) {
    const { data } = await this.post<ErpUser>('settings/users', body)
    return data
  }

  /** El correo y la contraseña no se cambian acá. */
  async updateUser(id: string, body: Partial<Omit<UserInput, 'email' | 'password'>>) {
    const { data } = await this.put<ErpUser>(`settings/users/${id}`, body)
    return data
  }
}

export const settingsService = new SettingsService()
