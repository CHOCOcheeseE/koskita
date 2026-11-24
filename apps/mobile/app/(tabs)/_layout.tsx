import { Tabs } from 'expo-router/tabs';
import { Text, type ColorValue } from 'react-native';

import { fonts } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/use-theme';

const tabIcon = (glyph: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return (
      <Text style={{ color, fontSize: 20 }} importantForAccessibility="no" accessibilityElementsHidden>
        {glyph}
      </Text>
    );
  };

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.lineSoft, minHeight: 60 },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 13 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Beranda', tabBarIcon: tabIcon('⌂') }} />
      <Tabs.Screen name="dompet" options={{ title: 'Dompet', tabBarIcon: tabIcon('◫') }} />
      <Tabs.Screen name="patungan" options={{ title: 'Patungan', tabBarIcon: tabIcon('⚇') }} />
      <Tabs.Screen name="kuliah" options={{ title: 'Kuliah', tabBarIcon: tabIcon('✎') }} />
    </Tabs>
  );
}
