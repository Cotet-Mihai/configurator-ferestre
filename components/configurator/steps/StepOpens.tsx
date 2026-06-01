'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction } from '@/lib/configurator/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepOpens({ dispatch }: Props) {
  return (
    <BinaryChoice<boolean>
      question="Fereastra se deschide?"
      options={[
        { value: true, label: 'Da', description: 'Fereastra are mecanism de deschidere' },
        { value: false, label: 'Nu', description: 'Fereastră fixă' },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_OPENS', payload: v })}
    />
  );
}
