/** Mapa contable de la nómina: gasto por departamento y pasivos del rol. Se suma a `accountMap`. */
type Dept = 'Sales' | 'Admin'
const DEPT: Record<Dept, { name: string; root: string }> = {
  Sales: { name: 'ventas', root: '5.2.01' },
  Admin: { name: 'administración', root: '5.2.02' },
}

const concepts = (d: Dept) => {
  const { name, root } = DEPT[d]
  return {
    [`payroll${d}Salaries`]: { label: `Sueldos (${name})`, help: `Sueldo del mes según días trabajados. Ej.: ${root}.01.01.001 Sueldos.` },
    [`payroll${d}Overtime`]: { label: `Horas extra y otros ingresos (${name})`, help: `Extras / otros ingresos del rol. Ej.: ${root}.01.01.002 Sobretiempos.` },
    [`payroll${d}Commissions`]: {
      label: `Comisiones (${name})`,
      help: d === 'Sales' ? 'Comisiones del rol. Ej.: 5.2.01.04.02.001 Comisiones a la Fuerza de Venta.' : 'No hay cuenta de comisiones administrativas: por defecto 5.2.02.04.02.002 Bonificaciones por Incentivo (por confirmar).',
    },
    [`payroll${d}EmployerIess`]: { label: `Aporte patronal 11,15 % (${name})`, help: `Ej.: ${root}.02.01.001 Aporte Patronal.` },
    [`payroll${d}SecapIece`]: { label: `SECAP + IECE 1 % (${name})`, help: `Ej.: ${root}.02.01.002 Iece y Secap.` },
    [`payroll${d}ReserveFund`]: { label: `Fondo de reserva 8,33 % (${name})`, help: `Desde el primer año de trabajo. Ej.: ${root}.02.01.003 Fondo de Reserva.` },
    [`payroll${d}Thirteenth`]: { label: `Décimo tercero (${name})`, help: `Ingresos / 12. Ej.: ${root}.03.01.001 Decimo Tercer Sueldo.` },
    [`payroll${d}Fourteenth`]: { label: `Décimo cuarto (${name})`, help: `SBU / 12. Ej.: ${root}.03.01.002 Decimo Cuarto Sueldo.` },
    [`payroll${d}Vacation`]: { label: `Vacaciones (${name})`, help: `Ingresos / 24. Ej.: ${root}.03.01.003 Vacaciones.` },
  }
}

const keysOf = (d: Dept) => Object.keys(concepts(d))

export const accountMapPayroll = {
  groups: [
    { title: 'Nómina · gasto de ventas', keys: keysOf('Sales') },
    { title: 'Nómina · gasto administrativo', keys: keysOf('Admin') },
    {
      title: 'Nómina · pasivos y descuentos',
      keys: [
        'payrollNetPayable',
        'payrollIessPersonal',
        'payrollIessPayable',
        'payrollThirteenthProvision',
        'payrollFourteenthProvision',
        'payrollVacationProvision',
        'payrollReserveFundProvision',
        'employeeLoans',
        'payrollOtherDeductions',
      ],
    },
  ],
  keys: {
    ...concepts('Sales'),
    ...concepts('Admin'),
    payrollNetPayable: { label: 'Nómina por pagar (neto)', help: 'Neto a recibir de cada empleado, con su tercero. Ej.: 2.1.07.04.01.001 Nomina por pagar.' },
    payrollIessPersonal: { label: 'Aporte personal 9,45 % por pagar', help: 'Lo descontado al empleado para el IESS. Ej.: 2.1.07.03.01.001 9.45 % Aportes IESS por pagar.' },
    payrollIessPayable: {
      label: 'IESS por pagar (patronal y préstamos)',
      help: 'Aporte patronal, SECAP/IECE y cuotas de préstamos quirografarios e hipotecarios: se pagan en la planilla del IESS. Ej.: 2.1.07.03.01.002 I.E.S.S. por Pagar.',
    },
    payrollThirteenthProvision: { label: 'Provisión décimo tercero', help: 'Ej.: 2.1.07.04.02.001 Decimo Tercer Sueldo.' },
    payrollFourteenthProvision: { label: 'Provisión décimo cuarto', help: 'Ej.: 2.1.07.04.02.002 Decimo Cuarto Sueldo.' },
    payrollVacationProvision: { label: 'Provisión vacaciones', help: 'Ej.: 2.1.07.04.02.003 Vacaciones.' },
    payrollReserveFundProvision: {
      label: 'Fondos de reserva por pagar',
      help: 'Fondo de reserva de quien lo acumula en el IESS (el mensualizado va en el neto). Ej.: 2.1.07.04.02.005 Fondos de Reserva.',
    },
    employeeLoans: { label: 'Préstamos a empleados', help: 'Cuotas de préstamos internos descontadas en el rol. Ej.: 1.1.02.08.02.001 Prestamos a los Empleados.' },
    payrollOtherDeductions: { label: 'Otros descuentos del rol', help: 'Anticipos y otros descuentos manuales. Ej.: 1.1.02.08.02.022 Anticipo de Quincena.' },
  } as Record<string, { label: string; help: string }>,
}
