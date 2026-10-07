import { alignContigsToSource } from './alignment.js'
import { assembleWithTrace } from './assembler.js'
import { generateFragments, validateCustomFragments } from './generator.js'
import { DEFAULT_STEP_DELAY_MS } from './input.js'
import { PRESETS } from './presets.js'
import type { AssemblyStep, GeneratorParams, Preset } from './types.js'
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
 * Application controller: owns assembly state and playback, and wires the
 * controls to the pure assembler, alignment and view renderers.
 *
 * Supported URL query parameters:
 * - `preset`: index into {@link PRESETS} to load initially (default 0)
 * - `step`: index of the animation step to show initially
 */
class App {
  private currentSource = ''
  private steps: readonly AssemblyStep[] = []
  private currentStepIndex = 0

  private isPlaying = false
  private playbackTimer: number | null = null
  private stepDelayMs = DEFAULT_STEP_DELAY_MS

  private readonly workspace: Workspace
  private readonly controls: ControlsComponent

  constructor() {
    this.workspace = mountWorkspace()
    this.controls = this.createControls(this.workspace.controlsPanel)
    this.controls.setSpeed(this.stepDelayMs)

    const searchParams = new URLSearchParams(window.location.search)
    const presetIdx = intParam(searchParams, 'preset') ?? 0
    const initialPreset = PRESETS[presetIdx] ?? PRESETS[0]
    if (initialPreset) {
      this.loadPreset(initialPreset)
    }

    const stepIdx = intParam(searchParams, 'step')
    if (stepIdx !== undefined) {
      this.seekTo(stepIdx)
    }
  }

  private createControls(panel: HTMLElement): ControlsComponent {
    return new ControlsComponent(panel, PRESETS, {
      onGenerate: (params) => this.handleGenerate(params),
      onCustomFragments: (fragments, minOverlap, source) =>
        this.handleCustom(fragments, minOverlap, source),
      onSelectPreset: (preset) => this.loadPreset(preset),
      onPlayPause: () => this.togglePlay(),
      onStepNext: () => this.stepNext(),
      onStepPrev: () => this.stepPrev(),
      onSeek: (idx) => this.seekTo(idx),
      onSpeedChange: (delay) => {
        this.stepDelayMs = delay
        if (this.isPlaying) {
          this.stopPlayback()
          this.startPlayback()
        }
      },
      onReset: () => this.reset()
    })
  }

  /**
   * Stop playback, run an action that may fail validation, and report any
   * error to the user instead of leaving the display half-updated.
   */
  private attempt(action: () => void): void {
    this.stopPlayback()
    try {
      action()
    } catch (err: unknown) {
      this.controls.setExplanation(`Error: ${errorMessage(err)}`)
    }
  }

  private handleGenerate(params: GeneratorParams): void {
    this.attempt(() => {
      const fragments = generateFragments(params)
      this.runAssembly(params.source, fragments, params.minOverlap)
    })
  }

  private handleCustom(
    fragments: readonly string[],
    minOverlap: number,
    source: string
  ): void {
    this.attempt(() => {
      validateCustomFragments(fragments, minOverlap, source)
      this.runAssembly(source, fragments, minOverlap)
    })
  }

  private loadPreset(preset: Preset): void {
    this.attempt(() => {
      this.controls.setParams(preset.params)
      const fixed = preset.defaultFragments
      if (fixed && fixed.length > 0) {
        this.controls.setCustomText(fixed.join('\n'))
      }
      const fragments =
        fixed && fixed.length > 0 ? fixed : generateFragments(preset.params)
      this.runAssembly(
        preset.params.source,
        fragments,
        preset.params.minOverlap
      )
    })
  }

  /**
   * Assemble and show the result. State changes only after assembly
   * succeeds, so the source always matches the steps being displayed.
   */
  private runAssembly(
    source: string,
    fragments: readonly string[],
    minOverlap: number
  ): void {
    const result = assembleWithTrace(fragments, minOverlap)
    this.currentSource = source
    this.steps = result.steps
    this.currentStepIndex = 0
    this.renderCurrentState()
  }

  private renderCurrentState(): void {
    const { pool, theatre, diff } = this.workspace
    const currentStep = this.steps[this.currentStepIndex]
    if (!currentStep) {
      pool.innerHTML = renderPoolHtml(null)
      theatre.innerHTML = renderMergeTheatreHtml(null)
      diff.innerHTML = renderDiffViewHtml(null)
      return
    }

    const stepReport = alignContigsToSource(
      this.currentSource,
      currentStep.pool
    )

    pool.innerHTML = renderPoolHtml(currentStep)
    theatre.innerHTML = renderMergeTheatreHtml(currentStep)
    diff.innerHTML = renderDiffViewHtml(stepReport)

    this.controls.updateProgress(this.currentStepIndex, this.steps.length)
    this.controls.setExplanation(currentStep.description)
  }

  private togglePlay(): void {
    if (this.isPlaying) {
      this.stopPlayback()
    } else {
      this.startPlayback()
    }
  }

  private startPlayback(): void {
    if (this.steps.length === 0) {
      return
    }
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = 0
      this.renderCurrentState()
    }
    this.isPlaying = true
    this.controls.setPlaying(true)

    this.playbackTimer = window.setInterval(() => {
      if (this.currentStepIndex < this.steps.length - 1) {
        this.currentStepIndex++
        this.renderCurrentState()
      } else {
        this.stopPlayback()
      }
    }, this.stepDelayMs)
  }

  private stopPlayback(): void {
    this.isPlaying = false
    this.controls.setPlaying(false)
    if (this.playbackTimer !== null) {
      window.clearInterval(this.playbackTimer)
      this.playbackTimer = null
    }
  }

  private stepNext(): void {
    this.stopPlayback()
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++
      this.renderCurrentState()
    }
  }

  private stepPrev(): void {
    this.stopPlayback()
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--
      this.renderCurrentState()
    }
  }

  private seekTo(idx: number): void {
    this.stopPlayback()
    if (idx >= 0 && idx < this.steps.length) {
      this.currentStepIndex = idx
      this.renderCurrentState()
    }
  }

  private reset(): void {
    this.stopPlayback()
    this.currentStepIndex = 0
    this.renderCurrentState()
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
