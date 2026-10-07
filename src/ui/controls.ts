import {
  MAX_STEP_DELAY_MS,
  MIN_STEP_DELAY_MS,
  STEP_DELAY_INCREMENT_MS,
  delayToSlider,
  parseFragments,
  sliderToDelay
} from '../input.js'
import type { GeneratorParams, Preset } from '../types.js'
import { escapeHtml } from './escape.js'

/** Actions the controls panel can request of its owner. */
export interface ControlsCallbacks {
  onGenerate: (params: GeneratorParams) => void
  onCustomFragments: (
    fragments: readonly string[],
    minOverlap: number,
    source: string
  ) => void
  onSelectPreset: (preset: Preset) => void
  onPlayPause: () => void
  onStepNext: () => void
  onStepPrev: () => void
  onSeek: (stepIndex: number) => void
  onSpeedChange: (delayMs: number) => void
  onReset: () => void
}

function requireElement<T extends HTMLElement>(
  parent: ParentNode,
  selector: string
): T {
  const el = parent.querySelector<T>(selector)
  if (!el) {
    throw new Error(`Required DOM element "${selector}" not found`)
  }
  return el
}

/** Every element the component reads from or writes to. */
interface Elements {
  readonly inputSource: HTMLInputElement
  readonly inputMinOverlap: HTMLInputElement
  readonly inputMinLength: HTMLInputElement
  readonly inputMaxLength: HTMLInputElement
  readonly inputFragmentCount: HTMLInputElement
  readonly selectPreset: HTMLSelectElement
  readonly btnGenerate: HTMLButtonElement
  readonly btnToggleCustom: HTMLButtonElement
  readonly btnApplyCustom: HTMLButtonElement
  readonly btnPlayPause: HTMLButtonElement
  readonly btnStepNext: HTMLButtonElement
  readonly btnStepPrev: HTMLButtonElement
  readonly btnReset: HTMLButtonElement
  readonly scrubber: HTMLInputElement
  readonly speedSlider: HTMLInputElement
  readonly stepLabel: HTMLElement
  readonly explanation: HTMLElement
  readonly customEditor: HTMLElement
  readonly customTextarea: HTMLTextAreaElement
}

function bindElements(container: ParentNode): Elements {
  return {
    inputSource: requireElement(container, '#param-source'),
    inputMinOverlap: requireElement(container, '#param-n'),
    inputMinLength: requireElement(container, '#param-a'),
    inputMaxLength: requireElement(container, '#param-b'),
    inputFragmentCount: requireElement(container, '#param-m'),
    selectPreset: requireElement(container, '#preset-select'),
    btnGenerate: requireElement(container, '#btn-generate'),
    btnToggleCustom: requireElement(container, '#btn-toggle-custom'),
    btnApplyCustom: requireElement(container, '#btn-apply-custom'),
    btnPlayPause: requireElement(container, '#btn-play-pause'),
    btnStepNext: requireElement(container, '#btn-step-next'),
    btnStepPrev: requireElement(container, '#btn-step-prev'),
    btnReset: requireElement(container, '#btn-reset'),
    scrubber: requireElement(container, '#scrubber'),
    speedSlider: requireElement(container, '#speed-slider'),
    stepLabel: requireElement(container, '#step-label'),
    explanation: requireElement(container, '#status-explanation'),
    customEditor: requireElement(container, '#custom-editor'),
    customTextarea: requireElement(container, '#custom-fragments')
  }
}

/**
 * Read an integer from a number input. An empty or invalid field yields 0,
 * which the validators reject with a descriptive message (never `NaN`).
 */
function readInt(input: HTMLInputElement): number {
  const value = Number.parseInt(input.value, 10)
  return Number.isNaN(value) ? 0 : value
}

function renderTemplate(presets: readonly Preset[]): string {
  const presetOptions = presets
    .map((p, idx) => `<option value="${idx}">${escapeHtml(p.name)}</option>`)
    .join('')

  return `
      <div class="panel-title">
        <span>Controls</span>
      </div>

      <div class="form-group compact">
        <label for="param-source">Source Sequence (Ground Truth)</label>
        <input id="param-source" type="text" spellcheck="false" />
      </div>

      <div class="form-group spaced">
        <select id="preset-select" aria-label="Load preset">
          <option value="" disabled selected>Load Preset...</option>
          ${presetOptions}
        </select>
      </div>

      <div class="grid-params">
        <div class="form-group">
          <label for="param-n">Min Overlap (n)</label>
          <input id="param-n" type="number" min="2" />
        </div>
        <div class="form-group">
          <label for="param-m">Fragment Count (m)</label>
          <input id="param-m" type="number" min="2" />
        </div>
      </div>

      <div class="grid-params">
        <div class="form-group">
          <label for="param-a">Min Length (a)</label>
          <input id="param-a" type="number" min="2" />
        </div>
        <div class="form-group">
          <label for="param-b">Max Length (b)</label>
          <input id="param-b" type="number" min="2" />
        </div>
      </div>

      <div class="btn-row">
        <button id="btn-generate" class="primary">Generate Fragments</button>
        <button id="btn-toggle-custom">Manual Fragment Pool</button>
        <button id="btn-reset">Reset</button>
      </div>

      <div id="custom-editor" class="custom-editor" hidden>
        <label for="custom-fragments">
          Custom Fragments (one per line or comma-separated)
        </label>
        <textarea id="custom-fragments" rows="3"></textarea>
        <div class="btn-row">
          <button id="btn-apply-custom" class="accent">Apply Custom Pool</button>
        </div>
      </div>

      <div class="playback-bar">
        <div class="playback-controls">
          <button id="btn-play-pause" class="accent" title="Play / Pause">
            Play ▶
          </button>
          <button id="btn-step-prev" title="Step Backward">⏮ Prev</button>
          <button id="btn-step-next" title="Step Forward">Next ⏭</button>
        </div>

        <div class="scrubber-container">
          <input
            id="scrubber"
            type="range"
            min="0"
            max="0"
            value="0"
            aria-label="Seek animation step"
          />
          <span id="step-label" class="step-label">Step 0 / 0</span>
        </div>

        <div class="speed-control">
          <label for="speed-slider">Speed</label>
          <input
            id="speed-slider"
            type="range"
            min="${MIN_STEP_DELAY_MS}"
            max="${MAX_STEP_DELAY_MS}"
            step="${STEP_DELAY_INCREMENT_MS}"
            aria-label="Animation playback speed"
          />
        </div>
      </div>

      <div id="status-explanation" class="status-explanation">
        Initialise parameters and click Generate Fragments to begin.
      </div>
    `
}

