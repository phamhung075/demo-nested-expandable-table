import { EnumGenre } from '../enum/EnumGenre';

export interface Contact {
  id: string;
  nom: string;
  prenom: string;
  genre: EnumGenre;

  email: string;
  numPortable: string;

  dateRencontre: Date | string | string;

  adresse: string;
  ville: string;
  codePostal: string;
  region: string;
  pays: string;

  nationalite: string;
  dateNaissance: Date | string | string;
  adresseNaissance: string;
  villeNaissance: string;
  paysNaissance: string;
  signature: string;

  createdAt: Date | string | string;
  updatedAt: Date | string | string;
  active: boolean;
}
