// Pizza Size Selector Component
export class PizzaSizeSelector {
  private container: HTMLElement;
  private currentSize: number;
  private onSizeChange: (size: number) => void;
  private slices: HTMLElement[] = [];
  private locked: number = 0; // Number of slices selected

  constructor(container: HTMLElement, initialSize: number, onSizeChange: (size: number) => void) {
    this.container = container;
    this.currentSize = initialSize;
    this.locked = initialSize + 1; // Convert to 1-based for display
    this.onSizeChange = onSizeChange;
    this.init();
  }

  private init(): void {
    this.container.innerHTML = `
      <div class="pizza-size-selector">
        <div class="pizza" id="pizza">
          <div class="slice s1" data-n="1"></div>
          <div class="slice s2" data-n="2"></div>
          <div class="slice s3" data-n="3"></div>
          <div class="slice s4" data-n="4"></div>
          <div class="slice s5" data-n="5"></div>
          <div class="slice s6" data-n="6"></div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const pizza = this.container.querySelector('#pizza') as HTMLElement;
    if (pizza) {
      this.slices = Array.from(pizza.querySelectorAll('.slice')) as HTMLElement[];

      // Use touch events for mobile (immediate response)
      pizza.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pizza.classList.add('pressed');
        this.cycleSize();
      });

      pizza.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pizza.classList.remove('pressed');
      });

      // Use click events for desktop
      pizza.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cycleSize();
      });

      // Initialize with current selection
      this.highlight(this.locked);
    }
  }

  private cycleSize(): void {
    // Cycle through sizes 0-5 (display as 1-6)
    this.currentSize = (this.currentSize + 1) % 6;
    this.locked = this.currentSize + 1; // Convert to 1-based for display
    this.highlight(this.locked);
    this.onSizeChange(this.currentSize);
  }

  // Function to highlight slices up to a given number
  private highlight(n: number): void {
    this.slices.forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.n || '1') <= n);
    });
  }

  public setSize(size: number): void {
    this.currentSize = size;
    this.locked = size + 1; // Convert to 1-based for display
    this.highlight(this.locked);
    this.onSizeChange(size);
  }

  public getSize(): number {
    return this.currentSize;
  }
}