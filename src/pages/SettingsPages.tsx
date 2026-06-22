import {
  Building2,
  CreditCard,
  Headphones,
  Save,
  UserRound
} from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { settingsRepository } from '../services/settings/settingsRepositoryAdapter';
import type {
  CompanySettings,
  CompanySettingsRecord,
  UserProfile,
  UserProfileRecord
} from '../types/settings';

const settingsCards = [
  {
    title: 'Meu perfil',
    description: 'Atualize nome, telefone e avatar do usuario autenticado.',
    path: '/platform/settings/profile',
    icon: UserRound
  },
  {
    title: 'Minha empresa',
    description: 'Gerencie dados da agencia usados na plataforma.',
    path: '/platform/settings/company',
    icon: Building2
  },
  {
    title: 'Minha assinatura',
    description: 'Consulte o estado do plano atual.',
    path: '/platform/settings/subscription',
    icon: CreditCard
  },
  {
    title: 'Atendimento',
    description: 'Veja canais e instrucoes para solicitar suporte.',
    path: '/platform/settings/support',
    icon: Headphones
  }
];

const emptyUserProfile: UserProfile = {
  name: '',
  email: '',
  phone: '',
  avatarUrl: ''
};

const emptyCompanySettings: CompanySettings = {
  companyName: '',
  cnpj: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  site: '',
  logoUrl: ''
};

export function SettingsHomePage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie perfil, empresa, assinatura e canais de atendimento."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {settingsCards.map((card) => (
          <Link className="group block" key={card.path} to={card.path}>
            <Card className="h-full transition hover:border-brand-200 hover:bg-brand-50">
              <CardContent>
                <div className="grid size-10 place-items-center rounded-lg bg-slate-50 text-brand-700 ring-1 ring-slate-200">
                  <card.icon size={20} aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-sm font-semibold text-ink-900">{card.title}</h2>
                <p className="mt-2 text-sm leading-5 text-ink-500">{card.description}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-brand-700">
                  Abrir
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [formValues, setFormValues] = useState<UserProfile>(emptyUserProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const record = await settingsRepository.getUserProfile();
      setProfile(record);
      setFormValues(record);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar perfil.');
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(field: keyof UserProfile, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value
    }));
    setMessage(null);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setMessage(null);
      setErrorMessage(null);
      const saved = await settingsRepository.saveUserProfile(
        {
          name: formValues.name.trim(),
          phone: formValues.phone.trim(),
          avatarUrl: formValues.avatarUrl.trim()
        },
        profile?.id
      );
      setProfile(saved);
      setFormValues(saved);
      setMessage('Perfil salvo.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar perfil.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SettingsFormShell
      title="Meu perfil"
      description="Atualize os dados do usuário autenticado."
      isLoading={isLoading}
      message={message}
      errorMessage={errorMessage}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Nome"
          value={formValues.name}
          disabled={isLoading || isSaving}
          onChange={(value) => updateField('name', value)}
        />
        <TextField label="Email" value={formValues.email} disabled readOnly onChange={() => {}} />
        <TextField
          label="Telefone"
          value={formValues.phone}
          disabled={isLoading || isSaving}
          onChange={(value) => updateField('phone', value)}
        />
        <TextField
          label="Avatar URL"
          value={formValues.avatarUrl}
          disabled={isLoading || isSaving}
          onChange={(value) => updateField('avatarUrl', value)}
        />
        <Button className="w-full sm:w-auto" disabled={isLoading || isSaving} type="submit">
          <Save size={16} aria-hidden="true" />
          {isSaving ? 'Salvando' : 'Salvar perfil'}
        </Button>
      </form>
    </SettingsFormShell>
  );
}

