import { Stack } from 'expo-router';

import { useColors } from '@/shared/theme/use-theme';

export const unstable_settings = { initialRouteName: 'masuk' };

export default function AuthLayout() {
  const colors = useColors();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
