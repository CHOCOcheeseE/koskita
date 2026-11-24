import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { container } from '@/data/container';
import { hasCode } from '@/domain/shared/errors';
import { Button } from '@/shared/ui/button';
import { InfoBar } from '@/shared/ui/feedback';
import { TextField } from '@/shared/ui/fields';
import { Screen, ScreenHeader } from '@/shared/ui/layout';

import { errorMessage, fieldErrors } from '../shared/error-messages';
import { registerSchema, type RegisterForm } from './forms';
import { useSession } from './session';

/** A2 · Daftar */
export function RegisterScreen() {
  const session = useSession();
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const register = useMutation({
    mutationFn: (values: RegisterForm) => container.auth.register(values),
    onSuccess: (user) => {
      session.signedIn(user);
      router.replace('/');
    },
    onError: (error) => {
      if (hasCode(error, 'EMAIL_TAKEN')) form.setError('email', { message: 'Email sudah dipakai' }, { shouldFocus: true });
      for (const [field, message] of Object.entries(fieldErrors(error))) {
        if (field === 'name' || field === 'email' || field === 'password') form.setError(field, { message });
      }
    },
  });
  const submit = form.handleSubmit((values) => register.mutate(values));
  const bannerError =
    register.isError && !hasCode(register.error, 'EMAIL_TAKEN', 'VALIDATION_FAILED') ? errorMessage(register.error) : null;

  return (
    <Screen
      testID="screen-daftar"
      header={<ScreenHeader large title="Bikin akun" left={{ label: '‹ Masuk', onPress: () => router.back(), accessibilityLabel: 'Kembali ke Masuk' }} />}
    >
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            label="Nama panggilan"
            helper="Dipakai teman kos di grup."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            autoComplete="name"
            maxLength={50}
          />
        )}
      />
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
          />
        )}
      />
      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            label="Kata sandi"
            helper="Minimal 8 karakter."
            password
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            autoCapitalize="none"
            autoComplete="new-password"
            maxLength={72}
            onSubmitEditing={() => submit()}
          />
        )}
      />
      {bannerError ? <InfoBar message={bannerError} tone="unpaid" /> : null}
      <Button label="Daftar" loading={register.isPending} loadingLabel="Mendaftar…" onPress={submit} />
    </Screen>
  );
}
