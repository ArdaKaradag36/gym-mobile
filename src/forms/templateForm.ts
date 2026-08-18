import type { MealType } from '../types/database';
import { emptyFoodRow, emptyWorkoutRow, type FoodRowForm, type WorkoutRowForm } from './studentDayAssignment';

export type WorkoutTemplateForm = {
  name: string;
  muscle_group: string;
  items: WorkoutRowForm[];
};

export type DietTemplateForm = {
  name: string;
  meals: Array<{
    meal_type: MealType;
    foods: FoodRowForm[];
  }>;
};

export function emptyWorkoutTemplateForm(): WorkoutTemplateForm {
  return {
    name: '',
    muscle_group: 'push',
    items: [emptyWorkoutRow()],
  };
}

export function emptyDietTemplateForm(): DietTemplateForm {
  return {
    name: '',
    meals: [
      { meal_type: 'breakfast', foods: [emptyFoodRow()] },
      { meal_type: 'lunch', foods: [emptyFoodRow()] },
      { meal_type: 'dinner', foods: [emptyFoodRow()] },
      { meal_type: 'snack', foods: [emptyFoodRow()] },
    ],
  };
}
