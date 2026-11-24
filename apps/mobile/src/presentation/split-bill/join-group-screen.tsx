import { router } from 'expo-router';
import { useState } from 'react';

import { hasAmbiguousInviteChars } from '@/domain/split-bill/split-bill';
import { Button } from '@/shared/ui/button';
import { InfoBar, useToast } from '@/shared/ui/feedback';
import { CodeInput } from '@/shared/ui/fields';
import { Screen, ScreenHeader } from '@/shared/ui/layout';

import { errorMessage } from '../shared/error-messages';
import { useJoinGroup } from './hooks';

/** P3 · Gabung grup pakai kode 6 karakter. */
export function JoinGroupScreen() {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | undefined>();
  const join = useJoinGroup();
  const toast = useToast();

  const submit = () => {
    if (code.length !== 6) {
      setLocalError('Kode grup terdiri dari 6 karakter');
      return;
    }
    setLocalError(undefined);
    join.mutate(code, {
      onSuccess: (group) => {
        toast.show(`Kamu bergabung ke ${group.name}`);
        router.replace({ pathname: '/grup/[id]', params: { id: group.id } });
      },
    });
  };

  return (
    <Screen header={<ScreenHeader title="Gabung grup" left={{ label: 'Batal', onPress: () => router.back() }} />}>
      <CodeInput
        value={code}
        onChange={(v) => {
          setCode(v);
          setLocalError(undefined);
        }}
        autoFocus
        error={localError}
        helper={hasAmbiguousInviteChars(code) ? 'Kode tidak memakai huruf O, I atau angka 0, 1' : undefined}
      />
      {join.isError ? <InfoBar message={errorMessage(join.error)} tone="unpaid" /> : null}
      <Button label="Gabung" onPress={submit} loading={join.isPending} loadingLabel="Bergabung…" />
    </Screen>
  );
}
