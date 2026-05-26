import { useReducer, useCallback, useMemo } from "react";

export type Selections = Record<string, string[]>;

type Action =
  | { type: "TOGGLE_OPTION"; groupId: string; optionId: string; maxSelect: number }
  | { type: "SET_OPTION"; groupId: string; optionId: string }
  | { type: "RESET" };

function reducer(state: Selections, action: Action): Selections {
  switch (action.type) {
    case "TOGGLE_OPTION": {
      const current = state[action.groupId] ?? [];
      const exists = current.includes(action.optionId);
      if (exists) {
        return { ...state, [action.groupId]: current.filter((id) => id !== action.optionId) };
      }
      if (current.length >= action.maxSelect) {
        return { ...state, [action.groupId]: [...current.slice(1), action.optionId] };
      }
      return { ...state, [action.groupId]: [...current, action.optionId] };
    }
    case "SET_OPTION":
      return { ...state, [action.groupId]: [action.optionId] };
    case "RESET":
      return {};
    default:
      return state;
  }
}

interface OptionGroupData {
  id: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: Array<{ id: string; priceModifier: number; isAvailable: boolean }>;
}

export function useProductConfigurator() {
  const [selections, dispatch] = useReducer(reducer, {});

  const toggleOption = useCallback(
    (groupId: string, optionId: string, maxSelect: number) => {
      dispatch({ type: "TOGGLE_OPTION", groupId, optionId, maxSelect });
    },
    [],
  );

  const setOption = useCallback((groupId: string, optionId: string) => {
    dispatch({ type: "SET_OPTION", groupId, optionId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const computeTotalPrice = useCallback(
    (basePrice: number, optionGroups: OptionGroupData[]) => {
      let total = basePrice;
      for (const group of optionGroups) {
        const selectedIds = selections[group.id] ?? [];
        for (const id of selectedIds) {
          const option = group.options.find((o) => o.id === id);
          if (option) total += option.priceModifier;
        }
      }
      return total;
    },
    [selections],
  );

  const validate = useCallback(
    (optionGroups: OptionGroupData[]): string[] => {
      const errors: string[] = [];
      for (const group of optionGroups) {
        const count = (selections[group.id] ?? []).length;
        if (group.isRequired && count === 0) {
          errors.push(`"${group.id}" es obligatorio`);
        }
        if (count < group.minSelect) {
          errors.push(`Selecciona al menos ${group.minSelect}`);
        }
        if (count > group.maxSelect) {
          errors.push(`Máximo ${group.maxSelect} selecciones`);
        }
      }
      return errors;
    },
    [selections],
  );

  const isValid = useCallback(
    (optionGroups: OptionGroupData[]) => validate(optionGroups).length === 0,
    [validate],
  );

  return { selections, toggleOption, setOption, reset, computeTotalPrice, validate, isValid };
}
