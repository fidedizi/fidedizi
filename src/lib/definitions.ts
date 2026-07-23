import * as z from "zod";

export const LoginFormSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }).trim(),
  password: z.string().min(1, { error: "Informe a senha." }),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const ChangePasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(6, { error: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormState =
  | {
      errors?: {
        password?: string[];
        confirmPassword?: string[];
      };
    }
  | undefined;

export const ActivateAccountFormSchema = z
  .object({
    password: z
      .string()
      .min(6, { error: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ActivateAccountFormState =
  | {
      errors?: {
        password?: string[];
        confirmPassword?: string[];
      };
      error?: string;
    }
  | undefined;

export const CashEntryFormSchema = z.object({
  type: z.enum(["DIZIMO", "OFERTA", "CAMPANHA"], {
    error: "Selecione um tipo.",
  }),
  amount: z.coerce
    .number({ error: "Informe um valor válido." })
    .positive({ error: "O valor deve ser maior que zero." }),
  campaignId: z.string().trim().optional(),
  memberId: z.string().trim().optional(),
});

export type CashEntryFormState =
  | {
      errors?: {
        type?: string[];
        amount?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const InstitutionFormSchema = z.object({
  type: z.enum(
    ["ARQUIDIOCESE", "DIOCESE", "PAROQUIA", "CAPELA", "COMUNIDADE"],
    { error: "Selecione um tipo." },
  ),
  name: z.string().trim().min(2, { error: "Informe o nome da instituição." }),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{14}$/, { error: "CNPJ deve conter 14 dígitos numéricos." }),
  parentId: z.string().trim().optional(),
});

export type InstitutionFormState =
  | {
      errors?: {
        type?: string[];
        name?: string[];
        cnpj?: string[];
        parentId?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const SubUnitFormSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome." }),
  cnpj: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d{14}$/, { error: "CNPJ deve conter 14 dígitos numéricos." }),
    ),
  type: z.enum(["CAPELA", "COMUNIDADE"], { error: "Selecione um tipo." }),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z
    .email({ error: "E-mail inválido." })
    .trim()
    .optional()
    .or(z.literal("")),
  status: z.enum(
    ["PENDING_ONBOARDING", "ACTIVE", "SUSPENDED", "CANCELLED"],
    { error: "Selecione um status." },
  ),
});

export type SubUnitFormState =
  | {
      errors?: {
        name?: string[];
        cnpj?: string[];
        type?: string[];
        email?: string[];
        status?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const CreateAdminFormSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome." }),
  email: z.email({ error: "Informe um e-mail válido." }).trim(),
});

export type CreateAdminFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const CreateMasterUserFormSchema = z
  .object({
    name: z.string().trim().min(2, { error: "Informe o nome." }),
    email: z.email({ error: "Informe um e-mail válido." }).trim(),
    scope: z.enum(["MASTER", "DIOCESE", "PAROQUIA"], {
      error: "Selecione o tipo de acesso.",
    }),
    institutionId: z.string().trim().optional(),
  })
  .refine((data) => data.scope === "MASTER" || !!data.institutionId, {
    error: "Selecione a instituição.",
    path: ["institutionId"],
  });

export type CreateMasterUserFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        scope?: string[];
        institutionId?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const SplitConfigFormSchema = z.object({
  institutionId: z
    .string()
    .trim()
    .min(1, { error: "Selecione uma instituição." }),
  commissionRate: z.coerce
    .number({ error: "Informe uma taxa válida." })
    .min(0, { error: "A taxa não pode ser negativa." })
    .max(100, { error: "A taxa não pode passar de 100%." }),
});

export type SplitConfigFormState =
  | {
      errors?: {
        institutionId?: string[];
        commissionRate?: string[];
      };
      message?: string;
    }
  | undefined;

export const ReceiverFormSchema = z.object({
  institutionId: z
    .string()
    .trim()
    .min(1, { error: "Selecione uma instituição." }),
  gatewayProvider: z.enum(["pagarme", "asaas"], {
    error: "Selecione o gateway.",
  }),
  externalId: z
    .string()
    .trim()
    .min(1, { error: "Informe o ID do recebedor no gateway." }),
});

export type ReceiverFormState =
  | {
      errors?: {
        institutionId?: string[];
        gatewayProvider?: string[];
        externalId?: string[];
      };
      message?: string;
    }
  | undefined;

export const MemberFormSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome." }),
  whatsapp: z.string().trim().regex(/^\d{10,11}$/, {
    error: "Informe o WhatsApp com DDD e número, somente números.",
  }),
  birthDate: z.string().trim().optional(),
  email: z
    .email({ error: "E-mail inválido." })
    .trim()
    .optional()
    .or(z.literal("")),
  address: z.string().trim().optional(),
  donationMethod: z.enum(["AVULSO", "RECORRENTE"], {
    error: "Selecione o método de doação.",
  }),
  isActiveTither: z.coerce.boolean().optional(),
  notes: z.string().trim().optional(),
});

export type MemberFormState =
  | {
      errors?: {
        name?: string[];
        whatsapp?: string[];
        birthDate?: string[];
        email?: string[];
        donationMethod?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const FlagFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Informe o nome da pastoral/movimento." }),
});

export type FlagFormState =
  | {
      errors?: {
        name?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const CampaignFormSchema = z
  .object({
    type: z.enum(["PADRAO", "RIFA", "PIZZA"], {
      error: "Selecione o tipo de campanha.",
    }),
    title: z.string().trim().min(2, { error: "Informe o título da campanha." }),
    description: z.string().trim().optional(),
    endsAt: z.string().trim().optional(),
    pixKey: z.string().trim().optional(),
    availableInChatbot: z.coerce.boolean().optional(),
    goalAmount: z.coerce
      .number({ error: "Informe uma meta válida." })
      .positive({ error: "A meta deve ser maior que zero." })
      .optional(),
    raffleTotalNumbers: z.coerce
      .number({ error: "Informe a quantidade de números." })
      .int({ error: "A quantidade deve ser um número inteiro." })
      .positive({ error: "A quantidade deve ser maior que zero." })
      .optional(),
    raffleNumberPrice: z.coerce
      .number({ error: "Informe o valor da rifa." })
      .positive({ error: "O valor deve ser maior que zero." })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PADRAO" && !(data.goalAmount && data.goalAmount > 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Informe uma meta válida.",
        path: ["goalAmount"],
      });
    }
    if (data.type === "RIFA") {
      if (!(data.raffleTotalNumbers && data.raffleTotalNumbers > 0)) {
        ctx.addIssue({
          code: "custom",
          message: "Informe a quantidade de números.",
          path: ["raffleTotalNumbers"],
        });
      }
      if (!(data.raffleNumberPrice && data.raffleNumberPrice > 0)) {
        ctx.addIssue({
          code: "custom",
          message: "Informe o valor da rifa.",
          path: ["raffleNumberPrice"],
        });
      }
    }
  });

export type CampaignFormState =
  | {
      errors?: {
        type?: string[];
        title?: string[];
        description?: string[];
        goalAmount?: string[];
        endsAt?: string[];
        pixKey?: string[];
        availableInChatbot?: string[];
        raffleTotalNumbers?: string[];
        raffleNumberPrice?: string[];
        flavors?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const CampaignEditFormSchema = z.object({
  title: z.string().trim().min(2, { error: "Informe o título da campanha." }),
  description: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
  pixKey: z.string().trim().optional(),
  availableInChatbot: z.coerce.boolean().optional(),
  goalAmount: z.coerce
    .number({ error: "Informe uma meta válida." })
    .positive({ error: "A meta deve ser maior que zero." })
    .optional(),
});

export const RaffleConfigFormSchema = z.object({
  raffleTotalNumbers: z.coerce
    .number({ error: "Informe a quantidade de números." })
    .int({ error: "A quantidade deve ser um número inteiro." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  raffleNumberPrice: z.coerce
    .number({ error: "Informe o valor da rifa." })
    .positive({ error: "O valor deve ser maior que zero." }),
});

export type RaffleConfigFormState =
  | {
      errors?: {
        raffleTotalNumbers?: string[];
        raffleNumberPrice?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const SellRaffleNumbersFormSchema = z.object({
  buyerName: z.string().trim().min(2, { error: "Informe o nome do comprador." }),
  buyerPhone: z.string().trim().regex(/^\d{10,11}$/, {
    error: "Informe o WhatsApp com DDD e número, somente números.",
  }),
  quantity: z.coerce
    .number({ error: "Quantidade inválida." })
    .int()
    .positive({ error: "Selecione ao menos um número." }),
  paymentMethod: z.enum(["PIX", "CARTAO", "ESPECIE"], {
    error: "Selecione a forma de pagamento.",
  }),
});

export type SellRaffleNumbersFormState =
  | {
      errors?: {
        buyerName?: string[];
        buyerPhone?: string[];
        quantity?: string[];
        paymentMethod?: string[];
      };
      message?: string;
      error?: string;
      success?: boolean;
      numbers?: number[];
    }
  | undefined;

export const PizzaFlavorFormSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome do sabor." }),
  price: z.coerce
    .number({ error: "Informe o valor." })
    .positive({ error: "O valor deve ser maior que zero." }),
  stockQuantity: z.coerce
    .number({ error: "Informe a quantidade produzida." })
    .int({ error: "A quantidade deve ser um número inteiro." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
});

export type PizzaFlavorFormState =
  | {
      errors?: {
        name?: string[];
        price?: string[];
        stockQuantity?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const MassScheduleFormSchema = z.object({
  dayOfWeek: z.enum(
    ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"],
    { error: "Selecione o dia da semana." },
  ),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { error: "Informe um horário válido (HH:MM)." }),
  description: z.string().trim().optional(),
});

export type MassScheduleFormState =
  | {
      errors?: {
        dayOfWeek?: string[];
        time?: string[];
        description?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const SellPizzasFormSchema = z.object({
  buyerName: z.string().trim().min(2, { error: "Informe o nome do comprador." }),
  buyerPhone: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, {
      error: "Informe o WhatsApp com DDD e número, somente números.",
    })
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(["PIX", "CARTAO", "ESPECIE"], {
    error: "Selecione a forma de pagamento.",
  }),
});

export type SellPizzasFormState =
  | {
      errors?: {
        buyerName?: string[];
        buyerPhone?: string[];
        paymentMethod?: string[];
      };
      message?: string;
      error?: string;
      success?: boolean;
      summary?: string[];
    }
  | undefined;

const EVENT_STATUSES = ["ATIVO", "INATIVO", "ENCERRADO"] as const;

export const EventFormSchema = z.object({
  title: z.string().trim().min(2, { error: "Informe o título do evento." }),
  description: z.string().trim().optional(),
  date: z.string().trim().min(1, { error: "Informe a data." }),
  time: z.string().trim().min(1, { error: "Informe o horário." }),
  location: z.string().trim().optional(),
  adultPrice: z.coerce
    .number({ error: "Informe um preço válido." })
    .min(0, { error: "O preço não pode ser negativo." }),
  childPrice: z.coerce
    .number({ error: "Informe um preço válido." })
    .min(0, { error: "O preço não pode ser negativo." }),
  capacity: z.coerce
    .number({ error: "Informe uma capacidade válida." })
    .int({ error: "A capacidade deve ser um número inteiro." })
    .positive({ error: "A capacidade deve ser maior que zero." }),
  status: z.enum(EVENT_STATUSES, { error: "Selecione um status." }),
  availableInChatbot: z.coerce.boolean().optional(),
});

export type EventFormState =
  | {
      errors?: {
        title?: string[];
        description?: string[];
        date?: string[];
        time?: string[];
        location?: string[];
        adultPrice?: string[];
        childPrice?: string[];
        capacity?: string[];
        status?: string[];
        availableInChatbot?: string[];
      };
      message?: string;
      error?: string;
    }
  | undefined;

export const SellTicketsFormSchema = z
  .object({
    eventId: z.string().trim().min(1, { error: "Evento inválido." }),
    buyerName: z
      .string()
      .trim()
      .min(2, { error: "Informe o nome do comprador." }),
    buyerPhone: z.string().trim().optional(),
    buyerEmail: z
      .email({ error: "E-mail inválido." })
      .trim()
      .optional()
      .or(z.literal("")),
    adultCount: z.coerce
      .number({ error: "Quantidade inválida." })
      .int()
      .min(0),
    childCount: z.coerce
      .number({ error: "Quantidade inválida." })
      .int()
      .min(0),
    paymentMethod: z.enum(["PIX", "CARTAO", "ESPECIE"], {
      error: "Selecione a forma de pagamento.",
    }),
  })
  .refine((data) => data.adultCount + data.childCount > 0, {
    error: "Selecione ao menos um ingresso.",
    path: ["adultCount"],
  });

export type SellTicketsFormState =
  | {
      errors?: {
        buyerName?: string[];
        buyerEmail?: string[];
        adultCount?: string[];
        paymentMethod?: string[];
      };
      message?: string;
      success?: boolean;
      contributionId?: string;
    }
  | undefined;

export const ValidateTicketFormSchema = z.object({
  qrCode: z
    .string()
    .trim()
    .min(1, { error: "Informe ou escaneie o código do ingresso." }),
});

export type ValidateTicketFormState =
  | {
      errors?: {
        qrCode?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

const MESSAGE_TRIGGERS = [
  "WELCOME",
  "BIRTHDAY",
  "DONATION_RECEIPT",
  "CAMPAIGN",
  "GENERAL_NOTICE",
  "TITHE_REMINDER",
] as const;

export const MessageTemplateFormSchema = z.object({
  trigger: z.enum(MESSAGE_TRIGGERS, { error: "Gatilho inválido." }),
  body: z.string().trim().min(1, { error: "Informe o texto da mensagem." }),
});

export type MessageTemplateFormState =
  | {
      errors?: {
        trigger?: string[];
        body?: string[];
      };
      message?: string;
    }
  | undefined;

export const MessageScheduleFormSchema = z.object({
  trigger: z.enum(MESSAGE_TRIGGERS, { error: "Selecione um gatilho." }),
  scheduledFor: z.string().trim().optional(),
});

export type MessageScheduleFormState =
  | {
      errors?: {
        trigger?: string[];
        scheduledFor?: string[];
      };
      message?: string;
    }
  | undefined;

