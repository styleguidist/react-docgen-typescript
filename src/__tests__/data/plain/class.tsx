/**
 * Calculator!
 */
export default class Calculator {
  private _history: string[];

  /**
   * Constructor
   */
  constructor() {
    this._history = [];
  }

  /**
   * Get the history
   */
  get history() {
    return this._history.map((h) => h.toString()).join("");
  }

  /**
   * Add two numbers
   * @aCustomTag
   * @param a
   * @param b
   */
  public add(a: number, b: number) {
    const result = a + b;
    this._history.push(`${a} + ${b} = ${result}`);
    return result;
  }

  /**
   * Subtract two numbers
   * @someCoolTag
   * @param a
   * @param b
   */
  public sub(a: number, b: number) {
    const result = a - b;
    this._history.push(`${a} - ${b} = ${result}`);
    return result;
  }
}
