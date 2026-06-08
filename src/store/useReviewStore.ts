// Phase 5 — Zustand store for reviews.
import { create } from 'zustand'
import type { Review, ReviewDecision } from '../types'
import { getReviews, updateReview } from '../api/reviews'

interface ReviewStore {
  reviews: Review[]
  loading: boolean
  error: string | null
  fetchReviews: () => Promise<void>
  submitDecision: (
    id: string,
    decision: ReviewDecision,
    justification: string,
  ) => Promise<void>
}

export const useReviewStore = create<ReviewStore>((set) => ({
  reviews: [],
  loading: false,
  error: null,

  fetchReviews: async () => {
    set({ loading: true, error: null })
    try {
      const reviews = await getReviews()
      set({ reviews, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  submitDecision: async (id, decision, justification) => {
    const updated = await updateReview(id, decision, justification)
    set((state) => ({
      reviews: state.reviews.map((r) => (r.id === id ? updated : r)),
    }))
  },
}))
