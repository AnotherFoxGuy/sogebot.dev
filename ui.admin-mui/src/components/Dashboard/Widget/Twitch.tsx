import { UnfoldLessTwoTone, UnfoldMoreTwoTone } from '@mui/icons-material';
import { TabContext, TabList } from '@mui/lab';
import {
  Box, Card, IconButton, Stack, Tab, Typography,
} from '@mui/material';
import React from 'react';
import { useIntervalWhen, useLocalstorageState } from 'rooks';

import { getSocket } from '../../../helpers/socket';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useTranslation } from '../../../hooks/useTranslation';
import theme from '../../../theme';
import { classes } from '../../styles';

export const DashboardWidgetTwitch: React.FC = () => {
  const { translate } = useTranslation();

  const [value, setValue] = React.useState('1');
  const [timestamp, setTimestamp] = React.useState(Date.now());
  const [room, setRoom] = React.useState('');
  const { isStreamOnline } = useAppSelector(state => state.page);
  const [ unfold, setUnfold ] = useLocalstorageState('chat_unfold', true);

  const [height, setHeight] = React.useState(0);
  const ref = React.createRef<HTMLDivElement>();

  React.useEffect(() => {
    setTimestamp(Date.now());
  }, [ value ]);

  React.useEffect(() => {
    if (isStreamOnline) {
      setTimeout(() => {
        setTimestamp(Date.now());
      }, 60000 * 10);
    }
  }, [ isStreamOnline ]);

  React.useEffect(() => {
    getSocket('/widgets/chat').emit('room', (err, val) => {
      if (err) {
        return console.error(err);
      }
      setRoom(val);
    });
  }, []);

  useIntervalWhen(() => {
    if (ref.current) {
      const bodyRect = document.body.getBoundingClientRect();
      const elemRect = ref.current.getBoundingClientRect();
      const offset   = elemRect.top - bodyRect.top;
      setHeight(window.innerHeight - offset - 3);
    }
  }, 1000, true, true);

  const videoUrl = React.useMemo(() => {
    return `${window.location.protocol}//player.twitch.tv/?channel=${room}&autoplay=true&muted=true&parent=${window.location.hostname}`;
  }, [room]);

  const chatUrl = React.useMemo(() => {
    return 'https://twitch.tv/embed/'
      + room
      + '/chat'
      + '?darkpopout'
      + '&parent=' + window.location.hostname;
  }, [room]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Card variant="outlined" sx={{ height: height + 'px' }} ref={ref}>
      <TabContext value={value}>
        <Box sx={{
          borderBottom:    1,
          borderColor:     'divider',
          backgroundColor: theme.palette.grey[900],
          height:          '48px',
        }}>
          <Stack direction="row" alignItems={'center'} sx={{ display: unfold ? undefined : 'none' }}>
            <Box width={'100%'} height={48}>
              <TabList onChange={handleChange} aria-label="lab API tabs example">
                <Tab label={translate('widget-title-chat')} value="1" />
                <Tab label={translate('widget-title-monitor')} value="2" />
              </TabList>
            </Box>
            <IconButton onClick={() => setUnfold(false)}>
              <UnfoldLessTwoTone/>
            </IconButton>
          </Stack>
          <IconButton onClick={() => setUnfold(true)} sx={{
            display: !unfold ? undefined : 'none', mt: 0.5,
          }}>
            <UnfoldMoreTwoTone/>
          </IconButton>
        </Box>
        <Box sx={{
          position:        'relative',
          height:          'calc(100% - 48px);',
          display:         !unfold ? undefined : 'none',
          textOrientation: 'mixed',
          writingMode:     'vertical-rl',
          margin:          '7px',
        }}>
          <Typography variant='button' sx={{ p: 1 }}>
          Chat / Monitor
          </Typography>
        </Box>
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);',
        }}>
          <Box sx={{
            ...(value === '1' ? classes.showTab : classes.hideTab), height: '100%', width: '100%', display: unfold ? undefined : 'none',
          }}>
            <iframe
              frameBorder="0"
              scrolling="no"
              src={chatUrl}
              width="100%"
              height="100%"
            />
          </Box>
          <Box key={`twitch-monitor-${timestamp}`} sx={{
            ...(value === '2' ? classes.showTab : classes.hideTab), height: '100%', width: '100%',
          }}>
            <iframe
              frameBorder="0"
              scrolling="no"
              src={videoUrl}
              width="100%"
              height="100%"
            />
          </Box>
        </Box>
      </TabContext>
    </Card>
  );
};
