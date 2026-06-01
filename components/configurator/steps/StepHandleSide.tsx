'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction, HandleSide } from '@/lib/configurator/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepHandleSide({ dispatch }: Props) {
  return (
    <BinaryChoice<HandleSide>
      question="Pe ce geam doriți mânerul?"
      options={[
        {
          value: 'left',
          label: 'Geamul din stânga',
          description: 'Mânerul pe marginea stângă',
        },
        {
          value: 'right',
          label: 'Geamul din dreapta',
          description: 'Mânerul pe marginea dreaptă',
        },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_HANDLE_SIDE', payload: v })}
    />
  );
}
