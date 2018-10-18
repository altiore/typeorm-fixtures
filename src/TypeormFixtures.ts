import {
  Connection,
  ConnectionOptions,
  createConnection,
  DeleteResult,
  FindConditions,
  FindOneOptions,
  getConnection,
  In,
  ObjectID,
  ObjectType,
} from 'typeorm';

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
      if (this.debug)
        console.log(
          `${TypeormFixtures.name}.loadFixtures: founded fixture ${findEntityName}`,
          this.entities[findEntityName],
        );
    }
    for (const entityName of Object.keys(this.fixtures)) {
      const { fixtures, Entity } = this.fixtures[entityName];
      currentRepo = this.connection.getRepository(Entity);
      const preparedData = fixtures(this.entities).map((entity) => {
        return currentRepo.create(entity);
      });
      this.entities[entityName] = await currentRepo.save(preparedData);
      if (this.debug)
        console.log(`${TypeormFixtures.name}.loadFixtures: loaded fixture ${entityName}`, this.entities[entityName]);
    }
    return this.entities;
  };

  public dropFixtures = async (): Promise<void> => {
    try {
      let currentRepo;
      for (const entityName of Object.keys(this.fixtures).reverse()) {
        const { Entity } = this.fixtures[entityName];
        currentRepo = this.connection.getRepository(Entity);
        if (this.entities[entityName]) {
          await currentRepo.delete({ id: In(this.entities[entityName].map((el) => el.id)) });
          delete this.entities[entityName];
          if (this.debug) console.log(`${TypeormFixtures.name}.dropFixtures: ${entityName} dropped`);
        } else {
          const errorText = `${TypeormFixtures.name}.dropFixtures: Could not find entities by name ${entityName}`;
          if (this.debug) console.log(errorText);
          throw new Error(errorText);
        }
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
    if (this.debug) console.log(`${Entity.name} -> ${TypeormFixtures.name}.addFixture`, { fixtures, Entity });
    return this;
  }

  public findEntities(findCondition, Entity) {
    this.findFixtures[Entity.name] = { findCondition, Entity };
    if (this.debug) console.log(`${Entity.name} -> ${TypeormFixtures.name}.findEntities`, { findCondition, Entity });
    return this;
  }

  public async removeCreated<EntityType>(
    Entity: ObjectType<EntityType>,
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectID
      | ObjectID[]
      | FindConditions<EntityType>,
  ): Promise<DeleteResult> {
    const repoForRemove = this.connection.getRepository(Entity);
    return await repoForRemove.delete(criteria);
  }

  public async findOneExisting<EntityType>(Entity: ObjectType<EntityType>, criteria): Promise<EntityType> {
    const repo = this.connection.getRepository(Entity);
    return await repo.findOne(criteria);
  }

  public async findManyExisting<EntityType>(Entity: ObjectType<EntityType>, criteria): Promise<EntityType[]> {
    const repo = this.connection.getRepository(Entity);
    return await repo.find(criteria);
  }

  private async getConnection() {
    const config = require(`${process.cwd()}/ormconfig.js`);
    if (config) {
      this.connection = await createConnection({
        name: TypeormFixtures.name,
        ...(config as ConnectionOptions),
      });
    } else {
      this.connection = getConnection();
    }
    if (this.debug) console.log(`${TypeormFixtures.name}.getConnection`);
  }
}
