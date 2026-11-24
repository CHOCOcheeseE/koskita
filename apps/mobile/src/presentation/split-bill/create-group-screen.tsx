import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { GroupDetail } from '@/domain/split-bill/split-bill';
import { Button } from '@/shared/ui/button';
import { InfoBar } from '@/shared/ui/feedback';
import { TextField } from '@/shared/ui/fields';
import { Gap, Screen, ScreenHeader } from '@/shared/ui/layout';
import { InviteCodeCard } from '@/shared/ui/misc';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { useCreateGroup } from './hooks';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { error: 'Nama grup minimal 3 karakter' })
    .max(40, { error: 'Nama grup maksimal 40 karakter' }),
});
type Form = z.infer<typeof schema>;

/** P2 · Buat grup, lalu tampilkan kode undangan. */
export function CreateGroupScreen() {
  const create = useCreateGroup();
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { name: '' } });
  const submit = form.handleSubmit((values) => create.mutate(values.name));

  if (create.data) return <GroupCreated group={create.data} />;

  return (
    <Screen header={<ScreenHeader title="Buat grup" left={{ label: 'Batal', onPress: () => router.back() }} />}>
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            label="Nama grup"
            placeholder="Kos Pak Darto"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            maxLength={40}
            showCounter
            autoFocus
          />
        )}
      />
      {create.isError ? <InfoBar message={errorMessage(create.error)} tone="unpaid" /> : null}
      <Button label="Buat grup" onPress={submit} loading={create.isPending} loadingLabel="Membuat…" />
    </Screen>
  );
}

function GroupCreated({ group }: { group: GroupDetail }) {
  return (
    <Screen header={<ScreenHeader left={{ label: 'Tutup', onPress: () => router.back() }} />}>
      <Txt variant="title" accessibilityRole="header">
        Grup dibuat
      </Txt>
      <Txt variant="body" color="inkMuted">
        Bagikan kode ini ke teman kos
      </Txt>
      <Gap />
      <InviteCodeCard code={group.inviteCode} groupName={group.name} />
      <Gap />
      <Button
        label="Buka grup"
        onPress={() => router.replace({ pathname: '/grup/[id]', params: { id: group.id } })}
      />
    </Screen>
  );
}
