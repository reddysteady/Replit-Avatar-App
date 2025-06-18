/**
 * Content Service
 * Handles content ingestion, processing, and embedding for the RAG pipeline
 */
// See CHANGELOG.md for 2025-06-19 [Schema]

import { db } from '../db'
import { storage } from '../storage'
import { aiService } from './openai'
import { eq, desc } from 'drizzle-orm'
import { contentItems, type InsertContentItem } from '@shared/schema'
import { log } from '../logger'

interface ContentSource {
  id: string
  type: 'post' | 'video' | 'blog'
  url: string
  title: string
  content: string
  publishedAt: Date
  engagement: {
    likes: number
    comments: number
    shares: number
  }
}

export interface ContentSourceFetcher {
  fetch(userId: number, since: Date): Promise<ContentSource[]>
}

export class MockContentFetcher implements ContentSourceFetcher {
  async fetch(userId: number, since: Date): Promise<ContentSource[]> {
    // For development: Generate some sample content
    return [
      {
        id: `post_${Date.now()}_1`,
        type: 'post',
        url: 'https://instagram.com/p/sample1',
        title: 'Amazing encounter with sea turtles today!',
        content:
          "Had the most incredible dive today and encountered a family of green sea turtles! These magnificent creatures can live over 80 years and travel thousands of miles across oceans. Did you know that sea turtles use Earth's magnetic field to navigate? They return to the exact beach where they were born to lay their eggs. It's absolutely mind-blowing how they remember their birthplace after decades in the ocean. Conservation efforts are crucial - always maintain distance and never touch marine wildlife!",
        publishedAt: new Date(),
        engagement: {
          likes: 1200,
          comments: 150,
          shares: 45,
        },
      },
      {
        id: `video_${Date.now()}_1`,
        type: 'video',
        url: 'https://youtube.com/watch?v=sample1',
        title: 'The Secret Lives of Octopuses - Intelligence Underwater',
        content:
          "Octopuses are among the most intelligent invertebrates on Earth! In today's video, I explore their incredible problem-solving abilities and camouflage skills. These eight-armed wonders have three hearts, blue blood, and can change both color and texture in milliseconds. I've observed them using tools, solving mazes, and even showing what appears to be playful behavior. The mimic octopus can imitate over 15 different species! Their intelligence rivals that of many vertebrates, yet they live only 1-2 years. It's a reminder of how diverse and fascinating ocean life truly is.",
        publishedAt: new Date(),
        engagement: {
          likes: 3500,
          comments: 420,
          shares: 210,
        },
      },
      {
        id: `blog_${Date.now()}_1`,
        type: 'blog',
        url: 'https://myblog.com/sample1',
        title: 'The Mysterious World of Deep Sea Creatures',
        content:
          "The deep ocean is Earth's final frontier, home to creatures that seem like they're from another planet. Bioluminescent jellyfish create living light shows in the darkness, while giant tube worms thrive around volcanic vents without sunlight. The vampire squid isn't actually a squid or vampire - it's a unique cephalopod that can turn itself inside out when threatened! Anglerfish use their glowing lure to attract prey in the pitch-black depths. These adaptations showcase millions of years of evolution in extreme conditions. Every deep-sea expedition reveals new species, reminding us how much we still don't know about our own planet.",
        publishedAt: new Date(),
        engagement: {
          likes: 890,
          comments: 75,
          shares: 120,
        },
      },
    ]
  }
}

export class InstagramPostFetcher implements ContentSourceFetcher {
  async fetch(userId: number, since: Date): Promise<ContentSource[]> {
    log(`Fetching Instagram posts since ${since.toISOString()}`)
    // TODO: integrate with Instagram API
    return []
  }
}

export class YouTubeVideoFetcher implements ContentSourceFetcher {
  async fetch(userId: number, since: Date): Promise<ContentSource[]> {
    log(`Fetching YouTube videos since ${since.toISOString()}`)
    // TODO: integrate with YouTube API
    return []
  }
}

export class RSSContentFetcher implements ContentSourceFetcher {
  async fetch(userId: number, since: Date): Promise<ContentSource[]> {
    log(`Fetching RSS/blog posts since ${since.toISOString()}`)
    // TODO: integrate with RSS feed reader
    return []
  }
}

export class ContentService {
  private fetchers: ContentSourceFetcher[]

  constructor(fetchers: ContentSourceFetcher[] = [new MockContentFetcher()]) {
    this.fetchers = fetchers
  }

