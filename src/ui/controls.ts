import { GeneratorParams, Preset } from '../types.js';

export interface ControlsCallbacks {
  onGenerate: (params: GeneratorParams) => void;
  onCustomFragments: (fragments: string[], minOverlap: number) => void;
  onSelectPreset: (preset: Preset) => void;
  onPlayPause: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onSeek: (stepIndex: number) => void;
  onSpeedChange: (delayMs: number) => void;
  onReset: () => void;
}

export class ControlsComponent {
  private readonly container: HTMLElement;
  private readonly callbacks: ControlsCallbacks;

  private inputSource!: HTMLInputElement;
  private inputN!: HTMLInputElement;
  private inputA!: HTMLInputElement;
  private inputB!: HTMLInputElement;
  private inputM!: HTMLInputElement;
  private selectPreset!: HTMLSelectElement;

  private btnPlayPause!: HTMLButtonElement;
  private btnStepNext!: HTMLButtonElement;
  private btnStepPrev!: HTMLButtonElement;
  private btnReset!: HTMLButtonElement;
  private scrubber!: HTMLInputElement;
  private stepLabel!: HTMLSpanElement;
  private explanationEl!: HTMLElement;

  private customEditorSection!: HTMLElement;
  private customTextarea!: HTMLTextAreaElement;

  private isPlaying = false;

  constructor(
    container: HTMLElement,
    presets: readonly Preset[],
    callbacks: ControlsCallbacks
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.render(presets);
  }

  private render(presets: readonly Preset[]): void {
    this.container.innerHTML = `
      <div class="panel-title">
        <span>Assembly Parameters & Controls</span>
        <div class="btn-row">
          <select id="preset-select" aria-label="Load preset">
            <option value="" disabled selected>Load Preset...</option>
            ${presets
              .map(
                (p, idx) => `<option value="${idx}">${p.name}</option>`
              )
              .join('')}
          </select>
        </div>
      </div>

      <div class="grid-params">
        <div class="form-group full-width">
          <label for="param-source">Source Sequence (Ground Truth)</label>
          <input
            id="param-source"
            type="text"
            value="ATGGCGTGCA"
            spellcheck="false"
          />
        </div>
        <div class="form-group">
          <label for="param-n">Min Overlap (n)</label>
          <input id="param-n" type="number" min="2" value="2" />
        </div>
        <div class="form-group">
          <label for="param-a">Min Length (a)</label>
          <input id="param-a" type="number" min="2" value="4" />
        </div>
        <div class="form-group">
          <label for="param-b">Max Length (b)</label>
          <input id="param-b" type="number" min="2" value="6" />
        </div>
        <div class="form-group">
          <label for="param-m">Fragment Count (m)</label>
          <input id="param-m" type="number" min="2" value="6" />
        </div>
      </div>

      <div class="btn-row">
        <button id="btn-generate" class="primary">
          Generate Fragments
        </button>
        <button id="btn-toggle-custom">
          Manual Fragment Pool
        </button>
        <button id="btn-reset">
          Reset
        </button>
      </div>

      <div id="custom-editor" style="display: none; margin-top: 1rem;">
        <label for="custom-fragments">
          Custom Fragments (one per line or comma-separated)
        </label>
        <textarea
          id="custom-fragments"
          rows="3"
          placeholder="ABC\nBCD\nCDE"
        ></textarea>
        <div class="btn-row" style="margin-top: 0.5rem;">
          <button id="btn-apply-custom" class="accent">
            Apply Custom Pool
          </button>
        </div>
      </div>

      <div class="playback-bar">
        <div class="playback-controls">
          <button id="btn-play-pause" class="accent" title="Play / Pause">
            Play ▶
          </button>
          <button id="btn-step-prev" title="Step Backward">
            ⏮ Prev
          </button>
          <button id="btn-step-next" title="Step Forward">
            Next ⏭
          </button>
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
          <label for="speed-slider" style="margin:0;">Speed</label>
          <input
            id="speed-slider"
            type="range"
            min="200"
            max="2000"
            step="100"
            value="800"
            aria-label="Animation playback speed"
          />
        </div>
      </div>

      <div id="status-explanation" class="status-explanation">
        Initialise parameters and click Generate Fragments to begin.
      </div>
    `;

    this.inputSource = this.container.querySelector(
      '#param-source'
    ) as HTMLInputElement;
    this.inputN = this.container.querySelector(
      '#param-n'
    ) as HTMLInputElement;
    this.inputA = this.container.querySelector(
      '#param-a'
    ) as HTMLInputElement;
    this.inputB = this.container.querySelector(
      '#param-b'
    ) as HTMLInputElement;
    this.inputM = this.container.querySelector(
      '#param-m'
    ) as HTMLInputElement;
    this.selectPreset = this.container.querySelector(
      '#preset-select'
    ) as HTMLSelectElement;

    this.btnPlayPause = this.container.querySelector(
      '#btn-play-pause'
    ) as HTMLButtonElement;
    this.btnStepNext = this.container.querySelector(
      '#btn-step-next'
    ) as HTMLButtonElement;
    this.btnStepPrev = this.container.querySelector(
      '#btn-step-prev'
    ) as HTMLButtonElement;
    this.btnReset = this.container.querySelector(
      '#btn-reset'
    ) as HTMLButtonElement;
    this.scrubber = this.container.querySelector(
      '#scrubber'
    ) as HTMLInputElement;
    this.stepLabel = this.container.querySelector(
      '#step-label'
    ) as HTMLSpanElement;
    this.explanationEl = this.container.querySelector(
      '#status-explanation'
    ) as HTMLElement;

    this.customEditorSection = this.container.querySelector(
      '#custom-editor'
    ) as HTMLElement;
    this.customTextarea = this.container.querySelector(
      '#custom-fragments'
    ) as HTMLTextAreaElement;

    this.setupListeners(presets);
  }

