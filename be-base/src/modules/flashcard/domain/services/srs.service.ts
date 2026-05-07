const MIN_EASE_FACTOR = 1.3;

export interface SrsResult {
  interval: number;
  easeFactor: number;
}

export class SrsService {
  calculateNextReview(
    currentInterval: number,
    currentEaseFactor: number,
    rating: number,
  ): SrsResult {
    let interval: number;
    let easeFactor =
      currentEaseFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));

    if (easeFactor < MIN_EASE_FACTOR) easeFactor = MIN_EASE_FACTOR;

    if (rating < 3) {
      interval = 0;
    } else if (currentInterval === 0) {
      interval = 1;
    } else if (currentInterval === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }

    return { interval, easeFactor };
  }
}
