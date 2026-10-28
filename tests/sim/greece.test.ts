import { describe, expect, it } from 'vitest';
import { PLACES, roadKm } from '../../src/sim/greece';
import { PARTNERS, roundTripMonths, type Partner } from '../../src/sim/trade';

const partners = Object.keys(PARTNERS) as Partner[];

describe('the roads of Greece', () => {
  it('measure the great-circle length of their segments', () => {
    expect(roadKm(['athens', 'eleusis'])).toBeCloseTo(18.3, 1);
    expect(roadKm(['athens', 'eleusis', 'megara'])).toBeCloseTo(roadKm(['athens', 'eleusis']) + roadKm(['eleusis', 'megara']));
  });

  it('leave Athens along the Sacred Way and end at their partner', () => {
    for (const partner of partners) {
      const road = PARTNERS[partner].road;
      expect(road.slice(0, 2)).toEqual(['athens', 'eleusis']);
      expect(road.at(-1)).toBe(partner);
    }
  });

  it('share the way to every place they share', () => {
    for (const a of partners) {
      for (const b of partners) {
        const roadA = PARTNERS[a].road;
        const roadB = PARTNERS[b].road;
        for (const place of roadA.filter((p) => roadB.includes(p))) {
          expect(roadA.slice(0, roadA.indexOf(place) + 1)).toEqual(roadB.slice(0, roadB.indexOf(place) + 1));
        }
      }
    }
  });

  it('name real places', () => {
    expect(PARTNERS.thebes.road.map((place) => PLACES[place].name)).toEqual(['Athens', 'Eleusis', 'Eleutherae', 'Thebes']);
  });
});

describe('a round trip', () => {
  it('grows with the length of the road, in whole months', () => {
    expect(partners.map((partner) => [partner, roundTripMonths(partner)])).toEqual([
      ['thebes', 3],
      ['corinth', 4],
      ['argos', 6],
      ['sparta', 9],
    ]);
  });
});
