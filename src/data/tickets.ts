import type { Ticket } from '../types/ticket';

export const tickets: Ticket[] = [
  {
    id: 'TCK-2001',
    passenger: 'Marina',
    surname: 'Costa',
    locator: 'RM7LIS',
    airline: 'TAP Air Portugal',
    provider: 'mock',
    status: 'emitido',
    amount: 4820,
    currency: 'BRL',
    observations: 'Assento corredor solicitado. Verificar documentacao para conexao.',
    segments: [
      {
        id: 'SEG-2001-1',
        origin: { iata: 'GRU', city: 'Sao Paulo', terminal: '3' },
        destination: { iata: 'LIS', city: 'Lisboa', terminal: '1' },
        departure: { date: '24/07/2026', time: '22:05' },
        arrival: { date: '25/07/2026', time: '11:35' },
        flightNumber: 'TP084',
        fareClass: 'Economy Classic',
        baggage: {
          carryOn: '1 bagagem de mao de 10kg',
          checked: '1 mala despachada de 23kg',
          notes: 'Franquia incluida na tarifa.'
        }
      },
      {
        id: 'SEG-2001-2',
        origin: { iata: 'LIS', city: 'Lisboa', terminal: '1' },
        destination: { iata: 'ORY', city: 'Paris', terminal: '3' },
        departure: { date: '29/07/2026', time: '14:15' },
        arrival: { date: '29/07/2026', time: '17:45' },
        flightNumber: 'TP436',
        fareClass: 'Economy Classic',
        baggage: {
          carryOn: '1 bagagem de mao de 10kg',
          checked: '1 mala despachada de 23kg'
        }
      }
    ],
    rawResponse: {
      source: 'mock',
      locator: 'RM7LIS',
      schemaVersion: 1
    }
  },
  {
    id: 'TCK-2002',
    passenger: 'Rafael',
    surname: 'Nogueira',
    locator: 'RM8BUE',
    airline: 'LATAM Airlines',
    provider: 'latam',
    status: 'confirmado',
    amount: 1890,
    currency: 'BRL',
    observations: 'Cliente pediu opcoes de hotel proximas ao centro.',
    segments: [
      {
        id: 'SEG-2002-1',
        origin: { iata: 'CNF', city: 'Belo Horizonte', terminal: '1' },
        destination: { iata: 'AEP', city: 'Buenos Aires' },
        departure: { date: '12/08/2026', time: '08:40' },
        arrival: { date: '12/08/2026', time: '15:10' },
        flightNumber: 'LA8120',
        fareClass: 'Light',
        baggage: {
          carryOn: '1 bagagem de mao de 10kg',
          checked: 'Sem bagagem despachada',
          notes: 'Adicionar mala antes da emissao se necessario.'
        }
      }
    ],
    rawResponse: {
      source: 'latam',
      environment: 'mock'
    }
  },
  {
    id: 'TCK-2003',
    passenger: 'Camila',
    surname: 'Rocha',
    locator: 'RM9MIA',
    airline: 'American Airlines',
    provider: 'consolidator',
    status: 'pendente',
    amount: 5360,
    currency: 'BRL',
    observations: 'Reserva aguardando validacao de milhas antes da emissao.',
    segments: [
      {
        id: 'SEG-2003-1',
        origin: { iata: 'FOR', city: 'Fortaleza' },
        destination: { iata: 'MIA', city: 'Miami' },
        departure: { date: '03/09/2026', time: '01:20' },
        arrival: { date: '03/09/2026', time: '08:55' },
        flightNumber: 'AA776',
        fareClass: 'Main Cabin',
        baggage: {
          carryOn: '1 bagagem de mao + item pessoal',
          checked: '2 malas despachadas de 23kg'
        }
      }
    ],
    rawResponse: {
      source: 'consolidator',
      pendingMilesValidation: true
    }
  }
];
