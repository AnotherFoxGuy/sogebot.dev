import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress,  DialogContent, Divider, Fade, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField,
} from '@mui/material';
import { Rank } from '@sogebot/backend/dest/database/entity/rank';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import {
  capitalize, cloneDeep, merge,
} from 'lodash';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect , useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import getAccessToken from '../../getAccessToken';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

const newItem = new Rank();
newItem.value = 0;
newItem.type = 'viewer';

export const RankEdit: React.FC<{
  items: Rank[]
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { translate } = useTranslation();
  const [ item, setItem ] = useState<Rank>(newItem);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const handleValueChange = useCallback(<T extends keyof Rank>(key: T, value: Rank[T]) => {
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
      const it = props.items?.find(o => o.id === id) ?? newItem;
      setItem(it);
    } else {
      setItem(newItem);
    }
    setLoading(false);
    reset();
  }, [id, props.items, reset]);

  useEffect(() => {
    if (!loading && item) {
      const toCheck = new Rank();
      merge(toCheck, item);
      console.log('Validating', toCheck);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, setErrors]);

  const handleClose = () => {
    navigate('/manage/ranks');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(JSON.parse(sessionStorage.server))}/api/systems/ranks`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Rank saved.', { variant: 'success' });
        navigate(`/manage/ranks/edit/${response.data.data.id}`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

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
          <TextField
            {...propsError('value')}
            variant="filled"
            value={item?.value ?? 0}
            required
            type="number"
            label={capitalize(translate('responses.variable.value'))}
            fullWidth
            onChange={(event) => handleValueChange('value', Number(event.target.value))}
          />
          <TextField
            {...propsError('rank')}
            variant="filled"
            value={item?.rank ?? ''}
            required
            label={capitalize(translate('rank'))}
            fullWidth
            onChange={(event) => handleValueChange('rank', event.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel variant='filled' id="poll-options-label">{capitalize(translate('type'))}</InputLabel>
            <Select
              variant='filled'
              labelId="poll-options-label"
              value={item?.type ?? 'viewer'}
              label={capitalize(translate('type'))}
              onChange={(event) => handleValueChange('type', event.target.value as any)}
            >
              <MenuItem value='viewer'>Watch Time</MenuItem>
              <MenuItem value='subscriber'>Subscriber months</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item/>
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