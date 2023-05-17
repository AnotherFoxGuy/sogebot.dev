import { Button, Divider } from '@mui/material';
import { Stats } from '@sogebot/backend/dest/database/entity/overlay';
import { random } from 'lodash';
import React from 'react';

import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { statsUpdate } from '../../../store/overlaySlice';

type Props = {
  model: Stats;
  onUpdate: (value: Stats) => void;
};

export const StatsSettings: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const test = () => dispatch(statsUpdate({
    bits:        random(0, 999999),
    subscribers: random(0, 10000),
    followers:   random(0, 999999),
    viewers:     random(0, 50000),
    uptime:      `${random(0, 1)}${random(0, 9)}:${random(0, 5)}${random(0, 9)}:${random(0, 5)}${random(0, 9)}`,
  }));
  return <>
    <Divider/>

    <Button sx={{ py: 1.5 }} fullWidth onClick={test} variant='contained'>Test</Button>

    <Divider/>
  </>;
};