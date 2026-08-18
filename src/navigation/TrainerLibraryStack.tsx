import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LibraryScreen } from '../screens/trainer/LibraryScreen';
import { TemplateEditorScreen } from '../screens/trainer/TemplateEditorScreen';

export type TrainerLibraryStackParamList = {
  LibraryHome: undefined;
  TemplateEditor: {
    kind: 'workout' | 'diet';
    templateId?: string;
  };
};

const Stack = createNativeStackNavigator<TrainerLibraryStackParamList>();

export function TrainerLibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LibraryHome" component={LibraryScreen} />
      <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} />
    </Stack.Navigator>
  );
}
