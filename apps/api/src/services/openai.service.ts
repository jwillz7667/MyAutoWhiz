import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

import type { StreamingChatMessage, MessageAttachment } from '@myautowhiz/shared';

import { OpenAiApiError } from '../utils/errors';
import { logger } from '../utils/logger';

import { nhtsaService } from './nhtsa.service';
import { shopService } from './shop.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10);

// System prompt for automotive expert
const SYSTEM_PROMPT = `You are an expert automotive technician and advisor with decades of experience. You help users with:

1. **Vehicle Diagnostics**: Analyze symptoms, interpret OBD-II codes, and provide step-by-step diagnostic guidance
2. **Repair Advice**: Explain repairs, estimate difficulty levels, and suggest whether DIY or professional help is needed
3. **Maintenance**: Recommend maintenance schedules and explain the importance of services
4. **Purchase Guidance**: Help evaluate used vehicles, explain what to look for, and interpret vehicle history

When analyzing images, carefully examine for:
- Visible damage, wear, or corrosion
- Fluid leaks or stains
- Warning lights on dashboards
- Tire condition and tread depth
- Belt and hose condition

Always prioritize safety. If a condition could be dangerous, clearly warn the user and recommend professional inspection.

You have access to tools to look up real vehicle data, check recalls, find repair shops, and estimate costs. Use these tools when relevant to provide accurate, personalized information.

Be conversational but informative. Explain technical concepts in accessible terms while providing enough detail for DIY-capable users.`;

// Define function tools for the AI
const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'decode_vin',
      description: 'Decode a Vehicle Identification Number (VIN) to get detailed vehicle specifications',
      parameters: {
        type: 'object',
        properties: {
          vin: {
            type: 'string',
            description: 'The 17-character VIN to decode',
          },
        },
        required: ['vin'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_recalls',
      description: 'Check for active safety recalls for a specific vehicle',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'number', description: 'Model year' },
          make: { type: 'string', description: 'Vehicle make (e.g., Honda, Toyota)' },
          model: { type: 'string', description: 'Vehicle model (e.g., Accord, Camry)' },
        },
        required: ['year', 'make', 'model'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_safety_ratings',
      description: 'Get NHTSA crash test safety ratings for a vehicle',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'number', description: 'Model year' },
          make: { type: 'string', description: 'Vehicle make' },
          model: { type: 'string', description: 'Vehicle model' },
        },
        required: ['year', 'make', 'model'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estimate_repair_cost',
      description: 'Estimate the cost of a repair including parts and labor',
      parameters: {
        type: 'object',
        properties: {
          repair: { type: 'string', description: 'The repair needed (e.g., brake pad replacement)' },
          year: { type: 'number', description: 'Vehicle year' },
          make: { type: 'string', description: 'Vehicle make' },
          model: { type: 'string', description: 'Vehicle model' },
        },
        required: ['repair'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_nearby_shops',
      description: 'Find auto repair shops near a location',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number', description: 'Latitude of search location' },
          longitude: { type: 'number', description: 'Longitude of search location' },
          specialty: {
            type: 'string',
            description: 'Shop specialty (e.g., brakes, transmission, general)',
          },
          radiusMiles: { type: 'number', description: 'Search radius in miles (default 25)' },
        },
        required: ['latitude', 'longitude'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_maintenance_schedule',
      description: 'Get recommended maintenance schedule for a vehicle based on mileage',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'number' },
          make: { type: 'string' },
          model: { type: 'string' },
          currentMileage: { type: 'number', description: 'Current odometer reading' },
        },
        required: ['year', 'make', 'model', 'currentMileage'],
      },
    },
  },
];

