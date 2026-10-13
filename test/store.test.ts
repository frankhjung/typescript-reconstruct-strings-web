import test from 'node:test'
import assert from 'node:assert/strict'
import { update, init } from '../src/store.js'
import type { ReductionEvent } from '../src/types.js'

const dummyEvent: ReductionEvent = {
  kind: 'initial-filtered',
  pool: ['ABC'],
  removed: []
}

test('store reducer', async (t) => {
  await t.test('init returns default state and no effects', () => {
    const [state, effects] = init()
    assert.deepEqual(state.events, [])
    assert.equal(state.currentStepIndex, 0)
    assert.equal(state.isPlaying, false)
    assert.equal(state.stepDelayMs, 1000)
    assert.deepEqual(effects, [])
  })

  await t.test('TOGGLE_PLAY starts timer when paused and events exist', () => {
    const [initialState] = init()
    const stateWithEvents = {
      ...initialState,
      events: [dummyEvent]
    }
    const [newState, effects] = update(stateWithEvents, { type: 'TOGGLE_PLAY' })
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
      events: [dummyEvent]
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
      events: [dummyEvent, dummyEvent]
    }
    const [newState, effects] = update(playingState, { type: 'TICK' })
    assert.equal(newState.currentStepIndex, 1)
    assert.deepEqual(effects, [{ type: 'RENDER' }])
  })

  await t.test('TICK stops playback at end of events', () => {
    const [initialState] = init()
    const playingState = {
      ...initialState,
      isPlaying: true,
      currentStepIndex: 1, // last event
      events: [dummyEvent, dummyEvent]
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
      events: [dummyEvent, dummyEvent]
    }
    const [newState, effects] = update(state, { type: 'SEEK', index: 5 })
    assert.equal(newState.isPlaying, false)
    assert.equal(newState.currentStepIndex, 1) // clamped to max length - 1
    assert.deepEqual(effects, [{ type: 'STOP_TIMER' }, { type: 'RENDER' }])
  })
})
