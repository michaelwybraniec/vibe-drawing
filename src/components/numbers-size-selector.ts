// Numbers Size Selector Component for Mobile - Single Button
export class NumbersSizeSelector {
  private container: HTMLElement;
  private currentSize: number;
  private onSizeChange: (size: number) => void;
  private button: HTMLElement | null = null;

  constructor(container: HTMLElement, initialSize: number, onSizeChange: (size: number) => void) {
    this.container = container;
    this.currentSize = initialSize;
    this.onSizeChange = onSizeChange;
    this.init();
  }

  private init(): void {
    this.container.innerHTML = `
      <div class="numbers-size-selector">
        <button class="size-number-btn" id="size-number-btn">
          ${this.currentSize + 1}
        </button>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.button = this.container.querySelector('#size-number-btn') as HTMLElement;

    if (this.button) {
      this.button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cycleSize();
      });

      // Add touch feedback
      this.button.addEventListener('touchstart', () => {
        this.button?.classList.add('pressed');
      });

      this.button.addEventListener('touchend', () => {
        this.button?.classList.remove('pressed');
      });
    }
  }

  private cycleSize(): void {
    // Cycle through sizes 0-5 (display as 1-6)
    this.currentSize = (this.currentSize + 1) % 6;
    this.updateButtonText();
    this.onSizeChange(this.currentSize);
  }

  private updateButtonText(): void {
    if (this.button) {
      this.button.textContent = `${this.currentSize + 1}`;
    }
  }

  public setSize(size: number): void {
    this.currentSize = size;
    this.updateButtonText();
    this.onSizeChange(size);
  }

  public getSize(): number {
    return this.currentSize;
  }
}
