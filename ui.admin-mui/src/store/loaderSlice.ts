import { createSlice } from '@reduxjs/toolkit';

export const loaderSlice = createSlice({
  name:         'loader',
  initialState: {
    server:            null,
    compatibleVersion: '15.5.0',
    connectedToServer: false,
    showLoginWarning:  false,

    drawerWidth:           65,
    message:               null,
    state:                 false,
    tokensOnboardingState: false,
    configuration:         {},
    translation:           {},

    nextVersion:    null,
    currentVersion: null,

    core:         null,
    services:     null,
    systems:      null,
    integrations: null,

    settingsLoadingInProgress: [],
  },
  reducers: {
    addSettingsLoading: (state: any, action: { payload: any }) => {
      console.debug(`addSettingsLoading`, action.payload);
      state.settingsLoadingInProgress = [...state.settingsLoadingInProgress, action.payload];
    },
    rmSettingsLoading: (state: any, action: { payload: any }) => {
      console.debug(`rmSettingsLoading`, action.payload);
      state.settingsLoadingInProgress = state.settingsLoadingInProgress.filter((o: string) => o !== action.payload);
    },
    setSystem: (state: any, action: { payload: any }) => {
      console.debug(`setSystem::${action.payload.type}`, action.payload.value);
      state[action.payload.type] = action.payload.value;
    },
    setMessage: (state: { message: any }, action: { payload: any }) => {
      console.debug(`setMessage`, action.payload);
      state.message = action.payload;
    },
    setState: (state: { state: any }, action: { payload: any }) => {
      console.debug(`setState`, action.payload);
      state.state = action.payload;
    },
    setTokensOnboardingState: (state: { tokensOnboardingState: any }, action: { payload: any }) => {
      console.debug(`setTokensOnboardingState`, action.payload);
      state.tokensOnboardingState = action.payload;
    },
    setConfiguration: (state: { configuration: any }, action: { payload: any }) => {
      console.debug(`setConfiguration`, action.payload);
      state.configuration = action.payload;
    },
    setTranslation: (state: { translation: any }, action: { payload: any }) => {
      state.translation = action.payload;
    },
    setCurrentVersion: (state: { currentVersion: any }, action: { payload: any }) => {
      console.debug(`setCurrentVersion`, action.payload);
      state.currentVersion = action.payload;
    },
    setNextVersion: (state: { nextVersion: any }, action: { payload: any }) => {
      console.debug(`setNextVersion`, action.payload);
      state.nextVersion = action.payload;
    },
    setServer: (state: { server: any }, action: { payload: any }) => {
      console.debug(`setServer`, action.payload);
      state.server = action.payload;
      sessionStorage.serverUrl = state.server;
      sessionStorage.serverHistory = JSON.stringify([state.server, ...JSON.parse(localStorage.serverHistory ?? '["http://localhost:20000"]')]);
    },
    setConnectedToServer: (state: { connectedToServer: any, server: any }) => {
      sessionStorage.connectedToServer = true;
      state.connectedToServer = true;
      console.debug('setConnectedToServer', );
    },
    showLoginWarning: (state: any) => {
      state.showLoginWarning = true;
    },
  },
});

// Action creators are generated for each case reducer function
export const { addSettingsLoading, setTokensOnboardingState, rmSettingsLoading, setTranslation, setConnectedToServer, setServer, setMessage, setState, setConfiguration, setSystem, setCurrentVersion, setNextVersion, showLoginWarning } = loaderSlice.actions;
export default loaderSlice.reducer;