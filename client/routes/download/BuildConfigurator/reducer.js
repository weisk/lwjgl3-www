import * as $ from './actionTypes'
import config from './config'

import {
  BUILD_RELEASE,
  BUILD_STABLE,
  MODE_ZIP,
  MODE_MAVEN,
} from './constants'

// const getError = (state, message, severity = "danger") => ({...state, error: {message, severity,}});

const selectBuild = (state, build) => {
  state.build = build;
  if ( build !== null ) {
    state.version = state.builds.byId[build].latest.join('.');

    if ( build === BUILD_STABLE ) {
      lockDown(state);
    }
  }

  return state;
};

const lockDown = (state) => {
  if ( state.mode !== MODE_ZIP ) {
    selectMode(state, MODE_ZIP);
  }
  if ( state.preset !== 'all' ) {
    selectPreset(state, 'all');
  }
};

const selectVersion = (state, version) => {
  state.version = version;
  if ( version === '3.0.0' ) {
    lockDown(state);
  }
  return state;
};

const selectMode = (state, mode) => {
  state.mode = mode;
  return state;
};

const selectPreset = (state, preset) => {
  state.preset = preset;

  if ( preset !== 'custom' ) {
    const contents = {};
    state.artifacts.allIds.forEach(artifact => {
      contents[artifact] = false;
    });

    state.presets.byId[preset].artifacts.forEach(artifact => {
      contents[artifact] = true;
    });

    state.contents = contents;
  }

  return state;
};

const toggleArtifact = (state, artifact) => {
  state.contents = {...state.contents, [artifact]: !state.contents[artifact]};

  // MATCH PRESET
  // collect selected artifacts in an Array
  const selected = Object.keys(state.contents).filter(artifact => state.contents[artifact]);
  // match selected artifacts with a preset
  const presetFoundMatch = state.presets.allIds.some(preset => {
    // ignore custom preset
    if ( preset === 'custom' ) {
      return false;
    }
    const artifacts = state.presets.byId[preset].artifacts;
    // first check length for speed, then do deep comparison
    if ( artifacts.length === selected.length && artifacts.every((item, i) => item === selected[i]) ) {
      state.preset = preset;
      return true;
    }
    return false;
  });
  // if we didn't get a match, set it to custom preset
  if ( !presetFoundMatch ) {
    state.preset = 'custom';
  }

  return state;
};

const toggleAddon = (state, addon) => {
  if ( state.selectedAddons.includes(addon) ) {
    state.selectedAddons = state.selectedAddons.filter(it => it !== addon);
  } else {
    state.selectedAddons = [...state.selectedAddons, addon];
  }

  return state;
};

const computeAvailability = (state) => {
  const availability = {};
  const buildCnt = state.builds.allIds.length;
  const nativeCnt = state.natives.allIds.length;

  state.artifacts.allIds.forEach(id => {
    const artifact = state.artifacts.byId[id];
    const since = state.versions.byId[artifact.since].semver;
    const semver = state.versions.byId[state.version].semver;

    availability[id] =
      (
           artifact.builds.length === buildCnt
        || artifact.builds.some(it => it === state.build)
      )
      &&
      (
           state.mode !== MODE_ZIP
        || artifact.natives === undefined
        || artifact.natives.length === nativeCnt
        || artifact.natives.some(platform => !!state.platform[platform])
      )
      &&
      (
        semver[2] * 100 + semver[1] * 10 + semver[0] >= since[2] * 100 + since[1] * 10 + since[0]
      );
  });

  state.availability = availability;
  return state;
};

export default function(state = config, action) {

  switch (action.type) {

    case $.SELECT_TYPE:
      if ( action.build !== state.build && state.downloading === false ) {
        return computeAvailability(selectBuild({...state}, action.build));
      }
      break;

    case $.SELECT_MODE:
      if ( state.build !== BUILD_STABLE && state.mode !== action.mode ) {
        // For now, only allow nightly builds to select mode
        return computeAvailability(selectMode({...state}, action.mode));
      }
      break;

    case $.TOGGLE_DESCRIPTIONS:
      return {...state, descriptions: action.descriptions};

    case $.TOGGLE_COMPACT:
      if ( state.mode === MODE_MAVEN ) {
        return {...state, compact: action.compact};
      }
      break;

    case $.TOGGLE_HARDCODED:
      if ( state.mode !== MODE_ZIP ) {
        return {...state, hardcoded: action.hardcoded};
      }
      break;

    case $.TOGGLE_JAVADOC:
      if ( state.mode === MODE_ZIP ) {
        return {...state, javadoc: action.javadoc};
      }
      break;

    case $.TOGGLE_SOURCE:
      if ( state.mode === MODE_ZIP ) {
        return {...state, source: action.source};
      }
      break;

    case $.SELECT_PRESET:
      if ( state.preset !== action.preset ) {
        return computeAvailability(selectPreset({...state}, action.preset));
      }
      break;

    case $.SELECT_LANGUAGE:
      // not implemented
      break;

    case $.TOGGLE_PLATFORM:
      if ( state.mode === MODE_ZIP ) {
        const selections = state.natives.allIds.reduce((previousValue, platform) => previousValue + (state.platform[platform] ? 1 : 0), 0);
        if ( selections > 1 || state.platform[action.platform] === false ) {
          return computeAvailability({...state, platform: {...state.platform, [action.platform]: !state.platform[action.platform]}});
        }
      }
      break;

    case $.SELECT_VERSION:
      if ( state.build === BUILD_RELEASE ) {
        const latest = state.builds.byId[state.build].latest;
        const semver = state.versions.byId[action.version].semver;

        if ( semver[0] < latest[0] || semver[1] < latest[1] || semver[2] <= latest[2] ) {
          return computeAvailability(selectVersion({...state}, action.version));
        }
      }
      break;

    case $.TOGGLE_ARTIFACT:
      if ( action.artifact !== 'lwjgl' ) {
        return toggleArtifact({...state}, action.artifact);
      }
      break;

    case $.TOGGLE_ADDON:
      return toggleAddon({...state}, action.addon);

    case $.DOWNLOAD_INIT:
      if ( state.mode === MODE_ZIP && state.downloading === false ) {
        return {...state, downloading: true, progress: []}
      }
      break;

    case $.DOWNLOAD_LOG:
      return {...state, progress: [...state.progress, action.payload]};

    case $.DOWNLOAD_COMPLETE:
      if ( action.error ) {
        alert(action.error);
      }
      return {...state, downloading: false};

    case $.RESET:
      if ( state.downloading ) {
        return {...state, downloading: false};
      }
      break;

  }

  return state;
}
