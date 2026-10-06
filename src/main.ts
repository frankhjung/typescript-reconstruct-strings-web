import { alignContigsToSource } from './alignment.js';
import { assembleWithTrace } from './assembler.js';
import { generateFragments } from './generator.js';
import { PRESETS } from './presets.js';
import {
  AlignmentReport,
  AssemblyStep,
  GeneratorParams,
  Preset
} from './types.js';
import { ControlsComponent } from './ui/controls.js';
import { renderDiffView } from './ui/diffView.js';
import { renderMergeTheatre } from './ui/mergeView.js';
import { renderPool } from './ui/poolView.js';

class App {
  private currentSource = 'ATGGCGTGCA';
  private steps: readonly AssemblyStep[] = [];
  private currentStepIndex = 0;
  private alignmentReport: AlignmentReport | null = null;

  private isPlaying = false;
  private playbackTimer: number | null = null;
  private stepDelayMs = 1000;

  private controls!: ControlsComponent;
  private poolContainer!: HTMLElement;
  private theatreContainer!: HTMLElement;
  private diffContainer!: HTMLElement;

  constructor() {
    this.initDOM();
    this.initControls();

    const searchParams = new URLSearchParams(window.location.search);
    const presetParam = searchParams.get('preset');
    const pIdx = presetParam !== null ? parseInt(presetParam, 10) : 0;
    const initialPreset = !isNaN(pIdx) && PRESETS[pIdx]
      ? PRESETS[pIdx]
      : PRESETS[0];

    this.loadPreset(initialPreset);

    const stepParam = searchParams.get('step');
    if (stepParam !== null) {
      const stepIdx = parseInt(stepParam, 10);
      if (!isNaN(stepIdx)) {
        this.seekTo(stepIdx);
      }
    }
  }

  private initDOM(): void {
    const root = document.getElementById('app') || document.body;
    root.innerHTML = `
      <div class="app-container">
        <header>
          <h1>Overlap-Layout-Consensus (OLC) Reconstruction</h1>
          <p>
            Interactive sequence assembler and stepwise animation workbench
            (REQ-003)
          </p>
        </header>

        <section id="controls-panel" class="panel"></section>

        <section class="panel">
          <div class="panel-title">
            <span>Fragment Pool Workspace</span>
          </div>
          <div id="pool-grid" class="pool-grid"></div>
        </section>

        <section class="panel">
          <div class="panel-title">
            <span>Overlap &amp; Merge Theatre</span>
          </div>
          <div id="theatre-container" class="theatre-container"></div>
        </section>

        <section class="panel">
          <div class="panel-title">
            <span>Reference Alignment &amp; Verification</span>
          </div>
          <div id="diff-container"></div>
        </section>
      </div>
    `;

    this.poolContainer = document.getElementById('pool-grid') as HTMLElement;
    this.theatreContainer = document.getElementById(
      'theatre-container'
    ) as HTMLElement;
    this.diffContainer = document.getElementById(
      'diff-container'
    ) as HTMLElement;
  }

  private initControls(): void {
    const controlsPanel = document.getElementById(
      'controls-panel'
    ) as HTMLElement;

    this.controls = new ControlsComponent(controlsPanel, PRESETS, {
      onGenerate: params => this.handleGenerate(params),
      onCustomFragments: (frags, n) => this.handleCustom(frags, n),
      onSelectPreset: preset => this.loadPreset(preset),
      onPlayPause: () => this.togglePlay(),
      onStepNext: () => this.stepNext(),
      onStepPrev: () => this.stepPrev(),
      onSeek: idx => this.seekTo(idx),
      onSpeedChange: delay => {
        this.stepDelayMs = delay;
        if (this.isPlaying) {
          this.stopPlayback();
          this.startPlayback();
        }
      },
      onReset: () => this.reset()
    });
  }

  private handleGenerate(params: GeneratorParams): void {
    this.stopPlayback();
    try {
      this.currentSource = params.source;
      const fragments = generateFragments(params);
      this.runAssembly(fragments, params.n);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.controls.setExplanation(`Error: ${msg}`);
    }
  }

  private handleCustom(fragments: string[], minOverlap: number): void {
    this.stopPlayback();
    if (fragments.length === 0) {
      this.controls.setExplanation('Error: Fragment pool cannot be empty.');
      return;
    }
    try {
      this.runAssembly(fragments, minOverlap);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.controls.setExplanation(`Error: ${msg}`);
    }
  }

  private loadPreset(preset: Preset): void {
    this.controls.setParams(preset.params);
    this.currentSource = preset.params.source;
    if (preset.defaultFragments && preset.defaultFragments.length > 0) {
      this.controls.setCustomText(preset.defaultFragments.join('\n'));
      this.runAssembly([...preset.defaultFragments], preset.params.n);
    } else {
      this.handleGenerate(preset.params);
    }
  }

  private runAssembly(fragments: string[], minOverlap: number): void {
    const result = assembleWithTrace(fragments, minOverlap);
    this.steps = result.steps;
    this.alignmentReport = alignContigsToSource(
      this.currentSource,
      result.contigs
    );
    this.currentStepIndex = 0;
    this.renderCurrentState();
  }

  private renderCurrentState(): void {
    if (this.steps.length === 0) {
      renderPool(this.poolContainer, null);
      renderMergeTheatre(this.theatreContainer, null);
      renderDiffView(this.diffContainer, null);
      return;
    }

    const currentStep = this.steps[this.currentStepIndex];
    renderPool(this.poolContainer, currentStep);
    renderMergeTheatre(this.theatreContainer, currentStep);
    renderDiffView(this.diffContainer, this.alignmentReport);

    this.controls.updateProgress(
      this.currentStepIndex,
      this.steps.length
    );
    this.controls.setExplanation(currentStep.description);
  }

  private togglePlay(): void {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  private startPlayback(): void {
    if (this.steps.length === 0) {
      return;
    }
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = 0;
      this.renderCurrentState();
    }
    this.isPlaying = true;
    this.controls.setPlaying(true);

    this.playbackTimer = window.setInterval(() => {
      if (this.currentStepIndex < this.steps.length - 1) {
        this.currentStepIndex++;
        this.renderCurrentState();
      } else {
        this.stopPlayback();
      }
    }, this.stepDelayMs);
  }

  private stopPlayback(): void {
    this.isPlaying = false;
    this.controls.setPlaying(false);
    if (this.playbackTimer !== null) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  private stepNext(): void {
    this.stopPlayback();
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.renderCurrentState();
    }
  }

  private stepPrev(): void {
    this.stopPlayback();
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.renderCurrentState();
    }
  }

  private seekTo(idx: number): void {
    this.stopPlayback();
    if (idx >= 0 && idx < this.steps.length) {
      this.currentStepIndex = idx;
      this.renderCurrentState();
    }
  }

  private reset(): void {
    this.stopPlayback();
    this.currentStepIndex = 0;
    this.renderCurrentState();
  }
}

// Bootstrap application on DOM ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    (window as unknown as { __app: App }).__app = new App();
  });
} else {
  (window as unknown as { __app: App }).__app = new App();
}
