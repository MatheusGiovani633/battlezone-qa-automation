// Os campos que a suíte usa, tirados do openapi.json da homologação.
export type TournamentPublic = {
  id: number;
  name: string;
  game: string;
  category: string;
  maxPlayers: number;
  occupiedSeats: number;
  entryFee: number;
  serviceFee: number;
  totalDue: number;
  startsAt: string;
  endsAt: string;
  registrationClosesAt: string;
  store: { id: number; name: string; address: { city: string; state: string } };
};

export type RankingEntry = { position: number; playerId: number; name: string | null; score: number; wins: number };

export type Plan = {
  id: number | null;
  name: string;
  price: number;
  billingPeriod: string;
  companyLimit: number | null;
  freeTournamentLimit: number | null;
  active: boolean;
};
