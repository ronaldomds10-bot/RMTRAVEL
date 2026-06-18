import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import type {
  Customer,
  CustomerDocumentType,
  CustomerStatus,
  CustomerTag,
  CustomerType
} from '../../types/customer';

export type CustomerFormValues = Omit<Customer, 'id'> & {
  id?: string;
};

type NewCustomerModalProps = {
  customer?: Customer | null;
  isOpen: boolean;
  mode?: 'create' | 'edit';
  onClose: () => void;
  onSave: (customer: CustomerFormValues) => Promise<void>;
};

const statusOptions: CustomerStatus[] = ['ativo', 'pendente', 'inativo'];
const tagOptions: CustomerTag[] = ['viagem', 'milhas', 'financeiro', 'atendimento'];
const typeOptions: CustomerType[] = ['Pessoa fisica', 'Empresa', 'VIP'];
const documentTypeOptions: CustomerDocumentType[] = ['CPF', 'Passaporte', 'CNPJ'];
const channelOptions: Customer['contact']['preferredChannel'][] = ['Email', 'Telefone', 'WhatsApp'];

const fieldClass =
  'mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50';

function createEmptyForm(): CustomerFormValues {
  return {
    personal: {
      fullName: '',
      documentType: 'CPF',
      documentNumber: '',
      type: 'Pessoa fisica'
    },
    contact: {
      email: '',
      phone: '',
      preferredChannel: 'WhatsApp'
    },
    address: {
      city: '',
      state: '',
      country: 'Brasil'
    },
    travelProfile: {
      status: 'ativo',
      tags: ['atendimento'],
      lastInteraction: new Date().toLocaleDateString('pt-BR'),
      nextAction: '',
      tripInProgress: false,
      preferredDestinations: []
    },
    financial: {
      openAmount: 0,
      currency: 'BRL',
      hasPendingPayment: false
    },
    notes: ''
  };
}

function toFormValues(customer?: Customer | null): CustomerFormValues {
  if (!customer) {
    return createEmptyForm();
  }

  return structuredClone(customer);
}

