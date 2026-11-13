type Fn = (...args: any[]) => void;

/** Emissor mínimo de eventos (substitui node:events para o núcleo rodar em qualquer lugar). */
export class Emitter {
  private handlers = new Map<string, Set<Fn>>();
  on(ev: string, fn: Fn): this {
    (this.handlers.get(ev) ?? this.handlers.set(ev, new Set()).get(ev)!).add(fn);
    return this;
  }
  off(ev: string, fn: Fn): this {
    this.handlers.get(ev)?.delete(fn);
    return this;
  }
  emit(ev: string, ...args: unknown[]): boolean {
    const set = this.handlers.get(ev);
    if (!set?.size) return false;
    for (const fn of [...set]) fn(...args);
    return true;
  }
}
