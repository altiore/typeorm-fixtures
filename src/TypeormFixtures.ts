import {
  Connection,
  ConnectionOptions,
  DeleteResult,
  FindConditions,
  In,
  ObjectID,
  ObjectType,
  createConnection,
} from 'typeorm';

export class TypeormFixtures<AllFixtures = any[]> {
  public entities: Record<string, any[]> = {};
  public connection: Connection;
  private fixtures: Record<string, { fixtures: (loadedFixtures: any) => any[]; Entity: ObjectType<any> }> = {};
  private findFixtures: Record<string, { findCondition: any; Entity: ObjectType<any> }> = {};

  constructor(public readonly debug: boolean = false, private readonly config?: ConnectionOptions) {}

  public loadFixtures = async (
    _fixtures?: Array<{
      fixtures: (loadedFixtures: any) => any[];
      Entity: ObjectType<any>;
    }>,
  ): Promise<Record<string, any[]>> => {
    if (Array.isArray(_fixtures)) {
      _fixtures.forEach((fixture) => {
        this.addFixture.bind(this)(fixture);
      });
    }
    await this.getConnection();
    let currentRepo;
    for (const findEntityName of Object.keys(this.findFixtures)) {
      const { findCondition, Entity } = this.findFixtures[findEntityName];
      currentRepo = this.connection.getRepository(Entity);
      this.entities[findEntityName] = await currentRepo.find(findCondition);
      this.showInfo(
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
      this.showInfo(`${TypeormFixtures.name}.loadFixtures: loaded fixture ${entityName}`, this.entities[entityName]);
    }
    await this.connection.close();
    return this.entities;
  };

  public dropFixtures = async (): Promise<void> => {
    try {
      await this.getConnection();
      let currentRepo;
      for (const entityName of Object.keys(this.fixtures).reverse()) {
        const { Entity } = this.fixtures[entityName];
        currentRepo = this.connection.getRepository(Entity);
        if (this.entities[entityName]) {
          await currentRepo.delete({ id: In(this.entities[entityName].map((el) => el.id)) });
          delete this.entities[entityName];
          this.showInfo(`${TypeormFixtures.name}.dropFixtures: ${entityName} dropped`);
        } else {
          const errorText = `${TypeormFixtures.name}.dropFixtures: Could not find entities by name ${entityName}`;
          this.showError(errorText);
          throw new Error(errorText);
        }
      }
    } catch (e) {
      this.showError('dropFixtures ERROR', e);
    } finally {
      await this.close();
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
    const l = fixtures.length;
    this.showInfo(`${TypeormFixtures.name}.addFixture -> ${l} of ${Entity.name}${l === 1 ? '' : "'s"}`);
    return this;
  }

  public findEntities(findCondition, Entity) {
    this.findFixtures[Entity.name] = { findCondition, Entity };
    this.showInfo(`${Entity.name} -> ${TypeormFixtures.name}.findEntities`, { findCondition, Entity });
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

  public async close() {
    if (this.connection) {
      await this.connection.close();
    }

    this.entities = null;
    this.connection = null;
    this.fixtures = null;
    this.findFixtures = null;
  }

  private async getConnection() {
    let config = null;
    try {
      if (this.config) {
        config = this.config;
        if (!config.entities?.length || typeof config.entities[0] === 'string') {
          const error = 'config.entities должны быть указаны явно для корректной работы' + ' TypeormFixtures';
          throw new Error(error);
        }
      } else {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          config = require(`${process.cwd()}/ormconfig.ts`)?.default;
        } catch (e) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            config = require(`${process.cwd()}/ormconfig.js`)?.default;
          } catch (err) {}
        }

        // TODO: нужно загрузить все сущности, т.к. для корректной работы они должны быть
        //  указаны явно
      }

      if (config) {
        this.connection = await createConnection({
          name: TypeormFixtures.name,
          ...(config as ConnectionOptions),
        });
      } else {
        throw new Error(
          'Could not create connection because of ormconfig.ts/js file was not found and config was not provided to constructor',
        );
      }

      this.showInfo(`${TypeormFixtures.name}.getConnection`);
    } catch (error) {
      this.showError(error);
      throw error;
    }
  }

  private showError(error: any, ...args: any) {
    if (this.debug) {
      if (args?.length) {
        console.error(error, args);
      } else {
        console.error(error);
      }
    }
  }

  private showInfo(info: any, ...args: any) {
    if (this.debug) {
      if (args?.length) {
        console.info(info, args);
      } else {
        console.info(info);
      }
    }
  }
}
