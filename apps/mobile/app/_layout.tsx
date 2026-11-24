import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isAppError } from '@/domain/shared/errors';
import { SessionProvider, useSession } from '@/presentation/auth/session';
import { useColors } from '@/shared/theme/use-theme';
import { ToastProvider } from '@/shared/ui/feedback';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Status terbaru dimuat ulang saat aplikasi kembali aktif (tanpa push notification di MVP).
AppState.addEventListener('change', (state) => {
  if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // Error 4xx tidak diulang otomatis; error jaringan diulang sekali.
        retry: (count, error) => !(isAppError(error) && error.status >= 400 && error.status < 500) && count < 1,
      },
    },
  });
}

function RootNavigator() {
  const { status } = useSession();
  const colors = useColors();
  const scheme = useColorScheme();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => undefined);
  }, [status]);

  if (status === 'loading') return null;
  const signedIn = status === 'signed-in';
  const modal = { presentation: 'modal' as const };

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profil" />
          <Stack.Screen name="transaksi/baru" options={modal} />
          <Stack.Screen name="transaksi/[id]" options={modal} />
          <Stack.Screen name="anggaran" options={modal} />
          <Stack.Screen name="ringkasan/[month]" />
          <Stack.Screen name="grup/baru" options={modal} />
          <Stack.Screen name="grup/gabung" options={modal} />
          <Stack.Screen name="grup/[id]/index" />
          <Stack.Screen name="grup/[id]/tagihan-baru" options={modal} />
          <Stack.Screen name="tagihan/[id]" />
          <Stack.Screen name="jadwal/baru" options={modal} />
          <Stack.Screen name="jadwal/[id]" options={modal} />
          <Stack.Screen name="tugas/baru" options={modal} />
          <Stack.Screen name="tugas/[id]" options={modal} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
