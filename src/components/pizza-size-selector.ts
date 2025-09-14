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

      // Handle hovering for preview (CSS handles the visual feedback)
      pizza.addEventListener('mouseover', (e) => {
        // Check if the target is a slice
        if ((e.target as HTMLElement).classList.contains('slice')) {
          const n = parseInt((e.target as HTMLElement).dataset.n || '1');
          this.highlight(n);
        }
      });

      // Handle mouse leaving the whole pizza area to reset the preview
      pizza.addEventListener('mouseleave', () => {
        this.highlight(this.locked);
      });

      // Handle click to "lock" the selection
      pizza.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('slice')) {
          this.locked = parseInt((e.target as HTMLElement).dataset.n || '1');
          this.highlight(this.locked);
          const sizeIndex = this.locked - 1; // Convert to 0-based index
          this.setSize(sizeIndex);
        }
      });

      // Initialize with current selection
      this.highlight(this.locked);
    }
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