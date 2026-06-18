export type ImportAirline = 'azul' | 'gol' | 'latam' | 'iberia' | 'american';

export type ImportEmissionInput = {
  airline: ImportAirline;
  recordLocator: string;
  passengerLastName: string;
};

export type ImportedEmission = {
  passengerName: string;
  passengerLastName: string;
  airline: string;
  recordLocator: string;
  ticketNumber: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  baggageInfo: string;
  bookingStatus: string;
};

export type EmissionProviderErrorCode = 'not_configured' | 'provider_error';

export class EmissionProviderError extends Error {
  code: EmissionProviderErrorCode;
  airline: ImportAirline | 'agencyApi';

  constructor(
    code: EmissionProviderErrorCode,
    airline: ImportAirline | 'agencyApi',
    message = 'Integração ainda não configurada para esta companhia.'
  ) {
    super(message);
    this.name = 'EmissionProviderError';
    this.code = code;
    this.airline = airline;
  }
}

export interface EmissionProvider {
  airline: ImportAirline | 'agencyApi';
  importEmission(input: ImportEmissionInput): Promise<ImportedEmission | null>;
}

export function createPlaceholderEmissionProvider(
  airline: ImportAirline | 'agencyApi'
): EmissionProvider {
  return {
    airline,
    async importEmission() {
      throw new EmissionProviderError('not_configured', airline);
    }
  };
}
