import { Check, Eye, Globe2, Save } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/cn';
import { siteRepository } from '../services/site/siteRepositoryAdapter';
import type { SiteConfiguration, SiteConfigurationRecord } from '../types/site';

type SiteSection = 'identity' | 'contacts' | 'visual' | 'publishing';

const siteSections: Array<{
  id: SiteSection;
  title: string;
  description: string;
}> = [
  {
    id: 'identity',
    title: 'Identidade',
    description: 'Nome, chamada principal e texto de apresentacao.'
  },
  {
    id: 'contacts',
    title: 'Contatos',
    description: 'Canais publicos para atendimento e relacionamento.'
  },
  {
    id: 'visual',
    title: 'Visual',
    description: 'Logo, imagem de capa e cor principal do site.'
  },
  {
    id: 'publishing',
    title: 'Publicação',
    description: 'Status da pagina publica da agencia.'
  }
];

const initialSiteConfiguration: SiteConfiguration = {
  agencyName: 'RMTRAVEL',
  headline: 'Viagens sob medida com atendimento especialista',
  description:
    'Conte com a RMTRAVEL para planejar, emitir e acompanhar sua proxima viagem com suporte direto.',
  whatsapp: '+55 11 99999-9999',
  instagram: '@rmtravel',
  logoUrl: '',
  coverImageUrl: '',
  primaryColor: '#1d4ed8',
  isPublished: false
};

