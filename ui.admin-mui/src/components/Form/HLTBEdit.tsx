import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Box, Button, CircularProgress,  DialogContent, Divider, Fade, FormLabel, Grid, Slider, Stack, TextField, Typography,
} from '@mui/material';
import { HowLongToBeatGame } from '@sogebot/backend/dest/database/entity/howLongToBeatGame';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import {
  capitalize,
  cloneDeep,
  merge,
} from 'lodash';
import debounce from 'lodash/debounce';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect, useMemo,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';

import { HOUR, MINUTE } from '../../constants';
import getAccessToken from '../../getAccessToken';
import { dayjs } from '../../helpers/dayjsHelper';
import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

export const HLTBEdit: React.FC<{
  items: HowLongToBeatGame[]
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { translate } = useTranslation();
  const [ item, setItem ] = useState<HowLongToBeatGame>(new HowLongToBeatGame({
    game:   '',
    offset: 0,
  }));
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const handleValueChange = useCallback(<T extends keyof HowLongToBeatGame>(key: T, value: HowLongToBeatGame[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  }, [item]);

  useEffect(() => {
    setLoading(true);
    if (id) {
      const it = props.items?.find(o => o.id === id) ?? new HowLongToBeatGame({
        id:     v4(),
        game:   '',
        offset: 0,
      });
      setItem(it);
      setLastValidGame(it.game);
      setInputValue(it.game);
    } else {
      setLastValidGame('');
      setInputValue('');
      setItem(new HowLongToBeatGame({
        id:     v4(),
        game:   '',
        offset: 0,
      }));
    }
    setLoading(false);
    reset();
  }, [id, props.items, reset]);

  useEffect(() => {
    if (!loading && item) {
      const toCheck = new HowLongToBeatGame();
      merge(toCheck, item);
      console.log('Validating', toCheck);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, setErrors]);

  const handleClose = () => {
    navigate('/manage/howlongtobeat');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(sessionStorage.server)}/api/systems/hltb/${item.id}`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        enqueueSnackbar('Game saved.', { variant: 'success' });
        navigate(`/manage/howlongtobeat/`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  function calculateValue(value: number) {
    return 2 ** value;
  }

  function valueLabelFormat(value: number) {
    return (value > 0 ? ' +' : '') + dayjs.duration(value).format('H[h] m[m]').replace('0h', '').replace('-', '- ');
  }

  const marks = [
    {
      value: 0,
      label: 'no offset',
    },
    {
      value: -1 * HOUR,
      label: '- 1 hour',
    },
    {
      value: HOUR,
      label: '1 hour',
    },
    {
      value: -2 * HOUR,
      label: '- 2 hours',
    },
    {
      value: 2 * HOUR,
      label: '2 hours',
    },
    {
      value: -3 * HOUR,
      label: '- 3 hours',
    },
    {
      value: 3 * HOUR,
      label: '3 hours',
    },
    {
      value: -4 * HOUR,
      label: '- 4 hours',
    },
    {
      value: 4 * HOUR,
      label: '4 hours',
    },
  ];

  const [ lastValidGame, setLastValidGame ] = useState('');
  const [ inputValue, setInputValue ] = useState('');
  const [ options, setOptions ] = useState<string[]>([]);
  const [ isSearching, setIsSearching ] = useState(false);
  const cachedSearch = useMemo(() => new Map<string, string[]>(), []);

  const eventHandler = (event: any, newValue: string) => {
    setInputValue(newValue);
  };

  const debouncedEventHandler = useMemo(
    () => debounce(eventHandler, 300)
    , []);

  const handleBlur = () => {
    // select last valid game
    if (!options.includes(inputValue)) {
      setInputValue(lastValidGame);
      handleValueChange('game', lastValidGame);
    } else {
      setLastValidGame(inputValue);
      handleValueChange('game', inputValue);
    }
  };

  useEffect(() => {
    if (inputValue && inputValue.length > 0) {
      setIsSearching(true);
      setOptions([]);

      // check if we have this search cached
      if (cachedSearch.has(inputValue)) {
        console.log('Using cached search for ' + inputValue);
        setOptions(cachedSearch.get(inputValue) ?? []);
        setIsSearching(false);
      } else {
        console.log('Searching for ' + inputValue);
        getSocket('/').emit('getGameFromTwitch', inputValue, (values) => {
          cachedSearch.set(inputValue, values.sort());
          setOptions(values.sort());
          setIsSearching(false);
        });
      }
    }
  }, [inputValue, cachedSearch]);

  return(<>
    {loading
      && <Grid
        sx={{ pt: 10 }}
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      ><CircularProgress color="inherit" /></Grid>}
    <Fade in={!loading}>
      <DialogContent>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <Autocomplete
            readOnly={!!id}
            selectOnFocus
            onBlur={handleBlur}
            handleHomeEndKeys
            disableClearable
            onInputChange={debouncedEventHandler}
            filterOptions={(x) => x}
            options={options}
            loading={isSearching}
            value={inputValue}
            sx={{ paddingBottom: '1em' }}
            renderInput={(params) =>
              <TextField
                label={capitalize(translate('systems.howlongtobeat.game'))}
                variant="filled"
                placeholder='Start typing to Search game on Twitch'
                {...params}
                {...propsError('game')}
                disabled={!!id}/>
            }
          />

          <FormLabel>Offset</FormLabel>
          <Stack direction={'row'} spacing={2}>
            <Box sx={{
              padding: '0 30px', width: '100%',
            }}>
              <Slider
                value={item.offset}
                min={- 4 * HOUR}
                step={10 * MINUTE}
                max={4 * HOUR}
                scale={calculateValue}
                valueLabelFormat={valueLabelFormat}
                onChange={(_ev, newValue) => handleValueChange('offset', Number(newValue))}
                valueLabelDisplay="off"
                size='small'
                marks={marks}
              />
            </Box>
            <Typography sx={{ minWidth: '75px' }}>{valueLabelFormat(item.offset)}</Typography>
          </Stack>
        </Box>
      </DialogContent>
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item></Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </>);
};