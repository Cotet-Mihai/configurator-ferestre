'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction, OpenDirection } from '@/lib/configurator/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepDirection({ dispatch }: Props) {
  return (
    <BinaryChoice<OpenDirection>
      question="În ce direcție se deschide fereastra?"
      options={[
        {
          value: 'left',
          label: 'Spre stânga',
          description: 'Mânerul pe partea stângă',
        },
        {
          value: 'right',
          label: 'Spre dreapta',
          description: 'Mânerul pe partea dreaptă',
        },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_DIRECTION', payload: v })}
    />
  );
}
