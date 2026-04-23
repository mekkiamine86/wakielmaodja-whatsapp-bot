/**
 * tarifs.js — Grille tarifaire livraison Algérie
 * Départ : Alger | 55 wilayas
 * Format : { wilaya: { domicile, stopDesk, delai } }
 */

const TARIFS = {
  'Alger'               : { domicile: 450,  stopDesk: 300, delai: '12H' },
  'Boumerdès'           : { domicile: 550,  stopDesk: 300, delai: '24H' },
  'Blida'               : { domicile: 550,  stopDesk: 350, delai: '24H' },
  'Tipaza'              : { domicile: 550,  stopDesk: 350, delai: '24H' },
  'Tizi Ouzou'          : { domicile: 700,  stopDesk: 350, delai: '24H' },
  'Médéa'               : { domicile: 700,  stopDesk: 400, delai: '24H' },
  'Bouira'              : { domicile: 700,  stopDesk: 400, delai: '24H' },
  'Mascara'             : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Béjaïa'              : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Skikda'              : { domicile: 800,  stopDesk: 400, delai: '24H' },
  'Sidi Bel Abbès'      : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Sétif'               : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Relizane'            : { domicile: 800,  stopDesk: 400, delai: '24H' },
  'Oum El Bouaghi'      : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Oran'                : { domicile: 750,  stopDesk: 400, delai: '24H' },
  "M'Sila"              : { domicile: 800,  stopDesk: 400, delai: '24H' },
  'Mostaganem'          : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Mila'                : { domicile: 800,  stopDesk: 400, delai: '24H' },
  'Tissemsilt'          : { domicile: 800,  stopDesk: 400, delai: '24H' },
  'Tlemcen'             : { domicile: 800,  stopDesk: 400, delai: '24H' },
  'Chlef'               : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Constantine'         : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Batna'               : { domicile: 800,  stopDesk: 400, delai: '24H' },
  'Annaba'              : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Aïn Témouchent'      : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Aïn Defla'           : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Bordj Bou Arréridj'  : { domicile: 750,  stopDesk: 400, delai: '24H' },
  'Jijel'               : { domicile: 800,  stopDesk: 400, delai: '24H' },
  'Souk Ahras'          : { domicile: 850,  stopDesk: 400, delai: '24H' },
  'Tiaret'              : { domicile: 850,  stopDesk: 400, delai: '24H' },
  'Saïda'               : { domicile: 850,  stopDesk: 400, delai: '24H' },
  'Khenchela'           : { domicile: 850,  stopDesk: 400, delai: '24H' },
  'Guelma'              : { domicile: 850,  stopDesk: 400, delai: '24H' },
  'El Tarf'             : { domicile: 850,  stopDesk: 400, delai: '24H' },
  'Tébessa'             : { domicile: 850,  stopDesk: 400, delai: '24H' },
  'Biskra'              : { domicile: 950,  stopDesk: 500, delai: '24H' },
  'Ouled Djellal'       : { domicile: 950,  stopDesk: 550, delai: '48H' },
  'Djelfa'              : { domicile: 950,  stopDesk: 550, delai: '24H' },
  'Laghouat'            : { domicile: 950,  stopDesk: 550, delai: '24H' },
  'Ouargla'             : { domicile: 1050, stopDesk: 550, delai: '24H' },
  'El Meniaa'           : { domicile: 1100, stopDesk: 550, delai: '48H' },
  "El M'Ghair"          : { domicile: 1050, stopDesk: 600, delai: '48H' },
  'El Oued'             : { domicile: 1100, stopDesk: 550, delai: '48H' },
  'Touggourt'           : { domicile: 1050, stopDesk: 550, delai: '24H' },
  'Ghardaïa'            : { domicile: 1000, stopDesk: 550, delai: '24H' },
  'El Bayadh'           : { domicile: 1150, stopDesk: 600, delai: '48H' },
  'Naâma'               : { domicile: 1150, stopDesk: 600, delai: '48H' },
  'Béchar'              : { domicile: 1150, stopDesk: 600, delai: '48H' },
  'Béni Abbès'          : { domicile: 1150, stopDesk: 750, delai: '48H' },
  'Timimoun'            : { domicile: 1450, stopDesk: 700, delai: '48H' },
  'Tindouf'             : { domicile: 1350, stopDesk: 700, delai: '72H' },
  'Adrar'               : { domicile: 1450, stopDesk: 700, delai: '48H' },
  'In Salah'            : { domicile: 1650, stopDesk: 900, delai: '72H' },
  'Tamanrasset'         : { domicile: 1750, stopDesk: 950, delai: '72H' },
  'Illizi'              : { domicile: 1850, stopDesk: 1000,delai: '72H' },
};

/**
 * Cherche les tarifs d'une wilaya (insensible à la casse et aux accents)
 * @param {string} input — nom de la wilaya saisi par l'utilisateur
 * @returns {{ domicile, stopDesk, delai } | null}
 */
function getTarif(input) {
  if (!input) return null;
  const clean = input.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // enlever accents

  for (const [name, tarif] of Object.entries(TARIFS)) {
    const cleanName = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (cleanName === clean || cleanName.includes(clean) || clean.includes(cleanName.substring(0,5))) {
      return { wilaya: name, ...tarif };
    }
  }
  return null;
}

module.exports = { TARIFS, getTarif };
