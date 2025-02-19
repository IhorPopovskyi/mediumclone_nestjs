import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UserEntity } from "@app/user/user.entity";
import { CreateArticleDto } from "@app/article/dto/createArticle.dto";
import { ArticleEntity } from "@app/article/article.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeleteResult, getRepository, Repository } from "typeorm";
import { ArticleResponseInterface } from "@app/article/types/articleResponse.interface";
import slugify from "slugify";
import { ArticlesResponseInterface } from "@app/article/types/articlesResponse.interface";
import { FollowEntity } from "@app/profile/follow.entity";

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
    private dataSource: DataSource,
  ) {}

  async findAll(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const queryBuilder = this.dataSource
      .getRepository(ArticleEntity)
      .createQueryBuilder("articles")
      .leftJoinAndSelect("articles.author", "author");

    queryBuilder.orderBy("articles.createdAt", "DESC");

    const articlesCount = await queryBuilder.getCount();

    if (query.tag) {
      queryBuilder.andWhere("articles.tagList LIKE :tag", {
        tag: `%${query.tag}%`,
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        where: { username: query.author },
      });
      queryBuilder.andWhere("articles.authorId = :id", {
        id: author.id,
      });
    }

    if (query.favorited) {
      const author = await this.userRepository.findOne({
        where: { username: query.favorited },
        relations: ["favorites"],
      });
      const ids = author.favorites.map((el) => el.id);

      if (ids.length) {
        queryBuilder.andWhere("articles.id IN (:...ids)", { ids });
      } else {
        queryBuilder.andWhere("1=0");
      }
    }

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    let favoriteIds: number[] = [];

    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId },
        relations: ["favorites"],
      });
      favoriteIds = currentUser.favorites.map((favorite) => favorite.id);
    }

    const articles = await queryBuilder.getMany();
    const articlesWithFaforites = articles.map((article) => {
      const favorited = favoriteIds.includes(article.id);
      return { ...article, favorited };
    });

    return { articles: articlesWithFaforites, articlesCount };
  }

  async getFeed(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const follow = await this.followRepository.find({
      where: { followerId: currentUserId },
    });

    if (!follow.length) {
      return { articles: [], articlesCount: 0 };
    }

    const followingUserIds = follow.map((follow) => follow.followingId);
    const queryBuilder = this.dataSource
      .getRepository(ArticleEntity)
      .createQueryBuilder("articles")
      .leftJoinAndSelect("articles.author", "author")
      .where("articles.authorId IN (:...ids)", { ids: followingUserIds });

    queryBuilder.orderBy("articles.createdAt", "DESC");

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();

    return { articles, articlesCount };
  }

  async createArticle(
    currentUser: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, createArticleDto);

    if (!article.tagList) {
      article.tagList = [];
    }

    article.slug = this.getSlug(createArticleDto.title);

    article.author = currentUser;

    return await this.articleRepository.save(article);
  }

  async updateArticle(
    slug: string,
    updateArticleDto: CreateArticleDto,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);

    if (!article) {
      throw new HttpException("Article does not exist", HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== currentUserId) {
      throw new HttpException("You are not an author", HttpStatus.FORBIDDEN);
    }

    Object.assign(article, updateArticleDto);

    return await this.articleRepository.save(article);
  }

  async findBySlug(slug: string): Promise<ArticleEntity> {
    return await this.articleRepository.findOne({ where: { slug } });
  }

  async deleteArticle(slug, currentUserId): Promise<DeleteResult> {
    const article = await this.findBySlug(slug);

    if (!article) {
      throw new HttpException("Article does not exist", HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== currentUserId) {
      throw new HttpException("You are not an author", HttpStatus.FORBIDDEN);
    }

    return await this.articleRepository.delete({ slug });
  }

  async addArticleToFavorites(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ["favorites"],
    });
    const isNoFavorited =
      user.favorites.findIndex(
        (articleInFavorites) => articleInFavorites.id === article.id,
      ) === -1;

    if (isNoFavorited) {
      user.favorites.push(article);
      article.favoritesCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async deleteArticleFromFavorites(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ["favorites"],
    });
    const articleIndex = user.favorites.findIndex(
      (articleInFavorites) => articleInFavorites.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount--;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      "-" +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }
}
