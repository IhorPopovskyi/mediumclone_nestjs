import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedDb1682866706205 implements MigrationInterface {
  name = "SeedDb1682866706205";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO tags (name) VALUES ('dragons'), ('coffee'), ('nestjs')`,
    );

    // password: 123
    await queryRunner.query(
      `INSERT INTO users (username, email, password) VALUES ('foo', 'foo@gmail.com', '$2b$10$akHA0312HmGfHbcq3f3YGOYDJc9ekyfqJmeLdfgc1OgIE.tIy/yFC')`,
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('first-article', 'First Article', 'first article description', 'first article body', 'coffee,dragons', '1')`,
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('second-article', 'Second Article', 'second article description', 'second article body', 'coffee,dragons', '1')`,
    );
  }

  public async down(): Promise<void> {}
}