  registerFetcher(fetcher: ContentSourceFetcher) {
    this.fetchers.push(fetcher)
  }
  /**
   * Ingests and processes new content from various sources
   * @param userId The user ID to ingest content for
   * @param forceRefresh Force refresh all content (vs. only new content)
   */
  async ingestContent(userId: number, forceRefresh: boolean = false) {
    try {
      log(`Starting content ingestion for user ${userId}`)

      // Step 1: Fetch content from various sources
      const lastIngestedDate = forceRefresh
        ? new Date(0)
        : await this.getLastIngestionDate(userId)

      const sources: ContentSource[] = []
      for (const fetcher of this.fetchers) {
        const fetched = await fetcher.fetch(userId, lastIngestedDate)
        sources.push(...fetched)
      }

      // Step 2: Filter content by engagement
      const highEngagementContent = this.filterByEngagement(sources)

      // Step 3: Process each content item
      const results = await Promise.allSettled(
        highEngagementContent.map((source) =>
          this.processContent(source, userId),
        ),
      )

      // Step 4: Log results
      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      log(
        `Content ingestion complete: ${successful} items processed, ${failed} failed`,
      )

      return {
        success: true,
        processed: successful,
        failed,
        message: `Content ingestion complete: ${successful} items processed, ${failed} failed`,
      }
    } catch (error: any) {
      console.error('Error in content ingestion:', error)
      return {
        success: false,
        message: `Content ingestion failed: ${error.message}`,
      }
    }
  }

  /**
   * Fetches the last content ingestion date for a user
   */
  private async getLastIngestionDate(userId: number): Promise<Date> {
    // Find the most recent content item for this user
    const [latestItem] = await db
      .select({ timestamp: contentItems.createdAt })
      .from(contentItems)
      .where(eq(contentItems.userId, userId))
      .orderBy(desc(contentItems.createdAt))
      .limit(1)

    return latestItem?.timestamp || new Date(0)
  }

  /**
   * Filters content sources by engagement metrics
   * Keeps only the top performing content
   */
  private filterByEngagement(sources: ContentSource[]): ContentSource[] {
    // Calculate an engagement score for each piece of content
    const contentWithScores = sources.map((source) => {
      const engagementScore =
        source.engagement.likes +
        source.engagement.comments * 5 +
        source.engagement.shares * 3

      return {
        source,
        score: engagementScore,
      }
    })

    // Sort by score
    contentWithScores.sort((a, b) => b.score - a.score)

    // Keep the top 80% (adjust as needed)
    const threshold = Math.ceil(contentWithScores.length * 0.8)

    return contentWithScores.slice(0, threshold).map((item) => item.source)
  }

  /**
   * Processes a single content item:
   * - Chunks content into appropriate segments
   * - Generates embeddings
   * - Stores the content and embeddings
   */
  private async processContent(source: ContentSource, userId: number) {
    try {
      log(`Processing content: ${source.id}`)

      // Step 1: Chunk content into appropriate sizes
      // For simplicity in Phase 1, we'll use the content as-is
      const chunks = [source.content]

      // Step 2: Generate embeddings for each chunk
      for (const chunk of chunks) {
        const embedding = await aiService.generateEmbedding(chunk)

        // Step 3: Store content and embedding
        const contentItem: InsertContentItem = {
          externalId: source.id,
          userId,
          contentType: source.type,
          title: source.title,
          content: chunk,
          url: source.url,
          embedding,
          engagementScore:
            source.engagement.likes +
            source.engagement.comments * 5 +
            source.engagement.shares * 3,
          metadata: {
            likes: source.engagement.likes,
            comments: source.engagement.comments,
            shares: source.engagement.shares,
          },
        }

        await storage.createContentItem(contentItem)
      }

      return true
    } catch (error) {
      console.error(`Error processing content ${source.id}:`, error)
      throw error
    }
  }

  /**
   * Retrieves relevant content for a specific query
   * Used when generating AI responses
   */
  async retrieveRelevantContent(
    query: string,
    userId: number,
    limit: number = 3,
  ) {
    try {
      // Generate an embedding for the query
      const queryEmbedding = await aiService.generateEmbedding(query)

      // Search for the most similar content
      // In Phase 1, we'll use a simple approach
      const relevantContent = await storage.findSimilarContent(
        userId,
        queryEmbedding,
        limit,
      )

      return relevantContent
    } catch (error) {
      console.error(`Error retrieving relevant content:`, error)
      return []
    }
  }
}

export const contentService = new ContentService()
