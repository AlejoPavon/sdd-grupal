export class InMemoryRepositoryBase<T extends { id: string }> {
  protected readonly items = new Map<string, T>();

  async crear(item: T): Promise<T> {
    this.items.set(item.id, { ...item });
    return { ...item };
  }

  async buscarPorId(id: string): Promise<T | undefined> {
    const item = this.items.get(id);
    return item ? { ...item } : undefined;
  }

  async listar(): Promise<T[]> {
    return [...this.items.values()].map((item) => ({ ...item }));
  }
}