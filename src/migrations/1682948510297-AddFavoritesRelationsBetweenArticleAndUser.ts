import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFavoritesRelationsBetweenArticleAndUser1682948510297
  implements MigrationInterface
{
  name = "AddFavoritesRelationsBetweenArticleAndUser1682948510297";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users_favorites_articles" ("usersId" integer NOT NULL, "articlesId" integer NOT NULL, CONSTRAINT "PK_aebb5070a5fa58957adae6d78af" PRIMARY KEY ("usersId", "articlesId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b3bc5ca3e98f5f3858dbf626ad" ON "users_favorites_articles" ("usersId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_61dc60abcf0035e5ce2aea013b" ON "users_favorites_articles" ("articlesId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "PK_1123ff6815c5b8fec0ba9fec370"`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "PK_66fd757f2bc303c7ba65a8c4c71" PRIMARY KEY ("slug", "id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "PK_66fd757f2bc303c7ba65a8c4c71"`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_favorites_articles" ADD CONSTRAINT "FK_b3bc5ca3e98f5f3858dbf626ad6" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_favorites_articles" ADD CONSTRAINT "FK_61dc60abcf0035e5ce2aea013bc" FOREIGN KEY ("articlesId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_favorites_articles" DROP CONSTRAINT "FK_61dc60abcf0035e5ce2aea013bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_favorites_articles" DROP CONSTRAINT "FK_b3bc5ca3e98f5f3858dbf626ad6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334"`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "PK_66fd757f2bc303c7ba65a8c4c71" PRIMARY KEY ("id", "slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "PK_66fd757f2bc303c7ba65a8c4c71"`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "PK_1123ff6815c5b8fec0ba9fec370" PRIMARY KEY ("slug")`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_61dc60abcf0035e5ce2aea013b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b3bc5ca3e98f5f3858dbf626ad"`,
    );
    await queryRunner.query(`DROP TABLE "users_favorites_articles"`);
  }
}
