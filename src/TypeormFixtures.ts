import { Connection, ConnectionOptions, createConnection, getConnection, In, ObjectType } from 'typeorm';

export class TypeormFixtures<AllFixtures = any[]> {
  public entities: Record<string, any[]> = {};
  private connection: Connection;
  private fixtures: Record<string, { fixtures: (loadedFixtures: any) => any[]; Entity: ObjectType<any> }> = {};
  private findFixtures: Record<string, { findCondition: any; Entity: ObjectType<any> }> = {};

  constructor(public readonly debug: boolean = false) {}

  public loadFixtures = async (): Promise<Record<string, any[]>> => {
    await this.getConnection();
    let currentRepo;
    for (const findEntityName of Object.keys(this.findFixtures)) {
      const { findCondition, Entity } = this.findFixtures[findEntityName];
      currentRepo = this.connection.getRepository(Entity);
      this.entities[findEntityName] = await currentRepo.find(findCondition);
      if (this.debug) console.log(`${findEntityName} fixture found`, this.entities[findEntityName]);
    }
    for (const entityName of Object.keys(this.fixtures)) {
      const { fixtures, Entity } = this.fixtures[entityName];
      currentRepo = this.connection.getRepository(Entity);
      const preparedData = fixtures(this.entities).map((entity) => {
        return currentRepo.create(entity);
      });
      this.entities[entityName] = await currentRepo.save(preparedData);
      if (this.debug) console.log(`${entityName} fixture added`, this.entities[entityName]);
    }
    return this.entities;
  };

  public dropFixtures = async (): Promise<void> => {
    try {
      let currentRepo;
      for (const entityName of Object.keys(this.fixtures)) {
        const { Entity } = this.fixtures[entityName];
        currentRepo = this.connection.getRepository(Entity);
        await currentRepo.delete({ id: In(this.entities[entityName].map((el) => el.id)) });
        if (this.debug) console.log(`${entityName} fixture dropped`);
        delete this.entities[entityName];
      }
      await this.connection.close();
    } catch (e) {
      if (this.debug) console.log('dropFixtures ERROR', e);
      throw e;
    }
  };

  public addFixture<EntityType>({
    fixtures,
    Entity,
  }: {
    fixtures: (loadedFixtures: any) => any[];
    Entity: ObjectType<EntityType>;
  }) {
    this.fixtures[Entity.name] = { fixtures, Entity };
    return this;
  }

  public findEntities(findCondition, Entity) {
    this.findFixtures[Entity.name] = { findCondition, Entity };
    return this;
  }

  private async getConnection() {
    const config = require(`${process.cwd()}/ormconfig.js`);
    if (config) {
      this.connection = await createConnection({
        name: 'TypeormFixtures',
        ...(config as ConnectionOptions),
      });
    } else {
      this.connection = getConnection();
    }
  }
}