export function CompanySettingsPage() {
  const [company, setCompany] = useState<CompanySettingsRecord | null>(null);
  const [formValues, setFormValues] = useState<CompanySettings>(emptyCompanySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const record = await settingsRepository.getCompanySettings();
      setCompany(record);
      setFormValues(record);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel carregar dados da empresa.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(field: keyof CompanySettings, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value
    }));
    setMessage(null);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setMessage(null);
      setErrorMessage(null);
      const saved = await settingsRepository.saveCompanySettings(
        {
          ...formValues,
          companyName: formValues.companyName.trim(),
          whatsapp: formValues.whatsapp.trim(),
          instagram: formValues.instagram.trim(),
          logoUrl: formValues.logoUrl.trim()
        },
        company?.id
      );
      setCompany(saved);
      setFormValues(saved);
      setMessage('Dados da empresa salvos.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel salvar dados da empresa.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SettingsFormShell
      title="Minha empresa"
      description="Gerencie dados da empresa ou agência."
      isLoading={isLoading}
      message={message}
      errorMessage={errorMessage}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Nome da empresa/agência"
          value={formValues.companyName}
          disabled={isLoading || isSaving}
          onChange={(value) => updateField('companyName', value)}
        />
        <TextField label="CNPJ" value={formValues.cnpj} disabled onChange={() => {}} />
        <TextField label="Telefone" value={formValues.phone} disabled onChange={() => {}} />
        <TextField
          label="WhatsApp"
          value={formValues.whatsapp}
          disabled={isLoading || isSaving}
          onChange={(value) => updateField('whatsapp', value)}
        />
        <TextField
          label="Instagram"
          value={formValues.instagram}
          disabled={isLoading || isSaving}
          onChange={(value) => updateField('instagram', value)}
        />
        <TextField label="Site" value={formValues.site} disabled onChange={() => {}} />
        <TextField
          label="Logo URL"
          value={formValues.logoUrl}
          disabled={isLoading || isSaving}
          onChange={(value) => updateField('logoUrl', value)}
        />
        <p className="text-sm leading-6 text-ink-500">
          Mantenha os dados principais da empresa sempre atualizados.
        </p>
        <Button className="w-full sm:w-auto" disabled={isLoading || isSaving} type="submit">
          <Save size={16} aria-hidden="true" />
          {isSaving ? 'Salvando' : 'Salvar empresa'}
        </Button>
      </form>
    </SettingsFormShell>
  );
}

export function SubscriptionSettingsPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Minha assinatura"
        description="Acompanhe o estado do plano da conta."
      />
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoBlock label="Plano atual" value="Plano atual" />
          <InfoBlock label="Status" value="Ativo" />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <EmptyState
            icon={CreditCard}
            title="Gestao de assinatura"
            description="Consulte os canais de atendimento para ajustes no plano."
            actionLabel="Informativo"
          />
        </CardContent>
      </Card>
    </section>
  );
}

export function SupportSettingsPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Atendimento"
        description="Canais para solicitar ajuda com a plataforma."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent>
            <InfoBlock label="WhatsApp de suporte" value="+55 11 99999-9999" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <InfoBlock label="E-mail de suporte" value="suporte@rmtravel.com.br" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Como solicitar ajuda</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-ink-500">
            Envie uma mensagem informando seu e-mail de acesso, a tela onde ocorreu o problema e
            uma breve descrição do que precisa resolver.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function SettingsFormShell({
  title,
  description,
  isLoading,
  message,
  errorMessage,
  children
}: {
  title: string;
  description: string;
  isLoading: boolean;
  message: string | null;
  errorMessage: string | null;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <PageHeader title={title} description={description} />
      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink-600">
          Carregando configuracoes...
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {errorMessage}
        </div>
      ) : null}
      <Card>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

function TextField({
  label,
  value,
  disabled,
  readOnly,
  onChange
}: {
  label: string;
  value: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-ink-900" htmlFor={id}>
        {label}
      </label>
      <input
        className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-ink-500"
        disabled={disabled}
        id={id}
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-ink-900">{value}</p>
    </div>
  );
}