  private setupListeners(presets: readonly Preset[]): void {
    this.selectPreset.addEventListener('change', () => {
      const idx = parseInt(this.selectPreset.value, 10);
      if (!isNaN(idx) && presets[idx]) {
        const preset = presets[idx];
        this.setParams(preset.params);
        this.callbacks.onSelectPreset(preset);
      }
    });

    const btnGenerate = this.container.querySelector(
      '#btn-generate'
    ) as HTMLButtonElement;
    btnGenerate.addEventListener('click', () => {
      this.callbacks.onGenerate(this.getParams());
    });

    const btnToggleCustom = this.container.querySelector(
      '#btn-toggle-custom'
    ) as HTMLButtonElement;
    btnToggleCustom.addEventListener('click', () => {
      const isHidden = this.customEditorSection.style.display === 'none';
      this.customEditorSection.style.display = isHidden ? 'block' : 'none';
    });

    const btnApplyCustom = this.container.querySelector(
      '#btn-apply-custom'
    ) as HTMLButtonElement;
    btnApplyCustom.addEventListener('click', () => {
      const text = this.customTextarea.value.trim();
      const fragments = text
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      const minOverlap = parseInt(this.inputN.value, 10) || 2;
      this.callbacks.onCustomFragments(fragments, minOverlap);
    });

    this.btnPlayPause.addEventListener('click', () => {
      this.callbacks.onPlayPause();
    });

    this.btnStepNext.addEventListener('click', () => {
      this.callbacks.onStepNext();
    });

    this.btnStepPrev.addEventListener('click', () => {
      this.callbacks.onStepPrev();
    });

    this.btnReset.addEventListener('click', () => {
      this.callbacks.onReset();
    });

    this.scrubber.addEventListener('input', () => {
      const val = parseInt(this.scrubber.value, 10);
      this.callbacks.onSeek(val);
    });

    const speedSlider = this.container.querySelector(
      '#speed-slider'
    ) as HTMLInputElement;
    speedSlider.addEventListener('input', () => {
      // Invert so higher slider value = faster (lower delay)
      const maxVal = parseInt(speedSlider.max, 10);
      const minVal = parseInt(speedSlider.min, 10);
      const currentVal = parseInt(speedSlider.value, 10);
      const inverted = maxVal + minVal - currentVal;
      this.callbacks.onSpeedChange(inverted);
    });
  }

  public getParams(): GeneratorParams {
    return {
      source: this.inputSource.value.trim(),
      n: parseInt(this.inputN.value, 10),
      a: parseInt(this.inputA.value, 10),
      b: parseInt(this.inputB.value, 10),
      m: parseInt(this.inputM.value, 10)
    };
  }

  public setParams(params: GeneratorParams): void {
    this.inputSource.value = params.source;
    this.inputN.value = params.n.toString();
    this.inputA.value = params.a.toString();
    this.inputB.value = params.b.toString();
    this.inputM.value = params.m.toString();
  }

  public setCustomText(text: string): void {
    this.customTextarea.value = text;
  }

  public setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    this.btnPlayPause.textContent = playing ? 'Pause ⏸' : 'Play ▶';
  }

  public updateProgress(current: number, total: number): void {
    this.scrubber.max = Math.max(0, total - 1).toString();
    this.scrubber.value = current.toString();
    this.stepLabel.textContent = `Step ${current + 1} / ${Math.max(1, total)}`;
    this.btnStepPrev.disabled = current <= 0;
    this.btnStepNext.disabled = current >= total - 1;
  }

  public setExplanation(text: string): void {
    this.explanationEl.textContent = text;
  }
}