/**
 * The controls panel: parameter inputs, preset selection, manual fragment
 * entry and playback controls. It owns its DOM and reports user intent
 * through {@link ControlsCallbacks}; it holds no application state.
 */
export class ControlsComponent {
  private readonly callbacks: ControlsCallbacks
  private readonly els: Elements

  constructor(
    container: HTMLElement,
    presets: readonly Preset[],
    callbacks: ControlsCallbacks
  ) {
    this.callbacks = callbacks
    container.innerHTML = renderTemplate(presets)
    this.els = bindElements(container)
    this.els.customTextarea.placeholder = 'ABC\nBCD\nCDE'
    this.setupListeners(presets)
  }

  private setupListeners(presets: readonly Preset[]): void {
    const { els, callbacks } = this

    els.selectPreset.addEventListener('change', () => {
      const idx = Number.parseInt(els.selectPreset.value, 10)
      const preset = Number.isNaN(idx) ? undefined : presets[idx]
      if (preset) {
        callbacks.onSelectPreset(preset)
      }
    })

    els.btnGenerate.addEventListener('click', () => {
      callbacks.onGenerate(this.getParams())
    })

    els.btnToggleCustom.addEventListener('click', () => {
      els.customEditor.hidden = !els.customEditor.hidden
    })

    els.btnApplyCustom.addEventListener('click', () => {
      callbacks.onCustomFragments(
        parseFragments(els.customTextarea.value),
        readInt(els.inputMinOverlap),
        els.inputSource.value.trim()
      )
    })

    els.btnPlayPause.addEventListener('click', () => callbacks.onPlayPause())
    els.btnStepNext.addEventListener('click', () => callbacks.onStepNext())
    els.btnStepPrev.addEventListener('click', () => callbacks.onStepPrev())
    els.btnReset.addEventListener('click', () => callbacks.onReset())

    els.scrubber.addEventListener('input', () => {
      callbacks.onSeek(Number.parseInt(els.scrubber.value, 10))
    })

    els.speedSlider.addEventListener('input', () => {
      callbacks.onSpeedChange(
        sliderToDelay(Number.parseInt(els.speedSlider.value, 10))
      )
    })
  }

  /** Read the current generator parameters from the inputs. */
  getParams(): GeneratorParams {
    const { els } = this
    return {
      source: els.inputSource.value.trim(),
      minOverlap: readInt(els.inputMinOverlap),
      minLength: readInt(els.inputMinLength),
      maxLength: readInt(els.inputMaxLength),
      fragmentCount: readInt(els.inputFragmentCount)
    }
  }

  /** Write generator parameters into the inputs. */
  setParams(params: GeneratorParams): void {
    const { els } = this
    els.inputSource.value = params.source
    els.inputMinOverlap.value = params.minOverlap.toString()
    els.inputMinLength.value = params.minLength.toString()
    els.inputMaxLength.value = params.maxLength.toString()
    els.inputFragmentCount.value = params.fragmentCount.toString()
  }

  /** Fill the manual fragment editor. */
  setCustomText(text: string): void {
    this.els.customTextarea.value = text
  }

  /** Reflect the playback state on the play/pause button. */
  setPlaying(playing: boolean): void {
    this.els.btnPlayPause.textContent = playing ? 'Pause ⏸' : 'Play ▶'
  }

  /** Reflect the playback delay on the speed slider. */
  setSpeed(delayMs: number): void {
    this.els.speedSlider.value = delayToSlider(delayMs).toString()
  }

  /** Update the scrubber, step label and step button states. */
  updateProgress(current: number, total: number): void {
    const { els } = this
    els.scrubber.max = Math.max(0, total - 1).toString()
    els.scrubber.value = current.toString()
    els.stepLabel.textContent = `Step ${current + 1} / ${Math.max(1, total)}`
    els.btnStepPrev.disabled = current <= 0
    els.btnStepNext.disabled = current >= total - 1
  }

  /** Show an explanation or error message below the controls. */
  setExplanation(text: string): void {
    this.els.explanation.textContent = text
  }
}
