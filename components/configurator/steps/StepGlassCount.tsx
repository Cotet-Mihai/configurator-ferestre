'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction, GlassCount } from '@/lib/configurator/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepGlassCount({ dispatch }: Props) {
  return (
    <BinaryChoice<GlassCount>
      question="Câte geamuri are fereastra?"
      options={[
        { value: 1, label: '1 geam' },
        { value: 2, label: '2 geamuri' },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_GLASS_COUNT', payload: v })}
    />
  );
}
