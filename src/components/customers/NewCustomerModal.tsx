import { X } from 'lucide-react';
import { Button } from '../ui/Button';

type NewCustomerModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function NewCustomerModal({ isOpen, onClose }: NewCustomerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 bg-slate-950/45"
        type="button"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Novo cliente</h2>
            <p className="mt-1 text-sm text-ink-500">
              Formulario visual preparado para o modelo real. Nenhum dado sera salvo ainda.
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

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <FieldPreview label="Nome" value="Ex.: Ana Souza" />
          <FieldPreview label="Email" value="cliente@email.com" />
          <FieldPreview label="Telefone" value="+55 00 00000-0000" />
          <FieldPreview label="CPF/passaporte" value="000.000.000-00 ou passaporte" />
          <FieldPreview label="Cidade" value="Cidade, UF" />
          <FieldPreview label="Tipo" value="Pessoa fisica, empresa ou VIP" />
          <FieldPreview label="Status" value="Ativo, pendente ou inativo" />
          <FieldPreview label="Observacoes" value="Preferencias e contexto do atendimento" wide />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled>Salvar depois</Button>
        </div>
      </div>
    </div>
  );
}

type FieldPreviewProps = {
  label: string;
  value: string;
  wide?: boolean;
};

function FieldPreview({ label, value, wide = false }: FieldPreviewProps) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-2 min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-ink-500">
        {value}
      </div>
    </div>
  );
}
