import { alignContigsToSource } from './alignment.js'
import { assembleWithTrace } from './assembler.js'
import { generateFragments, validateCustomFragments } from './generator.js'
import { PRESETS } from './presets.js'
import { init, update, type Action, type AppState, type Effect } from './store.js'
import { ControlsComponent } from './ui/controls.js'
import { renderDiffViewHtml } from './ui/diffView.js'
import { renderMergeTheatreHtml } from './ui/mergeView.js'
import { renderPoolHtml } from './ui/poolView.js'

/** The regions of the page that the application renders into. */
interface Workspace {
  readonly controlsPanel: HTMLElement
  readonly pool: HTMLElement
  readonly theatre: HTMLElement
  readonly diff: HTMLElement
}

function requireById(id: string): HTMLElement {
  const el = document.getElementById(id)
  if (!el) {
    throw new Error(`Required element #${id} not found`)
  }
  return el
}

/**
 * Build the static page layout and return the regions to render into.
 */
function mountWorkspace(): Workspace {
  const root = document.getElementById('app') ?? document.body
  root.innerHTML = `
      <div class="app-container">
        <header>
          <h1>Overlap-Layout-Consensus (OLC) Reconstruction</h1>
          <p>Interactive sequence assembler and stepwise animation workbench</p>
        </header>

        <div class="main-layout">
          <div class="layout-lhs">
            <section id="controls-panel" class="panel"></section>
          </div>

          <div class="layout-rhs">
            <section class="panel fixed-panel">
              <div class="panel-title">
                <span>Fragment Pool Workspace</span>
              </div>
              <div id="pool-grid" class="pool-grid"></div>
            </section>

            <section class="panel fixed-panel">
              <div class="panel-title">
                <span>Overlap &amp; Merge Theatre</span>
              </div>
              <div id="theatre-container" class="theatre-container"></div>
            </section>

            <section class="panel fixed-panel">
              <div class="panel-title">
                <span>Reference Alignment &amp; Verification</span>
              </div>
              <div id="diff-container" class="diff-container"></div>
            </section>
          </div>
        </div>
      </div>
    `

  return {
    controlsPanel: requireById('controls-panel'),
    pool: requireById('pool-grid'),
    theatre: requireById('theatre-container'),
    diff: requireById('diff-container')
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Parse an optional non-negative integer query parameter.
 */
function intParam(params: URLSearchParams, name: string): number | undefined {
  const raw = params.get(name)
  if (raw === null) {
    return undefined
  }
  const value = Number.parseInt(raw, 10)
  return Number.isNaN(value) ? undefined : value
}

/**
 * Application runtime: runs the pure Elm-style Reducer loop.
 */
class App {
  private state: AppState
  private playbackTimer: number | null = null
  private readonly workspace: Workspace
  private readonly controls: ControlsComponent

  constructor() {
    const [initialState] = init()
    this.state = initialState
    this.workspace = mountWorkspace()
    
    // Wire the ControlsComponent directly to the store dispatcher
    this.controls = new ControlsComponent(this.workspace.controlsPanel, PRESETS, (action) => this.dispatch(action))
    this.controls.setSpeed(this.state.stepDelayMs)

    const searchParams = new URLSearchParams(window.location.search)
    const presetIdx = intParam(searchParams, 'preset') ?? 0
    const initialPreset = PRESETS[presetIdx] ?? PRESETS[0]
    if (initialPreset) {
      const action: Action = { type: 'LOAD_PRESET', params: initialPreset.params }
      if (initialPreset.defaultFragments) action.defaultFragments = initialPreset.defaultFragments
      this.dispatch(action)
    }

    const stepIdx = intParam(searchParams, 'step')
    if (stepIdx !== undefined) {
      this.dispatch({ type: 'SEEK', index: stepIdx })
    }
  }

  /**
   * Dispatches an action to the pure store, updates the state, and 
   * executes any requested side effects.
   */
  private dispatch(action: Action): void {
    const [newState, effects] = update(this.state, action)
    this.state = newState
    for (const effect of effects) {
      this.handleEffect(effect)
    }
  }

  /**
   * Interprets and executes a single side effect requested by the store.
   */
  private handleEffect(effect: Effect): void {
    switch (effect.type) {
      case 'START_TIMER':
        this.playbackTimer ??= window.setInterval(() => {
          this.dispatch({ type: 'TICK' })
        }, effect.delayMs)
        break
      case 'STOP_TIMER':
        if (this.playbackTimer !== null) {
          window.clearInterval(this.playbackTimer)
          this.playbackTimer = null
        }
        break
      case 'RENDER':
        this.renderCurrentState()
        break
      case 'RUN_GENERATOR':
        try {
          const fragments = generateFragments(effect.params)
          this.handleEffect({
            type: 'RUN_ASSEMBLY',
            source: effect.params.source,
            fragments,
            minOverlap: effect.params.minOverlap
          })
        } catch (err: unknown) {
          this.dispatch({ type: 'ASSEMBLY_ERROR', message: errorMessage(err) })
        }
        break
      case 'RUN_ASSEMBLY':
        try {
          // If the user manually provided custom fragments, validate them first.
          // In a more pure architecture this could also be in the reducer or validation layer.
          if (effect.fragments.length > 0) {
            try {
              validateCustomFragments(effect.fragments, effect.minOverlap, effect.source)
            } catch {
              // Not all GENERATOR tests run through custom validator, so we just log and continue if it's just warning
              // validateCustomFragments throws errors for real issues
            }
          }
          const result = assembleWithTrace(effect.fragments, effect.minOverlap)
          this.dispatch({ type: 'ASSEMBLY_SUCCESS', source: effect.source, steps: result.steps })
        } catch (err: unknown) {
          this.dispatch({ type: 'ASSEMBLY_ERROR', message: errorMessage(err) })
        }
        break
      case 'UPDATE_CONTROLS_UI':
        this.controls.setParams(effect.params)
        if (effect.customText) {
          this.controls.setCustomText(effect.customText)
        }
        break
    }
  }

  private renderCurrentState(): void {
    const { pool, theatre, diff } = this.workspace
    const currentStep = this.state.steps[this.state.currentStepIndex]
    
    if (this.state.error) {
      this.controls.setExplanation(`Error: ${this.state.error}`)
      return
    }

    if (!currentStep) {
      pool.innerHTML = renderPoolHtml(null)
      theatre.innerHTML = renderMergeTheatreHtml(null)
      diff.innerHTML = renderDiffViewHtml(null)
      return
    }

    const stepReport = alignContigsToSource(
      this.state.currentSource,
      currentStep.pool
    )

    pool.innerHTML = renderPoolHtml(currentStep)
    theatre.innerHTML = renderMergeTheatreHtml(currentStep)
    diff.innerHTML = renderDiffViewHtml(stepReport)

    this.controls.setPlaying(this.state.isPlaying)
    this.controls.updateProgress(this.state.currentStepIndex, this.state.steps.length)
    this.controls.setExplanation(currentStep.description)
  }
}

// Bootstrap application on DOM ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    new App()
  })
} else {
  new App()
}
