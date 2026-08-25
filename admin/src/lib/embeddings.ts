import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers'

class PipelineSingleton {
  static task: any = 'feature-extraction'
  static model = 'Supabase/gte-small' // High quality 384-dimensional embeddings
  static instance: Promise<FeatureExtractionPipeline> | null = null

  static async getInstance(progress_callback?: Function): Promise<FeatureExtractionPipeline> {
    if (this.instance === null) {
      // Create pipeline only once
      this.instance = pipeline(this.task, this.model, { progress_callback }) as Promise<FeatureExtractionPipeline>
    }
    return this.instance
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await PipelineSingleton.getInstance()
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}
