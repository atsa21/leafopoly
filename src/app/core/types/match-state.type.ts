import { MatchSnapshot } from "@core/services/multiplayer.service";

export type MatchState = Omit<MatchSnapshot, 'seq' | 'by' | 'joined'>;