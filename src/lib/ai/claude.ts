import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1024

export interface ClaudeResponse {
  content: string
  inputTokens: number
  outputTokens: number
  model: string
}

export async function askClaude(
  prompt: string,
  systemPrompt?: string
): Promise<ClaudeResponse> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt ?? strideSystemPrompt(),
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('\n')

  return {
    content,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    model: message.model,
  }
}

function strideSystemPrompt(): string {
  return `You are an expert running coach and data analyst embedded in Stride, a personal marathon training dashboard.

Your role is to analyse the user's actual training data and provide specific, actionable coaching insights. You have access to their run history, training load metrics (CTL/ATL/TSB), weather data, and HR data.

Communication style:
- Concise and direct — no padding or filler
- Data-driven — always reference specific numbers from the data provided
- Honest — flag risks and concerns clearly, don't just be positive
- Practical — every insight should lead to a concrete next action

Never make up data. Only reference numbers that appear in the data provided to you. If the data is insufficient to draw a conclusion, say so.`
}

// ─── Prompt hash for caching ─────────────────────────────────────────

export async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(prompt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