// Execute a function call
async function executeFunction(name: string, args: Record<string, unknown>): Promise<unknown> {
  logger.info('Executing AI function', { name, args });

  switch (name) {
    case 'decode_vin':
      return nhtsaService.decodeVin(args.vin as string);

    case 'lookup_recalls':
      return nhtsaService.getRecalls(
        args.year as number,
        args.make as string,
        args.model as string
      );

    case 'get_safety_ratings':
      return nhtsaService.getSafetyRatings(
        args.year as number,
        args.make as string,
        args.model as string
      );

    case 'estimate_repair_cost':
      // Return estimated costs based on repair type
      return getRepairCostEstimate(
        args.repair as string,
        args.year as number | undefined,
        args.make as string | undefined,
        args.model as string | undefined
      );

    case 'find_nearby_shops':
      return shopService.searchShops({
        latitude: args.latitude as number,
        longitude: args.longitude as number,
        specialty: args.specialty as string | undefined,
        radiusMiles: (args.radiusMiles as number) || 25,
        limit: 5,
      });

    case 'get_maintenance_schedule':
      return getMaintenanceSchedule(
        args.year as number,
        args.make as string,
        args.model as string,
        args.currentMileage as number
      );

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

// Repair cost estimates (simplified - in production would use more sophisticated data)
function getRepairCostEstimate(
  repair: string,
  year?: number,
  make?: string,
  model?: string
): { laborLow: number; laborHigh: number; partsLow: number; partsHigh: number; notes: string } {
  const repairLower = repair.toLowerCase();

  // Base estimates by repair type
  const estimates: Record<string, { labor: [number, number]; parts: [number, number]; notes: string }> = {
    'brake pad': { labor: [100, 200], parts: [50, 150], notes: 'Front or rear, per axle' },
    'brake rotor': { labor: [100, 200], parts: [100, 300], notes: 'Per axle, includes pad replacement' },
    'oil change': { labor: [30, 60], parts: [30, 80], notes: 'Synthetic oil recommended for most modern vehicles' },
    'battery': { labor: [30, 60], parts: [100, 250], notes: 'Price varies by battery type and brand' },
    'alternator': { labor: [150, 300], parts: [200, 500], notes: 'OEM parts more expensive' },
    'starter': { labor: [150, 300], parts: [150, 400], notes: 'Labor varies by vehicle accessibility' },
    'timing belt': { labor: [300, 600], parts: [100, 300], notes: 'Usually includes water pump replacement' },
    'transmission': { labor: [500, 1500], parts: [1500, 4000], notes: 'Rebuild vs replace varies significantly' },
    'ac': { labor: [100, 300], parts: [200, 800], notes: 'Diagnosis fee usually separate' },
    'tire': { labor: [20, 40], parts: [80, 300], notes: 'Per tire, mounting and balancing included' },
    'spark plug': { labor: [50, 200], parts: [20, 100], notes: 'Labor varies by engine accessibility' },
  };

  // Find matching estimate
  for (const [key, value] of Object.entries(estimates)) {
    if (repairLower.includes(key)) {
      return {
        laborLow: value.labor[0],
        laborHigh: value.labor[1],
        partsLow: value.parts[0],
        partsHigh: value.parts[1],
        notes: value.notes,
      };
    }
  }

  // Default estimate
  return {
    laborLow: 100,
    laborHigh: 500,
    partsLow: 50,
    partsHigh: 500,
    notes: 'Estimate varies significantly by specific repair and vehicle. Get quotes from local shops for accurate pricing.',
  };
}

// Maintenance schedule recommendations
function getMaintenanceSchedule(
  year: number,
  make: string,
  model: string,
  currentMileage: number
): { dueNow: string[]; dueSoon: string[]; upcoming: string[] } {
  const dueNow: string[] = [];
  const dueSoon: string[] = [];
  const upcoming: string[] = [];

  // Common maintenance intervals
  const schedules = [
    { service: 'Oil Change', interval: 5000, window: 500 },
    { service: 'Tire Rotation', interval: 7500, window: 500 },
    { service: 'Air Filter', interval: 15000, window: 2000 },
    { service: 'Cabin Air Filter', interval: 15000, window: 2000 },
    { service: 'Brake Inspection', interval: 25000, window: 2500 },
    { service: 'Coolant Flush', interval: 30000, window: 5000 },
    { service: 'Transmission Service', interval: 60000, window: 5000 },
    { service: 'Spark Plugs', interval: 60000, window: 5000 },
    { service: 'Timing Belt (if equipped)', interval: 100000, window: 10000 },
  ];

  for (const item of schedules) {
    const nextDue = Math.ceil(currentMileage / item.interval) * item.interval;
    const milesUntilDue = nextDue - currentMileage;

    if (milesUntilDue <= 0) {
      dueNow.push(`${item.service} (overdue)`);
    } else if (milesUntilDue <= item.window) {
      dueNow.push(`${item.service} (due at ${nextDue.toLocaleString()} miles)`);
    } else if (milesUntilDue <= item.window * 3) {
      dueSoon.push(`${item.service} at ${nextDue.toLocaleString()} miles`);
    } else {
      upcoming.push(`${item.service} at ${nextDue.toLocaleString()} miles`);
    }
  }

  return { dueNow, dueSoon, upcoming };
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MessageAttachment[];
}

class OpenAIService {
  async *streamChat(
    messages: ChatMessage[],
    vehicleContext?: { year?: number; make?: string; model?: string; vin?: string }
  ): AsyncGenerator<StreamingChatMessage> {
    try {
      // Build message array
      const apiMessages: ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
      ];

      // Add vehicle context if available
      if (vehicleContext && (vehicleContext.year || vehicleContext.vin)) {
        const contextMessage = `Current vehicle context: ${vehicleContext.year || ''} ${vehicleContext.make || ''} ${vehicleContext.model || ''} ${vehicleContext.vin ? `(VIN: ${vehicleContext.vin})` : ''}`.trim();
        apiMessages.push({ role: 'system', content: contextMessage });
      }

      // Add conversation history
      for (const msg of messages) {
        if (msg.attachments && msg.attachments.length > 0 && msg.role === 'user') {
          // User message with images
          const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
            { type: 'text', text: msg.content },
          ];

          for (const attachment of msg.attachments) {
            if (attachment.type === 'image') {
              content.push({
                type: 'image_url',
                image_url: { url: attachment.url, detail: 'high' },
              });
            }
          }

          apiMessages.push({ role: 'user', content });
        } else if (msg.role === 'user') {
          apiMessages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant') {
          apiMessages.push({ role: 'assistant', content: msg.content });
        } else if (msg.role === 'system') {
          apiMessages.push({ role: 'system', content: msg.content });
        }
      }

      // Initial API call
      let response = await openai.chat.completions.create({
        model: MODEL,
        messages: apiMessages,
        tools: TOOLS,
        tool_choice: 'auto',
        max_tokens: MAX_TOKENS,
        stream: true,
      });

      let currentContent = '';
      let functionCalls: { name: string; arguments: string }[] = [];

      // Process stream
      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          currentContent += delta.content;
          yield { type: 'content', content: delta.content };
        }

        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            if (toolCall.function) {
              if (!functionCalls[toolCall.index]) {
                functionCalls[toolCall.index] = { name: '', arguments: '' };
              }
              if (toolCall.function.name) {
                functionCalls[toolCall.index].name = toolCall.function.name;
              }
              if (toolCall.function.arguments) {
                functionCalls[toolCall.index].arguments += toolCall.function.arguments;
              }
            }
          }
        }
      }

      // Execute function calls if any
      if (functionCalls.length > 0) {
        for (const fc of functionCalls) {
          if (fc.name) {
            yield { type: 'function_call', functionCall: fc };

            try {
              const args = JSON.parse(fc.arguments);
              const result = await executeFunction(fc.name, args);
              yield { type: 'function_result', functionResult: { name: fc.name, result } };

              // Add function result to messages and continue
              apiMessages.push({
                role: 'assistant',
                content: currentContent || null,
                tool_calls: [
                  {
                    id: `call_${Date.now()}`,
                    type: 'function' as const,
                    function: { name: fc.name, arguments: fc.arguments },
                  },
                ],
              });

              apiMessages.push({
                role: 'tool',
                tool_call_id: `call_${Date.now()}`,
                content: JSON.stringify(result),
              });

              // Get final response
              const finalResponse = await openai.chat.completions.create({
                model: MODEL,
                messages: apiMessages,
                max_tokens: MAX_TOKENS,
                stream: true,
              });

              for await (const chunk of finalResponse) {
                if (chunk.choices[0]?.delta?.content) {
                  yield { type: 'content', content: chunk.choices[0].delta.content };
                }
              }
            } catch (error) {
              logger.error('Function execution error', { function: fc.name, error });
              yield { type: 'error', error: `Failed to execute ${fc.name}` };
            }
          }
        }
      }

      yield { type: 'done' };
    } catch (error) {
      logger.error('OpenAI streaming error', { error });
      throw OpenAiApiError('AI service temporarily unavailable');
    }
  }

  async chat(
    messages: ChatMessage[],
    vehicleContext?: { year?: number; make?: string; model?: string; vin?: string }
  ): Promise<{ content: string; functionCalls: { name: string; arguments: Record<string, unknown>; result: unknown }[]; usage: { promptTokens: number; completionTokens: number } }> {
    // Collect streaming response
    let content = '';
    const functionCalls: { name: string; arguments: Record<string, unknown>; result: unknown }[] = [];

    for await (const msg of this.streamChat(messages, vehicleContext)) {
      if (msg.type === 'content' && msg.content) {
        content += msg.content;
      }
      if (msg.type === 'function_result' && msg.functionResult) {
        functionCalls.push({
          name: msg.functionResult.name,
          arguments: {},
          result: msg.functionResult.result,
        });
      }
    }

    return {
      content,
      functionCalls,
      usage: { promptTokens: 0, completionTokens: 0 }, // Would need to track from API response
    };
  }

  async analyzeImage(
    imageUrl: string,
    prompt: string
  ): Promise<{ description: string; issues: string[]; recommendations: string[] }> {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert automotive technician analyzing vehicle images. Identify any visible issues, damage, or concerns. Be specific and actionable.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt || 'Please analyze this vehicle image and identify any issues or concerns.' },
              { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            ],
          },
        ],
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        description: result.description || 'Unable to analyze image',
        issues: result.issues || [],
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      logger.error('Image analysis error', { error });
      throw OpenAiApiError('Failed to analyze image');
    }
  }
}

export const openaiService = new OpenAIService();
