import test from 'node:test'
import assert from 'node:assert/strict'
import { update, init } from '../src/store.js'
import type { AssemblyStep } from '../src/types.js'

test('store reducer', async (t) => {
  await t.test('init returns default state and no effects', () => {
    const [state, effects] = init()
    assert.deepEqual(state.steps, [])
    assert.equal(state.currentStepIndex, 0)
    assert.equal(state.isPlaying, false)
    assert.equal(state.stepDelayMs, 1000)
    assert.deepEqual(effects, [])
  })

  await t.test('TOGGLE_PLAY starts timer when paused and steps exist', () => {
    const [initialState] = init()
    const stateWithSteps = {
      ...initialState,
      steps: [{ pool: [], overlaps: [], merges: [], description: 'Test' } as unknown as AssemblyStep]
    }
    const [newState, effects] = update(stateWithSteps, { type: 'TOGGLE_PLAY' })
    assert.equal(newState.isPlaying, true)
    assert.deepEqual(effects, [
      { type: 'START_TIMER', delayMs: 1000 },
      { type: 'RENDER' }
    ])
  })

  await t.test('TOGGLE_PLAY stops timer when playing', () => {
    const [initialState] = init()
    const playingState = { 
      ...initialState, 
      isPlaying: true,
      steps: [{ pool: [], overlaps: [], merges: [], description: 'Test' } as unknown as AssemblyStep]
    }
    const [newState, effects] = update(playingState, { type: 'TOGGLE_PLAY' })
    assert.equal(newState.isPlaying, false)
    assert.deepEqual(effects, [{ type: 'STOP_TIMER' }, { type: 'RENDER' }])
  })

  await t.test('TICK advances step when playing', () => {
    const [initialState] = init()
    const playingState = {
      ...initialState,
      isPlaying: true,
      currentStepIndex: 0,
      steps: [
        { pool: [], overlaps: [], merges: [], description: 'S1' } as unknown as AssemblyStep,
        { pool: [], overlaps: [], merges: [], description: 'S2' } as unknown as AssemblyStep
      ]
    }
    const [newState, effects] = update(playingState, { type: 'TICK' })
    assert.equal(newState.currentStepIndex, 1)
    assert.deepEqual(effects, [{ type: 'RENDER' }])
  })

  await t.test('TICK stops playback at end of steps', () => {
    const [initialState] = init()
    const playingState = {
      ...initialState,
      isPlaying: true,
      currentStepIndex: 1, // last step
      steps: [
        { pool: [], overlaps: [], merges: [], description: 'S1' } as unknown as AssemblyStep,
        { pool: [], overlaps: [], merges: [], description: 'S2' } as unknown as AssemblyStep
      ]
    }
    const [newState, effects] = update(playingState, { type: 'TICK' })
    assert.equal(newState.currentStepIndex, 1) // unchanged
    assert.equal(newState.isPlaying, false)
    assert.deepEqual(effects, [{ type: 'STOP_TIMER' }, { type: 'RENDER' }])
  })

  await t.test('SEEK jumps to bounds-checked index and pauses', () => {
    const [initialState] = init()
    const state = {
      ...initialState,
      isPlaying: true,
      steps: [
        { pool: [], overlaps: [], merges: [], description: 'S1' } as unknown as AssemblyStep,
        { pool: [], overlaps: [], merges: [], description: 'S2' } as unknown as AssemblyStep
      ]
    }
    const [newState, effects] = update(state, { type: 'SEEK', index: 5 })
    assert.equal(newState.isPlaying, false)
    assert.equal(newState.currentStepIndex, 1) // clamped to max length - 1
    assert.deepEqual(effects, [{ type: 'STOP_TIMER' }, { type: 'RENDER' }])
  })
})
