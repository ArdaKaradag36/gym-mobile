import type { Food, FoodUnitLabel } from '../types/database';
import { FOOD_UNIT_LABELS } from '../types/database';

export type Macros = {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
};

export type FoodMacroSource = Pick<
  Food,
  | 'id'
  | 'kcal_per_100g'
  | 'protein_per_100g'
  | 'carb_per_100g'
  | 'fat_per_100g'
  | 'unit_label'
  | 'grams_per_unit'
>;

export type AssignedFoodMacros = {
  food_id?: string | null;
  amount_in_grams?: number | string | null;
  amount_grams?: string | null;
  amount?: string | null;
  note?: string | null;
  foods?: FoodMacroSource | null;
};

const EMPTY: Macros = { kcal: 0, protein: 0, carb: 0, fat: 0 };

function num(match: RegExpMatchArray | null) {
  if (!match?.[1]) return 0;
  return Number(match[1].replace(',', '.')) || 0;
}

function toFinite(value: number | string | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseGrams(value?: string | number | null): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value > 0 && Number.isFinite(value) ? value : 0;
  const match = value.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  const parsed = match ? Number(match[1]) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function gramsForFood(food: AssignedFoodMacros, catalog?: FoodMacroSource[]): number {
  const formQty = parseGrams(food.amount_grams);
  if (formQty > 0) {
    return gramsFromQuantity(formQty, catalogFood(food, catalog));
  }
  const fromNumeric = parseGrams(food.amount_in_grams);
  if (fromNumeric > 0) return fromNumeric;
  return parseGrams(food.amount);
}

export function foodUnitGrams(food?: Pick<Food, 'grams_per_unit'> | null): number {
  const value = Number(food?.grams_per_unit);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function hasCountUnit(food?: Pick<Food, 'unit_label' | 'grams_per_unit'> | null): boolean {
  return foodUnitGrams(food) > 0;
}

export function foodUnitTitle(food?: Pick<Food, 'unit_label' | 'grams_per_unit'> | null): string {
  if (!hasCountUnit(food)) return 'Gramaj';
  const key = (food?.unit_label ?? 'adet') as FoodUnitLabel;
  return FOOD_UNIT_LABELS[key] ?? 'Adet';
}

export function gramsFromQuantity(
  quantity: number,
  food?: Pick<Food, 'grams_per_unit'> | null,
): number {
  if (!(quantity > 0)) return 0;
  const per = foodUnitGrams(food);
  return per > 0 ? quantity * per : quantity;
}

export function quantityFromGrams(
  grams: number,
  food?: Pick<Food, 'grams_per_unit'> | null,
): number {
  if (!(grams > 0)) return 0;
  const per = foodUnitGrams(food);
  if (!(per > 0)) return grams;
  return Math.round((grams / per) * 100) / 100;
}

export function inputQuantityFromGrams(
  grams: number | string | null | undefined,
  food?: Pick<Food, 'unit_label' | 'grams_per_unit'> | null,
): string {
  const parsed = parseGrams(grams);
  if (!(parsed > 0)) return '';
  return formatMacroNumber(quantityFromGrams(parsed, food));
}

export function formatCountAmount(
  quantity: number,
  food?: Pick<Food, 'unit_label' | 'grams_per_unit'> | null,
): string {
  if (!(quantity > 0)) return '';
  if (!hasCountUnit(food)) return `${formatMacroNumber(quantity)} g`;
  const key = food?.unit_label ?? 'adet';
  return `${formatMacroNumber(quantity)} ${key}`;
}

export function formatAssignedFoodAmount(food: {
  amount_in_grams?: number | string | null;
  amount?: string | null;
  foods?: Pick<Food, 'unit_label' | 'grams_per_unit'> | null;
}): string {
  const grams = parseGrams(food.amount_in_grams ?? food.amount);
  if (!(grams > 0)) return '';
  if (!hasCountUnit(food.foods)) return `${formatMacroNumber(grams)} g`;
  const qty = quantityFromGrams(grams, food.foods);
  return `${formatCountAmount(qty, food.foods)} · ${formatMacroNumber(grams)} g`;
}

export function amountDisplayForSave(
  quantity: number,
  food?: Pick<Food, 'unit_label' | 'grams_per_unit'> | null,
): string | null {
  const grams = gramsFromQuantity(quantity, food);
  if (!(grams > 0)) return null;
  if (hasCountUnit(food)) return formatCountAmount(quantity, food);
  return `${formatMacroNumber(grams)} g`;
}

export function parseMacros(text?: string | null): Macros | null {
  if (!text?.trim()) return null;
  const kcal = text.match(/(\d+(?:[.,]\d+)?)\s*kcal/i);
  const protein = text.match(/(\d+(?:[.,]\d+)?)\s*p\b/i);
  const carb = text.match(/(\d+(?:[.,]\d+)?)\s*c\b/i);
  const fat = text.match(/(\d+(?:[.,]\d+)?)\s*y\b/i);
  if (!kcal && !protein && !carb && !fat) return null;
  return {
    kcal: num(kcal),
    protein: num(protein),
    carb: num(carb),
    fat: num(fat),
  };
}

export function macrosFromPer100(food: FoodMacroSource, grams: number): Macros {
  if (!(grams > 0)) return EMPTY;
  const factor = grams / 100;
  return {
    kcal: toFinite(food.kcal_per_100g) * factor,
    protein: toFinite(food.protein_per_100g) * factor,
    carb: toFinite(food.carb_per_100g) * factor,
    fat: toFinite(food.fat_per_100g) * factor,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carb: a.carb + b.carb,
    fat: a.fat + b.fat,
  };
}

function catalogFood(
  food: AssignedFoodMacros,
  catalog?: FoodMacroSource[],
): FoodMacroSource | null {
  if (food.foods) return food.foods;
  if (!food.food_id || !catalog?.length) return null;
  return catalog.find((item) => item.id === food.food_id) ?? null;
}

export function macrosForFood(food: AssignedFoodMacros, catalog?: FoodMacroSource[]): Macros {
  const grams = gramsForFood(food, catalog);
  const source = catalogFood(food, catalog);
  if (source && grams > 0) return macrosFromPer100(source, grams);
  return parseMacros(food.note) ?? EMPTY;
}

export function sumFoodMacros(
  foods: AssignedFoodMacros[] | undefined,
  catalog?: FoodMacroSource[],
): Macros {
  return (foods ?? []).reduce((total, food) => addMacros(total, macrosForFood(food, catalog)), EMPTY);
}

export function sumMealFoodMacros(
  meals: Array<{ foods?: AssignedFoodMacros[] }> | undefined,
  catalog?: FoodMacroSource[],
): Macros {
  return (meals ?? []).reduce(
    (total, meal) => addMacros(total, sumFoodMacros(meal.foods, catalog)),
    EMPTY,
  );
}

export function formatMacroNumber(value: number) {
  if (!Number.isFinite(value) || value === 0) return '0';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatKcal(value: number) {
  if (!Number.isFinite(value) || value === 0) return '0';
  return String(Math.round(value));
}

export function formatGramsLabel(grams: number | string | null | undefined) {
  const parsed = parseGrams(grams);
  if (!parsed) return '';
  return `${formatMacroNumber(parsed)} g`;
}

export function formatMacroLine(macros: Macros) {
  if (!hasMacros(macros)) return '';
  return `${formatKcal(macros.kcal)} kcal · ${formatMacroNumber(macros.protein)}P · ${formatMacroNumber(macros.carb)}C · ${formatMacroNumber(macros.fat)}Y`;
}

export function hasMacros(macros: Macros) {
  return macros.kcal > 0 || macros.protein > 0 || macros.carb > 0 || macros.fat > 0;
}

export function emptyMacros(): Macros {
  return { ...EMPTY };
}
