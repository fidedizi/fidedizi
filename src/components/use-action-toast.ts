"use client";

import { useEffect, useRef } from "react";
import { useToast } from "./toast";

type ActionState = { message?: string; error?: string } | undefined;

// Dispara um toast sempre que a action resolve com sucesso/erro. Compara a
// identidade do objeto `state` (não o texto) porque useActionState devolve
// uma nova referência a cada submissão — mesmo quando a mensagem se repete
// (ex.: cadastrar dois fiéis em sequência gera o mesmo texto de sucesso).
export function useActionToast(state: ActionState) {
  const { showToast } = useToast();
  const lastState = useRef<ActionState>(undefined);

  useEffect(() => {
    if (state && state !== lastState.current) {
      if (state.error) {
        showToast(state.error, "error");
      } else if (state.message) {
        showToast(state.message, "success");
      }
    }
    lastState.current = state;
  }, [state, showToast]);
}

// Fecha o modal automaticamente quando a action retorna sucesso — o toast já
// confirma a operação, então não é preciso manter o formulário aberto.
export function useCloseOnSuccess(state: ActionState, close: () => void) {
  const lastState = useRef<ActionState>(undefined);

  useEffect(() => {
    if (state && state !== lastState.current && state.message && !state.error) {
      close();
    }
    lastState.current = state;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
