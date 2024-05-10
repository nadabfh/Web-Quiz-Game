const BASE_36 = 36;
export const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);
