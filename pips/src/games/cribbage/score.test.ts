import { describe, expect, it } from 'vitest';
import { card, cards } from '../../engine/cards';
import { scorePegging, scoreShow, showTotal, total } from './score';

describe('show scoring', () => {
  it('scores the 29 hand', () => expect(showTotal(cards('5H 5D 5C JS'), card('5S'), false)).toBe(29));
  it('scores four fives with a ten-card starter as 28', () => expect(showTotal(cards('5H 5D 5C 5S'), card('JH'), false)).toBe(28));
  it('scores a hand with nothing as 0', () => expect(showTotal(cards('2S 4D 6C 8H'), card('10S'), false)).toBe(0));
  it('scores a double run with fifteens', () => expect(showTotal(cards('3H 3D 4C 5S'), card('9H'), false)).toBe(12));
  // 7+8, 6+7+2 and the run 6-7-8
  it('scores 15-2, 15-4 and a run', () => expect(showTotal(cards('6H 7D 8C 2S'), card('KH'), false)).toBe(7));
  it('counts a four-card flush in the hand only', () => {
    expect(showTotal(cards('2H 4H 6H 8H'), card('10S'), false)).toBe(4);
    expect(showTotal(cards('2H 4H 6H 8H'), card('10S'), true)).toBe(0);
    expect(showTotal(cards('2H 4H 6H 8H'), card('10H'), true)).toBe(5);
  });
  // 2+3+J, 2+3+Q, plus the jack of the starter's suit
  it('scores his nobs', () => expect(showTotal(cards('JH 2C 9D QS'), card('3H'), false)).toBe(5));
  it('does not score nobs for the starter jack', () =>
    expect(scoreShow(cards('2H 4C 9D QS'), card('JH'), false).some((i) => i.kind === 'nobs')).toBe(false));
});

describe('pegging', () => {
  const pts = (codes: string) => total(scorePegging(cards(codes)));
  it('fifteen', () => expect(pts('5H 10S')).toBe(2));
  it('thirty-one', () => expect(pts('10H 10S JD AC')).toBe(2));
  it('pair, pair royal, double pair royal', () => {
    expect(pts('7H 7S')).toBe(2);
    expect(pts('7H 7S 7D')).toBe(6);
    expect(pts('2H 2S 2D 2C')).toBe(12);
  });
  it('runs out of order', () => {
    expect(pts('3H 5S 4D')).toBe(3);
    expect(pts('3H 5S 4D 6C')).toBe(4);
  });
  it('broken runs do not count', () => expect(pts('4H 4S 5D 6C')).toBe(3));
  it('fifteen and a run together', () => expect(pts('4H 5S 6D')).toBe(5));
});
