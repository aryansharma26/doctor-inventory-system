export interface Repository<TEntity, TCreate, TUpdate> {
  findById(id: string): Promise<TEntity | null>;
  create(data: TCreate): Promise<TEntity>;
  update(id: string, data: TUpdate): Promise<TEntity>;
}

