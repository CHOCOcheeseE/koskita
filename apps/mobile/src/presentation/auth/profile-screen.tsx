import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { initialsOf } from '@/domain/auth/auth';
import { spacing } from '@/shared/theme/tokens';
import { Button } from '@/shared/ui/button';
import { confirmAction, ErrorPanel, InfoBar, ScreenSkeleton, useToast } from '@/shared/ui/feedback';
import { TextField } from '@/shared/ui/fields';
import { Gap, Screen, ScreenHeader, SectionDivider } from '@/shared/ui/layout';
import { Avatar } from '@/shared/ui/misc';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { profileSchema, type ProfileForm } from './forms';
import { useMe, useUpdateProfile } from './hooks';
import { useSession } from './session';

/** A3 · Profil */
export function ProfileScreen() {
  const me = useMe();
  const update = useUpdateProfile();
  const session = useSession();
  const toast = useToast();
  const form = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { name: '', campus: '' } });

  useEffect(() => {
    if (me.data) form.reset({ name: me.data.name, campus: me.data.campus ?? '' });
  }, [me.data, form]);

  const submit = form.handleSubmit((values) =>
    update.mutate(
      { name: values.name, campus: values.campus },
      {
        onSuccess: (user) => {
          form.reset({ name: user.name, campus: user.campus ?? '' });
          toast.show('Profil disimpan');
        },
      },
    ),
  );

  const logout = async () => {
    const ok = await confirmAction({ title: 'Keluar dari KosKita di HP ini?', confirmLabel: 'Keluar', destructive: true });
    if (ok) await session.signOut();
  };

  const header = <ScreenHeader title="Profil" left={{ label: '‹ Beranda', onPress: () => router.back(), accessibilityLabel: 'Kembali' }} />;

  if (me.isPending) {
    return (
      <Screen header={header}>
        <ScreenSkeleton label="Profil" rows={3} />
      </Screen>
    );
  }
  if (me.isError) {
    return (
      <Screen header={header}>
        <ErrorPanel message={errorMessage(me.error)} onRetry={() => me.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      <View style={styles.identity}>
        <Avatar initials={initialsOf(me.data.name)} />
        <View style={styles.flex}>
          <Txt variant="heading">{me.data.name}</Txt>
          <Txt variant="label" color="inkMuted">
            {me.data.email}
          </Txt>
          <Txt variant="label" color="inkMuted">
            Email tidak bisa diubah.
          </Txt>
        </View>
      </View>
      <Gap size="xl" />
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            label="Nama panggilan"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            maxLength={50}
          />
        )}
      />
      <Controller
        control={form.control}
        name="campus"
        render={({ field, fieldState }) => (
          <TextField
            label="Kampus (boleh kosong)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            maxLength={80}
          />
        )}
      />
      {update.isError ? <InfoBar message={errorMessage(update.error)} tone="unpaid" /> : null}
      <Button
        label="Simpan profil"
        onPress={submit}
        loading={update.isPending}
        disabled={!form.formState.isDirty}
      />
      <SectionDivider />
      <Button label="Keluar" variant="danger-text" onPress={logout} testID="btn-keluar" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center', marginTop: spacing.md },
});
