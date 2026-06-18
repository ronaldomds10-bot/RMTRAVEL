export type CustomerStatus = 'ativo' | 'pendente' | 'inativo';
export type CustomerTag = 'viagem' | 'milhas' | 'financeiro' | 'atendimento';
export type CustomerType = 'Pessoa fisica' | 'Empresa' | 'VIP';
export type CustomerDocumentType = 'CPF' | 'Passaporte' | 'CNPJ';

export type CustomerPersonalData = {
  fullName: string;
  documentType: CustomerDocumentType;
  documentNumber: string;
  type: CustomerType;
};

export type CustomerContact = {
  email: string;
  phone: string;
  preferredChannel: 'Email' | 'Telefone' | 'WhatsApp';
};

export type CustomerAddress = {
  city: string;
  state: string;
  country: string;
};

export type CustomerTravelProfile = {
  status: CustomerStatus;
  tags: CustomerTag[];
  lastInteraction: string;
  nextAction: string;
  tripInProgress: boolean;
  preferredDestinations: string[];
};

export type CustomerFinancial = {
  openAmount: number;
  currency: 'BRL';
  hasPendingPayment: boolean;
};

export type Customer = {
  id: string;
  personal: CustomerPersonalData;
  contact: CustomerContact;
  address: CustomerAddress;
  travelProfile: CustomerTravelProfile;
  financial: CustomerFinancial;
  notes: string;
};

export type CustomerRecord = Customer & {
  createdAt: string;
  updatedAt: string;
};
