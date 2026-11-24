import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { container } from '@/data/container';
import { hasCode } from '@/domain/shared/errors';
import { spacing } from '@/shared/theme/tokens';
import { Button } from '@/shared/ui/button';
import { InfoBar } from '@/shared/ui/feedback';
import { TextField } from '@/shared/ui/fields';
import { Gap, Screen } from '@/shared/ui/layout';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { loginSchema, type LoginForm } from './forms';
import { useSession } from './session';

/** A1 · Masuk */
export function LoginScreen() {
  const session = useSession();
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const login = useMutation({
    mutationFn: (values: LoginForm) => container.auth.login(values),
    onSuccess: (user) => {
      session.signedIn(user);
      router.replace('/');
    },
  });
  const submit = form.handleSubmit((values) => login.mutate(values));
  const bannerTone = hasCode(login.error, 'TOO_MANY_REQUESTS') ? 'pending' : 'unpaid';

  return (
    <Screen testID="screen-masuk">
      <Gap size="xxxl" />
      <Txt variant="title" accessibilityRole="header">
        KosKita
      </Txt>
      <Txt variant="body" color="inkMuted">
        Uang bulanan, patungan, dan deadline, di satu tempat.
      </Txt>
      <Gap size="xl" />
      {session.expiredNotice ? <InfoBar message="Sesi berakhir, silakan masuk lagi" /> : null}
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            testID="input-email"
          />
        )}
      />
      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            label="Kata sandi"
            password
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={() => submit()}
            testID="input-password"
          />
        )}
      />
      {login.isError ? <InfoBar message={errorMessage(login.error)} tone={bannerTone} /> : null}
      <Button label="Masuk" loading={login.isPending} loadingLabel="Masuk…" onPress={submit} testID="btn-masuk" />
      <View style={styles.footer}>
        <Txt variant="body" color="inkMuted">
          Belum punya akun?
        </Txt>
        <Button label="Daftar" variant="text" onPress={() => router.push('/daftar')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
});
