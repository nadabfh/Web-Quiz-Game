const FAKE_ROOM_ID = '1234';
const TICK = 1000;
const TIMER_VALUE = 3;
const TIMEOUT = 3000;

const FAKE_COUNTER = new Map<string, number>([
    [FAKE_ROOM_ID, TIMER_VALUE],
    ['2990', 0],
]);

export { FAKE_COUNTER, FAKE_ROOM_ID, TICK, TIMEOUT, TIMER_VALUE };
