import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, Dialog, DialogContent, Divider, Fade, FormControl, Grid, InputAdornment, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import { defaultPermissions } from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import { validateOrReject } from 'class-validator';
import { cloneDeep, merge } from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useEffect } from 'react';

import { Commands } from '~/src/classes/Commands';
import { getSocket } from '~/src/helpers/socket';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

export const BotCommandEdit: React.FC<{
  items: Commands[]
}> = (props) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const { permissions } = usePermissions();
  const [ item, setItem ] = useState<Commands | null>(null);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { id } = router.query;
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, haveErrors } = useValidator();

  const handleValueChange = <T extends keyof Commands>(key: T, value: Commands[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    if (key === 'permission' && value === '') {
      update.permission = null;
    } else {
      update[key] = value;
    }
    setItem(update);
  };

  const handleSetDefaultValue = useCallback(() => {
    if (item) {
      setItem({ ...item, command: item.defaultValue });
    }
  }, [ item ]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setItem(props.items?.find(o => o.id === id) ?? null);
      setLoading(false);
    }
    reset();
  }, [router, id, props.items, editDialog, reset]);

  useEffect(() => {
    if (!loading && editDialog && item) {
      const toCheck = new Commands();
      merge(toCheck, item);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('botcommands/edit/')) {
      setEditDialog(true);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/commands/botcommands');
    }, 200);
  };

  const handleSave = useCallback(() => {
    if (!item) {
      return;
    }

    setSaving(true);
    getSocket('/core/general').emit('generic::setCoreCommand', item, () => {
      enqueueSnackbar('Bot command saved.', { variant: 'success' });
      setSaving(false);
      router.push(`/commands/botcommands/edit/${item.id}`);
    });
  }, [item, enqueueSnackbar, router]);

  return(<Dialog
    open={editDialog}
    fullWidth
    maxWidth='md'
  >
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
          sx={{ '& .MuiTextField-root': { my: 1, width: '100%' } }}
          noValidate
          autoComplete="off"
        >

          <TextField
            {...propsError('command')}
            variant="filled"
            value={item?.command || ''}
            required
            multiline
            onKeyPress={(e) => {
              e.key === 'Enter' && e.preventDefault();
            }}
            label={translate('command')}
            InputProps={{
              endAdornment:
                <Fade in={item?.command !== item?.defaultValue}>
                  <InputAdornment position="end" sx={{ transform: 'translateY(-7px)' }}>
                    <Button onClick={handleSetDefaultValue}>
                    set to default
                    </Button>
                  </InputAdornment>
                </Fade>,
            }}
            onChange={(event) => handleValueChange('command', event.target.value)}
          />

          <FormControl fullWidth variant="filled" >
            <InputLabel id="permission-select-label" shrink>{translate('permissions')}</InputLabel>
            <Select
              label={translate('permissions')}
              labelId="permission-select-label"
              displayEmpty
              onChange={(event) => handleValueChange('permission', event.target.value)}
              value={item?.permission === undefined ? defaultPermissions.VIEWERS : item.permission}
              renderValue={(selected) => {
                if (selected === null) {
                  return <em>-- unset --</em>;
                }

                return permissions?.find(o => o.id === selected)?.name;
              }}
            >
              <MenuItem value="">
                <em>-- unset --</em>
              </MenuItem>
              {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid item>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid item>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </Dialog>);
};