/**
 * Content Service
 * Handles content ingestion, processing, and embedding for the RAG pipeline
 */

import { db } from "../db";
import { storage } from "../storage";
import { aiService } from "./openai";
import { eq } from "drizzle-orm";
import { contentItems, type InsertContentItem } from "@shared/schema";

interface ContentSource {
  id: string;
  type: 'post' | 'video' | 'blog';
  url: string;
  title: string;
  content: string;
  publishedAt: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export class ContentService {
  /**
   * Ingests and processes new content from various sources
   * @param userId The user ID to ingest content for
   * @param forceRefresh Force refresh all content (vs. only new content)
   */
  async ingestContent(userId: number, forceRefresh: boolean = false) {
    try {
      console.log(`Starting content ingestion for user ${userId}`);
      
      // Step 1: Fetch content from various sources
      const lastIngestedDate = forceRefresh ? 
        new Date(0) : 
        await this.getLastIngestionDate(userId);
        
      // For Phase 1: Simulate content sources 
      // In production, these would be API calls to Instagram, YouTube, etc.
      const sources = await this.fetchSampleContent(userId, lastIngestedDate);
      
      // Step 2: Filter content by engagement
      const highEngagementContent = this.filterByEngagement(sources);
      
      // Step 3: Process each content item
      const results = await Promise.allSettled(
        highEngagementContent.map(source => this.processContent(source, userId))
      );
      
      // Step 4: Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Content ingestion complete: ${successful} items processed, ${failed} failed`);
      
      return {
        success: true,
        processed: successful,
        failed,
        message: `Content ingestion complete: ${successful} items processed, ${failed} failed`
      };
    } catch (error: any) {
      console.error("Error in content ingestion:", error);
      return {
        success: false,
        message: `Content ingestion failed: ${error.message}`
      };
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
      .orderBy(contentItems.createdAt, "desc")
      .limit(1);
    
    return latestItem?.timestamp || new Date(0);
  }
  
  /**
   * Fetch sample content for development purposes
   * In production, this would fetch from actual creator platforms
   */
  private async fetchSampleContent(userId: number, lastIngestedDate: Date): Promise<ContentSource[]> {
    // For development: Generate some sample content
    return [
      {
        id: `post_${Date.now()}_1`,
        type: 'post',
        url: 'https://instagram.com/p/sample1',
        title: 'My latest travel adventure',
        content: "Just had the most amazing experience in Bali! The beaches were pristine and the sunsets were breathtaking. If you're planning a trip, make sure to visit Uluwatu Temple and Ubud's Monkey Forest. I'd recommend staying at least 10 days to fully experience the island. Let me know if you need specific recommendations!",
        publishedAt: new Date(),
        engagement: {
          likes: 1200,
          comments: 150,
          shares: 45
        }
      },
      {
        id: `video_${Date.now()}_1`,
        type: 'video',
        url: 'https://youtube.com/watch?v=sample1',
        title: 'How I edit my travel videos - Full Tutorial',
        content: "In this video, I'm showing you my complete workflow for editing travel videos that capture the essence of a location. I start with organizing footage by location, then create a storyboard before diving into the timeline. Color grading is crucial - I prefer a warm, vibrant look for tropical destinations and cooler tones for urban environments. Sound design makes a huge difference, so I spend extra time finding the perfect music and ambient sounds. For beginners, focus on storytelling first, technical skills will come with practice!",
        publishedAt: new Date(),
        engagement: {
          likes: 3500,
          comments: 420,
          shares: 210
        }
      },
      {
        id: `blog_${Date.now()}_1`,
        type: 'blog',
        url: 'https://myblog.com/sample1',
        title: 'Essential Camera Gear for Content Creators in 2025',
        content: "After testing dozens of cameras and accessories over the past five years, I've narrowed down my essential gear to these key items. For most creators, a good mirrorless camera with a versatile zoom lens is all you need to start. I recommend the Sony A7IV with the 24-70mm f/2.8 lens as the perfect all-around setup. If budget is a concern, the Fujifilm X-T4 offers exceptional value. Don't overlook audio - the Rode VideoMic Pro+ has been my reliable companion for years. Remember, the best gear is what works for YOUR specific needs and content style!",
        publishedAt: new Date(),
        engagement: {
          likes: 890,
          comments: 75,
          shares: 120
        }
      }
    ];
  }
  
  /**
   * Filters content sources by engagement metrics
   * Keeps only the top performing content
   */
  private filterByEngagement(sources: ContentSource[]): ContentSource[] {
    // Calculate an engagement score for each piece of content
    const contentWithScores = sources.map(source => {
      const engagementScore = 
        source.engagement.likes + 
        (source.engagement.comments * 5) + 
        (source.engagement.shares * 3);
      
      return {
        source,
        score: engagementScore
      };
    });
    
    // Sort by score
    contentWithScores.sort((a, b) => b.score - a.score);
    
    // Keep the top 80% (adjust as needed)
    const threshold = Math.ceil(contentWithScores.length * 0.8);
    
    return contentWithScores
      .slice(0, threshold)
      .map(item => item.source);
  }
  
  /**
   * Processes a single content item:
   * - Chunks content into appropriate segments
   * - Generates embeddings
   * - Stores the content and embeddings
   */
  private async processContent(source: ContentSource, userId: number) {
    try {
      console.log(`Processing content: ${source.id}`);
      
      // Step 1: Chunk content into appropriate sizes
      // For simplicity in Phase 1, we'll use the content as-is
      const chunks = [source.content];
      
      // Step 2: Generate embeddings for each chunk
      for (const chunk of chunks) {
        const embedding = await aiService.generateEmbedding(chunk);
        
        // Step 3: Store content and embedding
        const contentItem: InsertContentItem = {
          externalId: source.id,
          userId,
          contentType: source.type,
          title: source.title,
          content: chunk,
          url: source.url,
          embedding,
          engagementScore: source.engagement.likes + (source.engagement.comments * 5) + (source.engagement.shares * 3),
          metadata: {
            likes: source.engagement.likes,
            comments: source.engagement.comments,
            shares: source.engagement.shares
          }
        };
        
        await storage.createContentItem(contentItem);
      }
      
      return true;
    } catch (error) {
      console.error(`Error processing content ${source.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Retrieves relevant content for a specific query
   * Used when generating AI responses
   */
  async retrieveRelevantContent(query: string, userId: number, limit: number = 3) {
    try {
      // Generate an embedding for the query
      const queryEmbedding = await aiService.generateEmbedding(query);
      
      // Search for the most similar content
      // In Phase 1, we'll use a simple approach
      const relevantContent = await storage.findSimilarContent(
        userId,
        queryEmbedding,
        limit
      );
      
      return relevantContent;
    } catch (error) {
      console.error(`Error retrieving relevant content:`, error);
      return [];
    }
  }
}

export const contentService = new ContentService();