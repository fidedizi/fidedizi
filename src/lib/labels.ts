export const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  ARQUIDIOCESE: "Arquidiocese",
  DIOCESE: "Diocese",
  PAROQUIA: "Paróquia",
  CAPELA: "Capela",
  COMUNIDADE: "Comunidade",
};

export const INSTITUTION_STATUS_LABELS: Record<string, string> = {
  PENDING_ONBOARDING: "Aguardando onboarding",
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  CANCELLED: "Cancelada",
};

export const RECEIVER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

export const GATEWAY_PROVIDER_LABELS: Record<string, string> = {
  pagarme: "Pagar.me",
  asaas: "Asaas",
};

export const DONATION_METHOD_LABELS: Record<string, string> = {
  AVULSO: "Avulso",
  RECORRENTE: "Recorrente",
};

export const MESSAGE_TRIGGER_LABELS: Record<string, string> = {
  WELCOME: "Boas-vindas (novo cadastro)",
  BIRTHDAY: "Aniversário",
  DONATION_RECEIPT: "Recibo de Oferta",
  CAMPAIGN: "Campanha",
  GENERAL_NOTICE: "Aviso geral",
  TITHE_REMINDER: "Lembrete de Dízimo",
  EVENTO: "Confirmação de Ingressos",
  TITHE_RECEIPT: "Recibo de Dízimo",
};

export const MESSAGE_SCHEDULE_STATUS_LABELS: Record<string, string> = {
  AWAITING_SCHEDULE: "Aguardando agendamento",
  SCHEDULED: "Agendado",
  SENT: "Enviado",
  FAILED: "Falhou",
};

export const CONTRIBUTION_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CARTAO: "Cartão",
  ESPECIE: "Dinheiro",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  ENCERRADO: "Encerrado",
};

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  ADULTO: "Adulto",
  CRIANCA: "Criança",
};

export const WEEKDAY_LABELS: Record<string, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  PADRAO: "Padrão",
  RIFA: "Rifa",
  PIZZA: "Venda de Pizza",
};

export const PERMISSION_MODULE_LABELS: Record<string, string> = {
  DASHBOARD: "Dashboard",
  AVISOS: "Personalização Mensagens",
  AGENDA: "Eventos & Festas",
  FINANCEIRO: "Financeiro & Relatórios",
  CAMPANHAS: "Campanhas",
  MEMBROS: "Membros",
  CONFIGURACOES: "Configurações & Capelas",
};

export const USER_SCOPE_LABELS: Record<string, string> = {
  MASTER: "Master",
  DIOCESE: "Diocese",
  PAROQUIA: "Paróquia",
};

type InstitutionBreadcrumbNode = {
  name: string;
  parent?: InstitutionBreadcrumbNode | null;
};

export function institutionBreadcrumb(
  institution: InstitutionBreadcrumbNode | null | undefined,
) {
  if (!institution) return "—";
  const parts: string[] = [];
  let current: InstitutionBreadcrumbNode | null | undefined = institution;
  while (current) {
    parts.unshift(current.name);
    current = current.parent;
  }
  return parts.join(" — ");
}
