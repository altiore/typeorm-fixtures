import { DeepPartial, ObjectType } from 'typeorm';

export function fixtureCreator<EntityType, AllFixtures = any>(
  Entity: ObjectType<EntityType>,
  mapper: (entity: Partial<EntityType>, index: number) => EntityType | Partial<EntityType>,
) {
  return function createFixture(
    data: DeepPartial<EntityType>[] | number,
  ): { fixtures: (a: AllFixtures) => EntityType[]; Entity: ObjectType<EntityType> } {
    const entities: DeepPartial<EntityType>[] = typeof data === 'number' ? Array.apply(null, Array(data)) : data;
    const fixtures = (loadedFixtures: AllFixtures): EntityType[] => entities.map(mapper.bind(loadedFixtures));
    return { fixtures, Entity };
  };
}