export function SitePage() {
  const [activeSection, setActiveSection] = useState<SiteSection>('identity');
  const [draft, setDraft] = useState<SiteConfiguration>(initialSiteConfiguration);
  const [savedConfig, setSavedConfig] = useState<SiteConfigurationRecord | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(toComparableConfiguration(savedConfig)),
    [draft, savedConfig]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSiteConfiguration() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const configuration = await siteRepository.getSiteConfiguration();

        if (!isMounted) {
          return;
        }

        if (configuration) {
          setDraft(configuration);
          setSavedConfig(configuration);
          setRecordId(configuration.id);
          return;
        }

        setDraft(initialSiteConfiguration);
        setSavedConfig(null);
        setRecordId(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar o site.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSiteConfiguration();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<Field extends keyof SiteConfiguration>(
    field: Field,
    value: SiteConfiguration[Field]
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value
    }));
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      const saved = await siteRepository.saveSiteConfiguration(draft, recordId);
      setDraft(saved);
      setSavedConfig(saved);
      setRecordId(saved.id);
      setSuccessMessage('Configuracoes do site salvas no Supabase.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar o site.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Site"
          description="Configure sua página pública de vendas e atendimento."
          badge={draft.isPublished ? 'Publicado' : 'Rascunho'}
        />
        <Button
          className="w-full sm:w-auto sm:shrink-0"
          disabled={isLoading || isSaving}
          form="site-configuration-form"
          type="submit"
        >
          <Save size={16} aria-hidden="true" />
          {isSaving ? 'Salvando' : 'Salvar'}
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink-600">
          Carregando configuracoes do site...
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.85fr)]">
        <form id="site-configuration-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-4">
            {siteSections.map((section) => (
              <button
                className={cn(
                  'rounded-lg border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700',
                  activeSection === section.id
                    ? 'border-brand-200 bg-brand-50 text-brand-900'
                    : 'border-slate-200 bg-white text-ink-700 hover:border-slate-300 hover:bg-slate-50'
                )}
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
              >
                <span className="text-sm font-semibold">{section.title}</span>
                <span className="mt-2 block text-xs leading-5 text-ink-500">
                  {section.description}
                </span>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink-900">
                  {siteSections.find((section) => section.id === activeSection)?.title}
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Dados carregados e salvos no Supabase com escopo do usuario autenticado.
                </p>
              </div>
              {hasUnsavedChanges ? (
                <Badge tone="amber">Alteracoes locais</Badge>
              ) : (
                <Badge tone="green">Salvo</Badge>
              )}
            </CardHeader>
            <CardContent>
              {activeSection === 'identity' ? (
                <div className="grid gap-4">
                  <TextField
                    label="Nome da agencia"
                    name="agencyName"
                    value={draft.agencyName}
                    disabled={isLoading || isSaving}
                    onChange={(value) => updateField('agencyName', value)}
                  />
                  <TextField
                    label="Chamada principal"
                    name="headline"
                    value={draft.headline}
                    disabled={isLoading || isSaving}
                    onChange={(value) => updateField('headline', value)}
                  />
                  <TextAreaField
                    label="Descricao"
                    name="description"
                    value={draft.description}
                    disabled={isLoading || isSaving}
                    onChange={(value) => updateField('description', value)}
                  />
                </div>
              ) : null}

              {activeSection === 'contacts' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="WhatsApp"
                    name="whatsapp"
                    value={draft.whatsapp}
                    disabled={isLoading || isSaving}
                    onChange={(value) => updateField('whatsapp', value)}
                  />
                  <TextField
                    label="Instagram"
                    name="instagram"
                    value={draft.instagram}
                    disabled={isLoading || isSaving}
                    onChange={(value) => updateField('instagram', value)}
                  />
                </div>
              ) : null}

              {activeSection === 'visual' ? (
                <div className="grid gap-4">
                  <TextField
                    label="URL do logo"
                    name="logoUrl"
                    value={draft.logoUrl}
                    disabled={isLoading || isSaving}
                    onChange={(value) => updateField('logoUrl', value)}
                  />
                  <TextField
                    label="URL da imagem de capa"
                    name="coverImageUrl"
                    value={draft.coverImageUrl}
                    disabled={isLoading || isSaving}
                    onChange={(value) => updateField('coverImageUrl', value)}
                  />
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-ink-900" htmlFor="primaryColor">
                      Cor principal
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        className="h-10 w-14 rounded-lg border border-slate-200 bg-white p-1"
                        id="primaryColor"
                        name="primaryColor"
                        type="color"
                        value={draft.primaryColor}
                        disabled={isLoading || isSaving}
                        onChange={(event) => updateField('primaryColor', event.target.value)}
                      />
                      <input
                        className={inputClassName}
                        aria-label="Valor hexadecimal da cor principal"
                        value={draft.primaryColor}
                        disabled={isLoading || isSaving}
                        onChange={(event) => updateField('primaryColor', event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {activeSection === 'publishing' ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <input
                    className="mt-1 size-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
                    checked={draft.isPublished}
                    disabled={isLoading || isSaving}
                    name="isPublished"
                    type="checkbox"
                    onChange={(event) => updateField('isPublished', event.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">
                      Publicar pagina
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-ink-500">
                      Define se a pagina publica deve aparecer como publicada quando a rota publica
                      for conectada.
                    </span>
                  </span>
                </label>
              ) : null}
            </CardContent>
          </Card>
        </form>

        <SitePreview config={draft} savedAt={savedConfig?.updatedAt ?? null} />
      </div>
    </section>
  );
}

type TextFieldProps = {
  label: string;
  name: keyof SiteConfiguration;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function TextField({ label, name, value, disabled = false, onChange }: TextFieldProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-ink-900" htmlFor={name}>
        {label}
      </label>
      <input
        className={inputClassName}
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function TextAreaField({ label, name, value, disabled = false, onChange }: TextFieldProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-ink-900" htmlFor={name}>
        {label}
      </label>
      <textarea
        className={cn(inputClassName, 'min-h-28 resize-y py-3')}
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SitePreview({
  config,
  savedAt
}: {
  config: SiteConfiguration;
  savedAt: string | null;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Preview do site</h2>
          <p className="mt-1 text-sm text-ink-500">
            {savedAt ? `Ultimo salvamento: ${new Date(savedAt).toLocaleString('pt-BR')}` : 'Ainda nao salvo'}
          </p>
        </div>
        <Eye className="text-slate-400" size={18} aria-hidden="true" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-slate-950">
          {config.coverImageUrl ? (
            <img
              alt=""
              className="h-40 w-full object-cover"
              src={config.coverImageUrl}
            />
          ) : (
            <div
              className="flex h-40 items-center justify-center px-6 text-center text-sm font-medium text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              Imagem de capa
            </div>
          )}
        </div>
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-3">
            <div
              className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              {config.logoUrl ? (
                <img alt="" className="size-full object-cover" src={config.logoUrl} />
              ) : (
                config.agencyName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{config.agencyName}</p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-ink-500">
                {config.isPublished ? (
                  <>
                    <Check size={14} aria-hidden="true" />
                    Publicado
                  </>
                ) : (
                  <>
                    <Globe2 size={14} aria-hidden="true" />
                    Rascunho
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold leading-tight text-ink-900">{config.headline}</h3>
            <p className="mt-3 text-sm leading-6 text-ink-500">{config.description}</p>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-ink-700">
              WhatsApp: {config.whatsapp || 'Nao informado'}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-ink-700">
              Instagram: {config.instagram || 'Nao informado'}
            </div>
          </div>

          <button
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: config.primaryColor }}
            type="button"
          >
            Falar com a agencia
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

const inputClassName =
  'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-ink-500';

function toComparableConfiguration(
  configuration: SiteConfigurationRecord | null
): SiteConfiguration {
  if (!configuration) {
    return initialSiteConfiguration;
  }

  return {
    agencyName: configuration.agencyName,
    headline: configuration.headline,
    description: configuration.description,
    whatsapp: configuration.whatsapp,
    instagram: configuration.instagram,
    logoUrl: configuration.logoUrl,
    coverImageUrl: configuration.coverImageUrl,
    primaryColor: configuration.primaryColor,
    isPublished: configuration.isPublished
  };
}
