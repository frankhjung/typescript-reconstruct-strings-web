import type { AssemblyStep, GeneratorParams } from './types.js'
import { DEFAULT_STEP_DELAY_MS } from './input.js'

/**
 * Represents the immutable application state, containing the sequence 
 * source, assembly steps, and current playback position.
 */
export interface AppState {
  currentSource: string
  steps: readonly AssemblyStep[]
  currentStepIndex: number
  isPlaying: boolean
  stepDelayMs: number
  error: string | null
}

/**
 * Sum type of all possible user intents and system events that can 
 * trigger a state transition.
 */
export type Action =
  | { type: 'GENERATE'; params: GeneratorParams }
  | { type: 'APPLY_CUSTOM'; fragments: readonly string[]; minOverlap: number; source: string }
  | { type: 'LOAD_PRESET'; params: GeneratorParams; defaultFragments?: readonly string[] }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'TICK' }
  | { type: 'STEP_NEXT' }
  | { type: 'STEP_PREV' }
  | { type: 'SEEK'; index: number }
  | { type: 'SET_SPEED'; delayMs: number }
  | { type: 'ASSEMBLY_SUCCESS'; source: string; steps: readonly AssemblyStep[] }
  | { type: 'ASSEMBLY_ERROR'; message: string }
  | { type: 'RESET' }

/**
 * Sum type of all side effects (DOM mutations, timers, or intensive 
 * computations) requested by the pure state reducer.
 */
export type Effect =
  | { type: 'START_TIMER'; delayMs: number }
  | { type: 'STOP_TIMER' }
  | { type: 'RENDER' }
  | { type: 'RUN_GENERATOR'; params: GeneratorParams }
  | { type: 'RUN_ASSEMBLY'; source: string; fragments: readonly string[]; minOverlap: number }
  | { type: 'UPDATE_CONTROLS_UI'; params: GeneratorParams; customText?: string }

/**
 * Construct the initial application state and any immediate effects.
 */
export function init(): [AppState, Effect[]] {
  return [
    {
      currentSource: '',
      steps: [],
      currentStepIndex: 0,
      isPlaying: false,
      stepDelayMs: DEFAULT_STEP_DELAY_MS,
      error: null
    },
    []
  ]
}

/**
 * Pure state reducer. Computes the next immutable state and a list of 
 * side effects to be executed by the runtime shell.
 */
export function update(state: AppState, action: Action): [AppState, Effect[]] {
  switch (action.type) {
    case 'GENERATE':
      return [
        { ...state, isPlaying: false },
        [{ type: 'STOP_TIMER' }, { type: 'RUN_GENERATOR', params: action.params }]
      ]
    case 'APPLY_CUSTOM':
      return [
        { ...state, isPlaying: false },
        [
          { type: 'STOP_TIMER' },
          {
            type: 'RUN_ASSEMBLY',
            source: action.source,
            fragments: action.fragments,
            minOverlap: action.minOverlap
          }
        ]
      ]
    case 'LOAD_PRESET':
      return [
        { ...state, isPlaying: false },
        [
          { type: 'STOP_TIMER' },
          {
            type: 'UPDATE_CONTROLS_UI',
            params: action.params,
            ...(action.defaultFragments ? { customText: action.defaultFragments.join('\n') } : {})
          },
          action.defaultFragments && action.defaultFragments.length > 0
            ? {
                type: 'RUN_ASSEMBLY',
                source: action.params.source,
                fragments: action.defaultFragments,
                minOverlap: action.params.minOverlap
              }
            : { type: 'RUN_GENERATOR', params: action.params }
        ]
      ]
    case 'TOGGLE_PLAY': {
      if (state.steps.length === 0) return [state, []]
      const willPlay = !state.isPlaying
      let nextIndex = state.currentStepIndex
      if (willPlay && nextIndex >= state.steps.length - 1) {
        nextIndex = 0 // loop back to start
      }
      return [
        { ...state, isPlaying: willPlay, currentStepIndex: nextIndex },
        [
          willPlay ? { type: 'START_TIMER', delayMs: state.stepDelayMs } : { type: 'STOP_TIMER' },
          { type: 'RENDER' }
        ]
      ]
    }
    case 'TICK': {
      if (!state.isPlaying) return [state, []]
      if (state.currentStepIndex < state.steps.length - 1) {
        return [
          { ...state, currentStepIndex: state.currentStepIndex + 1 },
          [{ type: 'RENDER' }]
        ]
      } else {
        return [
          { ...state, isPlaying: false },
          [{ type: 'STOP_TIMER' }, { type: 'RENDER' }]
        ]
      }
    }
    case 'SEEK': {
      const maxIdx = Math.max(0, state.steps.length - 1)
      const clamped = Math.min(Math.max(0, action.index), maxIdx)
      return [
        { ...state, currentStepIndex: clamped, isPlaying: false },
        [{ type: 'STOP_TIMER' }, { type: 'RENDER' }]
      ]
    }
    case 'STEP_NEXT': {
      if (state.currentStepIndex < state.steps.length - 1) {
        return [
          { ...state, currentStepIndex: state.currentStepIndex + 1, isPlaying: false },
          [{ type: 'STOP_TIMER' }, { type: 'RENDER' }]
        ]
      }
      return [{ ...state, isPlaying: false }, [{ type: 'STOP_TIMER' }, { type: 'RENDER' }]]
    }
    case 'STEP_PREV': {
      if (state.currentStepIndex > 0) {
        return [
          { ...state, currentStepIndex: state.currentStepIndex - 1, isPlaying: false },
          [{ type: 'STOP_TIMER' }, { type: 'RENDER' }]
        ]
      }
      return [{ ...state, isPlaying: false }, [{ type: 'STOP_TIMER' }, { type: 'RENDER' }]]
    }
    case 'SET_SPEED': {
      const isPlaying = state.isPlaying
      const effects: Effect[] = isPlaying
        ? [{ type: 'STOP_TIMER' }, { type: 'START_TIMER', delayMs: action.delayMs }, { type: 'RENDER' }]
        : [{ type: 'RENDER' }] // Re-render for UI sync
      return [{ ...state, stepDelayMs: action.delayMs }, effects]
    }
    case 'ASSEMBLY_SUCCESS': {
      return [
        {
          ...state,
          currentSource: action.source,
          steps: action.steps,
          currentStepIndex: 0,
          isPlaying: false,
          error: null
        },
        [{ type: 'STOP_TIMER' }, { type: 'RENDER' }]
      ]
    }
    case 'ASSEMBLY_ERROR': {
      return [
        { ...state, isPlaying: false, error: action.message },
        [{ type: 'STOP_TIMER' }, { type: 'RENDER' }]
      ]
    }
    case 'RESET': {
      return [
        { ...state, currentStepIndex: 0, isPlaying: false, error: null },
        [{ type: 'STOP_TIMER' }, { type: 'RENDER' }]
      ]
    }
    default:
      return [state, []]
  }
}
