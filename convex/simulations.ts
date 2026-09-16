import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireSimulationAdmin } from './lib/simulationAccess'
import report from '../data/simulation/report.json'
import examples from '../data/simulation/examples.json'
import mctsReport from '../data/simulation/mcts/report.json'
import mctsExamples from '../data/simulation/mcts/examples.json'
import type { SimulationReport, SimulationExample } from '../shared/simulationReport'

const campaign = v.optional(v.union(v.literal('reference'), v.literal('mcts')))

// Server-only data. Never import these artifacts into React or publish them under public/.
export const getReport = query({
  args: { campaign },
  handler: async (ctx, args): Promise<SimulationReport> => {
    await requireSimulationAdmin(ctx)
    return (args.campaign === 'reference' ? report : mctsReport) as SimulationReport
  },
})
export const getExample = query({
  args: { id: v.string(), campaign },
  handler: async (ctx, args): Promise<SimulationExample | null> => {
    await requireSimulationAdmin(ctx)
    const data = (args.campaign === 'reference' ? examples : mctsExamples) as unknown as SimulationExample[]
    return data.find((example) => example.id === args.id) ?? null
  },
})
