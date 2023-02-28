import {
  Box, Fade, Typography,
} from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';

console.group('UI VERSION');
console.log(process.env.REACT_APP_VERSION);
console.groupEnd();

export const Version: React.FC = () => {
  const { connectedToServer } = useSelector((s: any) => s.loader);

  return <Fade in={!connectedToServer} unmountOnExit mountOnEnter>
    <Box sx={{
      position: 'absolute', left: 0, bottom: 0,
    }}>
      <Typography component='span' sx={{ fontWeight: 'bold' }}>UI version:</Typography>
      {' '}
      <Typography component='span'>{process.env.REACT_APP_VERSION ?? 'unknown'}</Typography>
    </Box>
  </Fade>;
};