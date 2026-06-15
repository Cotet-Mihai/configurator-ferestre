'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction } from '@/lib/configurator/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepOscilo({ dispatch }: Props) {
  return (
    <BinaryChoice<boolean>
      question="Deschidere oscilobatantă?"
      options={[
        {
          value: true,
          label: 'Da — oscilobatant',
          description: 'Se deschide lateral și basculează',
        },
        {
          value: false,
          label: 'Nu — deschidere simplă',
          description: 'Se deschide doar lateral',
        },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_OSCILO', payload: v })}
    />
  );
}
