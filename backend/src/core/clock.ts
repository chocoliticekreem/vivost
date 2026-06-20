export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now(): Date {
    return new Date();
  },
};

export function fixedClock(date: Date): Clock {
  return {
    now(): Date {
      return new Date(date.getTime());
    },
  };
}
