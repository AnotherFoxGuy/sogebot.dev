import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

import { getSocket } from '../../../helpers/socket';

type UserLevel =
  | 'admin'
  | 'owner'
  | 'moderator'
  | 'twitch_vip'
  | 'regular'
  | 'subscriber'
  | 'everyone';

type CustomCommand = {
  _id:       string;
  createdAt: string; // timestamp date
  updatedAt: string; // timestamp date
  name:      string;
  message:   string;
  coolDown:  number;
  count:     number;
  userLevel: UserLevel;
};

type CustomCommandsResponse = {
  _total:   number;
  status:   number;
  commands: CustomCommand[];
};

export const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const fetchWithRetries = async (
  url: string,
  headers: { Authorization: string },
  retries = 3,
  delay = 6 * 10e4 // 60_000ms
) => {
  const delaySeconds = delay / 10e3;
  while (retries-- > 0) {
    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error: any) {
      console.info(`Retrying after ${delaySeconds} seconds.`);
      await sleep(delay);
    }
  }
};

const fetchCustomCommandsPage = async (
  accessToken: string | null
): Promise<CustomCommandsResponse> => {
  const url = 'https://api.nightbot.tv/1/commands';
  try {
    const page = fetchWithRetries(url, {
      Authorization: 'Bearer ' + accessToken,
    });
    return page;
  } catch {
    console.error('Error fetching commands after multiple retries.');
    enqueueSnackbar('Remote server error.', { variant: 'error' });
    throw new Error('Failed to fetch commands after multiple retries.');
  }
};

export const fetchCustomCommands = async (
  accessToken: string | null
): Promise<CustomCommand[]> => {
  try {
    const page = await fetchCustomCommandsPage(accessToken);
    return page.commands;
  } catch (error: any) {
    console.error('Error fetching commands.');
    enqueueSnackbar('Remote server error.', { variant: 'error' });
    throw new Error('Failed to fetch commands.');
  }
};

export const importCustomCommands = async (accessToken: string | null) => {
  const commands = await fetchCustomCommands(accessToken);
  let failCount = 0;
  for (const command of commands) {
    try {
      await new Promise((resolve, reject) => {
        getSocket('/systems/songs').emit(
          'import.video',
          {
            playlist:  '!nb_' + command.name,
            forcedTag: 'nightbot-import',
          },
          (err) => {
            if (err) {
              failCount += 1;
              console.error('error: ', command.name);
              reject(err);
            } else {
              resolve('resolved');
            }
          }
        );
      });
    } catch (error) {
      console.error('ERROR DURING COMMANDS IMPORT: ', error);
    }
  }
  if (failCount > 0) {
    enqueueSnackbar(`${failCount} videos failed to import.`, {
      variant: 'info',
    });
  }
  enqueueSnackbar('Commands import completed.', { variant: 'success' });
};

type Command = {
  providerId: string;
  provider:   string;
  duration:   number;
  title:      string;
  artist:     string;
  url:        string;
};

type PlaylistItem = {
  track:     Command;
  _id:       string;
  createdAt: string;
  updatedAt: string;
};

type PlaylistResponse = {
  status:   number;
  _sort:    { date: 'asc' | 'desc' };
  _limit:   number;
  _offset:  number;
  _total:   number;
  playlist: PlaylistItem[];
};

const fetchPlaylistPage = async (offset: number, accessToken: string | null): Promise<PlaylistResponse> => {
  const url = 'https://api.nightbot.tv/1/song_requests/playlist';
  const delay = 10 ** 4 * 6;
  const delaySeconds = delay / 10 ** 3;
  for (let retries = 3; retries > 0; retries--) {
    try {
      const response = await axios.get(url, {
        params: {
          limit:  100,
          offset: offset,
        },
        headers: { Authorization: 'Bearer ' + accessToken },
      });
      return response.data;
    } catch (error: any) {
      console.info(`Retrying after ${delaySeconds} seconds.`);
      await sleep(delay);
    }
  }
  console.error('Error fetching playlist page after multiple retries.');
  enqueueSnackbar('Remote server error.', { variant: 'error' });
  throw new Error('Failed to fetch playlist after multiple retries.');
};

const fetchTracks = async (
  accessToken: string | null,
  tracks: Command[] = [],
  offset = 0
): Promise<Command[]> => {
  try {
    const page = await fetchPlaylistPage(offset, accessToken);
    const mergedTracks = tracks.concat(page.playlist.map((t) => t.track));
    if (mergedTracks.length < page._total) {
      await fetchTracks( accessToken, mergedTracks, offset + 100,);
    }
    return mergedTracks;
  } catch (error: any) {
    console.error('Error fetching playlist.');
    enqueueSnackbar('Remote server error.', { variant: 'error' });
    throw new Error('Failed to fetch playlist.');
  }
};

export const importPlaylist = async (accessToken: string | null) => {
  const tracks = await fetchTracks(accessToken);
  const ytVideos = tracks.filter((track) => track.provider === 'youtube');
  let failCount = 0;
  for (const track of ytVideos) {
    try {
      await new Promise((resolve, reject) => {
        getSocket('/systems/songs').emit(
          'import.video',
          {
            playlist:  track.providerId,
            forcedTag: 'nightbot-import',
          },
          (err) => {
            if (err) {
              failCount += 1;
              console.error('error: ', track.url);
              reject(err);
            } else {
              resolve('resolved');
            }
          }
        );
      });
    } catch (error) {
      console.error('ERROR DURING IMPORT: ', error);
    }
  }
  if (failCount > 0) {
    enqueueSnackbar(`${failCount} videos failed to import.`, {
      variant: 'info',
    });
  }
  enqueueSnackbar('Playlist import completed.', { variant: 'success' });
};
