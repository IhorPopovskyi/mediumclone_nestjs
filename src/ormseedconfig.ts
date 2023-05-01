import ormconfig from "@app/ormconfig";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const ormseedconfig: PostgresConnectionOptions = {
  ...ormconfig,
  migrations: ["src/seeds/*.ts"],
};

export default ormseedconfig;
