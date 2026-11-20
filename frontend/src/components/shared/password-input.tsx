'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

export function PasswordInput({ ...props }: ComponentProps<'input'>) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup className="h-11">
      <InputGroupInput {...props} className="h-full" type={visible ? 'text' : 'password'} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