export function NewCustomerModal({
  customer,
  isOpen,
  mode = 'create',
  onClose,
  onSave
}: NewCustomerModalProps) {
  const [form, setForm] = useState<CustomerFormValues>(() => toFormValues(customer));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormValues(customer));
      setIsSubmitting(false);
    }
  }, [customer, isOpen]);

  if (!isOpen) {
    return null;
  }

  const canSubmit =
    form.personal.fullName.trim().length > 1 &&
    form.personal.documentNumber.trim().length > 2 &&
    form.contact.email.trim().length > 3 &&
    form.contact.phone.trim().length > 3 &&
    form.address.city.trim().length > 1 &&
    form.address.state.trim().length > 1 &&
    !isSubmitting;

  function updateForm(updater: (current: CustomerFormValues) => CustomerFormValues) {
    setForm((current) => updater(structuredClone(current)));
  }

  function toggleTag(tag: CustomerTag) {
    updateForm((current) => {
      const tags = current.travelProfile.tags.includes(tag)
        ? current.travelProfile.tags.filter((item) => item !== tag)
        : [...current.travelProfile.tags, tag];

      return {
        ...current,
        travelProfile: {
          ...current.travelProfile,
          tags: tags.length > 0 ? tags : [tag]
        }
      };
    });
  }

  function updateDestinations(value: string) {
    updateForm((current) => ({
      ...current,
      travelProfile: {
        ...current.travelProfile,
        preferredDestinations: value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    await onSave({
      ...form,
      personal: {
        ...form.personal,
        fullName: form.personal.fullName.trim(),
        documentNumber: form.personal.documentNumber.trim()
      },
      contact: {
        ...form.contact,
        email: form.contact.email.trim(),
        phone: form.contact.phone.trim()
      },
      address: {
        ...form.address,
        city: form.address.city.trim(),
        state: form.address.state.trim(),
        country: form.address.country.trim() || 'Brasil'
      },
      financial: {
        ...form.financial,
        openAmount: Number(form.financial.openAmount) || 0,
        hasPendingPayment: Number(form.financial.openAmount) > 0
      }
    });
    setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 bg-slate-950/45"
        type="button"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">
              {mode === 'edit' ? 'Editar cliente' : 'Novo cliente'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Dados salvos no repositório ativo com fallback local.
            </p>
          </div>
          <button
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-slate-100"
            type="button"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-ink-700">Nome</span>
              <input
                className={fieldClass}
                value={form.personal.fullName}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    personal: { ...current.personal, fullName: event.target.value }
                  }))
                }
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-ink-700">Tipo</span>
              <select
                className={fieldClass}
                value={form.personal.type}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    personal: { ...current.personal, type: event.target.value as CustomerType }
                  }))
                }
              >
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-ink-700">Documento</span>
              <div className="mt-2 grid grid-cols-[8rem_1fr] gap-2">
                <select
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  value={form.personal.documentType}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      personal: {
                        ...current.personal,
                        documentType: event.target.value as CustomerDocumentType
                      }
                    }))
                  }
                >
                  {documentTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  value={form.personal.documentNumber}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      personal: { ...current.personal, documentNumber: event.target.value }
                    }))
                  }
                />
              </div>
            </label>

            <label>
              <span className="text-sm font-semibold text-ink-700">Status</span>
              <select
                className={fieldClass}
                value={form.travelProfile.status}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    travelProfile: {
                      ...current.travelProfile,
                      status: event.target.value as CustomerStatus
                    }
                  }))
                }
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-ink-700">Email</span>
              <input
                className={fieldClass}
                type="email"
                value={form.contact.email}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    contact: { ...current.contact, email: event.target.value }
                  }))
                }
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-ink-700">Telefone</span>
              <input
                className={fieldClass}
                value={form.contact.phone}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    contact: { ...current.contact, phone: event.target.value }
                  }))
                }
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-ink-700">Canal preferido</span>
              <select
                className={fieldClass}
                value={form.contact.preferredChannel}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    contact: {
                      ...current.contact,
                      preferredChannel: event.target.value as Customer['contact']['preferredChannel']
                    }
                  }))
                }
              >
                {channelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-[1fr_6rem] gap-2">
              <label>
                <span className="text-sm font-semibold text-ink-700">Cidade</span>
                <input
                  className={fieldClass}
                  value={form.address.city}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      address: { ...current.address, city: event.target.value }
                    }))
                  }
                />
              </label>
              <label>
                <span className="text-sm font-semibold text-ink-700">UF</span>
                <input
                  className={`${fieldClass} uppercase`}
                  maxLength={2}
                  value={form.address.state}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      address: { ...current.address, state: event.target.value.toUpperCase() }
                    }))
                  }
                />
              </label>
            </div>

            <label>
              <span className="text-sm font-semibold text-ink-700">Valor em aberto</span>
              <input
                className={fieldClass}
                min="0"
                step="0.01"
                type="number"
                value={form.financial.openAmount}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    financial: {
                      ...current.financial,
                      openAmount: Number(event.target.value),
                      hasPendingPayment: Number(event.target.value) > 0
                    }
                  }))
                }
              />
            </label>

            <label className="sm:col-span-2">
              <span className="text-sm font-semibold text-ink-700">Próxima ação</span>
              <input
                className={fieldClass}
                value={form.travelProfile.nextAction}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    travelProfile: { ...current.travelProfile, nextAction: event.target.value }
                  }))
                }
              />
            </label>

            <label className="sm:col-span-2">
              <span className="text-sm font-semibold text-ink-700">Destinos preferidos</span>
              <input
                className={fieldClass}
                value={form.travelProfile.preferredDestinations.join(', ')}
                onChange={(event) => updateDestinations(event.target.value)}
                placeholder="Lisboa, Paris"
              />
            </label>

            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-ink-700">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <label
                    className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-ink-700"
                    key={tag}
                  >
                    <input
                      checked={form.travelProfile.tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      type="checkbox"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                checked={form.travelProfile.tripInProgress}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    travelProfile: {
                      ...current.travelProfile,
                      tripInProgress: event.target.checked
                    }
                  }))
                }
                type="checkbox"
              />
              <span className="text-sm font-semibold text-ink-700">Viagem em andamento</span>
            </label>

            <label className="sm:col-span-2">
              <span className="text-sm font-semibold text-ink-700">Observações</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                value={form.notes}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    notes: event.target.value
                  }))
                }
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} type="submit">
              {isSubmitting ? 'Salvando...' : 'Salvar cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
