// =========================================================================
// PORT JAVASCRIPT DE LA FORMULE DE COMBAT DE duel.cs
// ⚠️ Doit rester STRICTEMENT SYNCHRONISÉ avec CalculerPowerLevelSimule et ses
// fonctions associées dans duel.cs (GetEffectiveStats, ValeurStat,
// EstimerAtkEquivalent(AvecStance), AppliquerStatAuPersonnage, Mitigation).
// Toute modification de la formule côté C# doit être reportée ici À L'IDENTIQUE,
// sinon cette page se met à mentir aux joueurs sur leurs propres dégâts/survie.
// Constantes et logique copiées le 2025 depuis duel.cs (voir commentaires
// d'origine côté C# pour le détail de chaque choix de calibrage).
// =========================================================================

const CST = {
    BASE_ATK: 10.0, BONUS_ATK_PAR_STACK: 1.0,
    BASE_DEF: 10.0, BONUS_DEF_PAR_STACK: 1.0,
    // Mannequin "adversaire type de MA tranche", utilise uniquement par calculerPowerLevelSimule
    // pour la survie (menace subie) et l attaque (cible mitigee) -- a ne pas confondre avec
    // BASE_ATK/BASE_DEF ci-dessus, qui restent la vraie stat de depart (0 stack) de chacun. Courbe
    // ancree sur cette base reelle (10) au niveau 0, pente issue d une regression sur les stats
    // reelles de la population. A recalibrer a chaque gros patch avec des donnees fraiches, pas en
    // continu -- pour ne pas faire fluctuer le PowerLevel de quelqu un qui n a rien change.
    DUMMY_ATK_BASE: 10.0, DUMMY_ATK_PENTE: 0.771,
    DUMMY_DEF_BASE: 10.0, DUMMY_DEF_PENTE: 0.332,
    BASE_PV: 100.0, BONUS_PV_PAR_STACK: 10.0,
    BASE_SPD: 10.0, SPD_MAX_BONUS: 40.0, K_SPD: 40.0,
    BASE_ESQUIVE: 15.0,
    BASE_CRIT: 15.0, LUCK_CRIT_MAX: 55.0, K_LUCK: 55.0,
    DEF_MITIGATION_MAX: 60.0, K_DEF_MITIGATION: 58.27,
    COEF_ATK_BASE: 0.3, PENALITE_HORS_ATK: 0.6,
    COEF_LETTRE_SCALING: { S: 1.3, A: 1.0, B: 0.75, C: 0.5, D: 0.25, E: 0.1 },
    POIDS_SCALING_STAT: { atk: 1.0, def: 1.0, pv: 0.1, spd: 1.0, crit: 1.0 },
    MAX_ACTIONS: 45, ROPE_START_ACTION: 20, ROPE_CADENCE: 2,
    FATIGUE_CROISSANCE: 1.30,
    POIDS_BURST: 2.5,
    // Diviseur final -- pur curseur d echelle, homothetie appliquee identiquement a tout le monde
    // (aucun impact sur les classements ni les ecarts relatifs). Remonte de 2.8 a 1.12 en meme
    // temps que le correctif "mannequin par tranche", pour compenser la baisse mecanique du
    // PowerLevel qu il entraine (~x2.5) sans que personne ne voie son chiffre s effondrer sans
    // avoir rien change a son build.
    DIVISEUR: 1.12,
    // Même valeur approximative que le commentaire C# ("2 armes tir sur 7 au catalogue") —
    // à recalculer si le roster d'armes change significativement.
    PROPORTION_ARMES_TIR: 0.30,
};

function mitigation(def) {
    return (CST.DEF_MITIGATION_MAX * Math.tanh(def / CST.K_DEF_MITIGATION)) / 100.0;
}

// Port fidèle de AppliquerAmelioration (duel.cs, ~L2252) : renvoie une COPIE de l'objet du
// catalogue avec tous ses champs qui progressent par doublon réellement appliqués au niveau
// possédé — les 3 stats (Bonus/Bonus2/Bonus3 via Increment/2/3), la fourchette de dégâts d'arme
// (BaseDegatsMin/Max via IncrementBaseDegats, seulement si Scaling1Stat est renseigné), les
// dégâts d'impact des stratagèmes (DegatsDirects via IncrementDegatsDirects), les champs de
// stance 2 (mêmes règles que la stance 0), et le passif spécial ciblé par StatPrincipale (monté
// de IncrementParNiveau — nommé "incrementPassif" dans catalogue_stats.json — par niveau).
// ⚠️ AVANT ce correctif, cette fonction n'existait pas côté JS : le calculateur ne faisait monter
// QUE les 3 stats de base, ce qui sous-estimait fortement les dégâts et le PowerLevel de tout
// objet dont l'identité repose sur IncrementBaseDegats, IncrementDegatsDirects ou StatPrincipale
// (la quasi-totalité des armes et stratagèmes avec doublons).
const CHAMP_STAT_PRINCIPALE = {
    Lifesteal: 'lifesteal', PoisonDegats: 'poisonDegats', Precision: 'precision', CritBonus: 'critBonus',
    Penetration: 'penetration', EtourdissementChance: 'etourdissementChance', ExecutionBonus: 'executionBonus',
    Blocage: 'blocage', BlocageReduction: 'blocageReduction', Reflection: 'reflection',
    ResistancePoison: 'resistancePoison', Regeneration: 'regeneration', ResistanceCrit: 'resistanceCrit',
    DegatsDirects: 'degatsDirects', SoinDirect: 'soinDirect', SaignementDegats: 'saignementDegats',
    BrulureDegats: 'brulureDegats', AntiHealPourcentage: 'antiHealPourcentage', ShieldMontant: 'shieldMontant',
    RageBonusMax: 'rageBonusMax', MarqueDegatsPourcentage: 'marqueDegatsPourcentage', ParadeChance: 'paradeChance',
    TenaciteChance: 'tenaciteChance', FrenesieBonusSpd: 'frenesieBonusSpd',
};

function appliquerAmelioration(original, niveau) {
    if (!original || !niveau || niveau <= 0) return original;
    const c = { ...original };

    if (c.stat) c.bonus = (c.bonus || 0) + niveau * (c.increment || 0);
    if (c.stat2) c.bonus2 = (c.bonus2 || 0) + niveau * (c.increment2 || 0);
    if (c.stat3) c.bonus3 = (c.bonus3 || 0) + niveau * (c.increment3 || 0);

    if (c.scaling1Stat && c.incrementBaseDegats) {
        c.baseDegatsMin = (c.baseDegatsMin || 0) + niveau * c.incrementBaseDegats;
        c.baseDegatsMax = (c.baseDegatsMax || 0) + niveau * c.incrementBaseDegats;
    }
    if ((c.degatsDirects || 0) > 0 && c.incrementDegatsDirects) {
        c.degatsDirects = c.degatsDirects + niveau * c.incrementDegatsDirects;
    }

    if (c.dureeStance) {
        if (c.stance2Stat) c.stance2Bonus = (c.stance2Bonus || 0) + niveau * (c.stance2IncrementBonus || 0);
        if (c.stance2Stat2) c.stance2Bonus2 = (c.stance2Bonus2 || 0) + niveau * (c.stance2IncrementBonus2 || 0);
        if (c.stance2Stat3) c.stance2Bonus3 = (c.stance2Bonus3 || 0) + niveau * (c.stance2IncrementBonus3 || 0);
        if (c.stance2Scaling1Stat && c.stance2IncrementBaseDegats) {
            c.stance2BaseDegatsMin = (c.stance2BaseDegatsMin || 0) + niveau * c.stance2IncrementBaseDegats;
            c.stance2BaseDegatsMax = (c.stance2BaseDegatsMax || 0) + niveau * c.stance2IncrementBaseDegats;
        }
    }

    if (c.statPrincipale) {
        const incrementParNiveau = c.incrementPassif > 0 ? c.incrementPassif : 1.0;
        const champ = CHAMP_STAT_PRINCIPALE[c.statPrincipale];
        if (champ) c[champ] = (c[champ] || 0) + niveau * incrementParNiveau;
    }

    return c;
}

// --- Construit les Stats effectives à partir de stacks CHOISIS (hypothétiques) et d'un
// équipement CHOISI (hypothétique) — équivalent JS de GetEffectiveStats, mais sans jamais lire
// les registres réels : tout vient des choix faits sur cette page. L'équipement reçu ici doit
// déjà être nivelé (voir appliquerAmelioration) : cette fonction ne fait plus monter les stats
// elle-même, pour n'avoir qu'un seul endroit où "niveau" est appliqué.
function calculerStatsEffectives(stacks, equipement) {
    const s = {
        atk: CST.BASE_ATK + CST.BONUS_ATK_PAR_STACK * stacks.atk,
        def: CST.BASE_DEF + CST.BONUS_DEF_PAR_STACK * stacks.def,
        pv: CST.BASE_PV + CST.BONUS_PV_PAR_STACK * stacks.pv,
        spd: CST.BASE_SPD + CST.SPD_MAX_BONUS * Math.tanh(stacks.spd / CST.K_SPD),
        spdLineaire: stacks.spd,
        luckLineaire: Math.max(0, stacks.luck), // deluck non simulable ici (dépend d'un adversaire réel)
        esquiveGear: 0,
    };
    [equipement.arme, equipement.offhand, equipement.torso].forEach(g => {
        if (!g) return;
        appliquerStatAuPersonnage(s, g.stat, g.bonus || 0);
        appliquerStatAuPersonnage(s, g.stat2, g.bonus2 || 0);
        appliquerStatAuPersonnage(s, g.stat3, g.bonus3 || 0);
    });
    return s;
}

function appliquerStatAuPersonnage(s, stat, bonus) {
    if (!stat) return;
    if (stat === 'atk') s.atk += bonus;
    else if (stat === 'def') s.def += bonus;
    else if (stat === 'pv') s.pv += bonus;
    else if (stat === 'spd') s.spd += bonus;
    else if (stat === 'esquive') s.esquiveGear += bonus;
    // ⚠️ CORRECTIF : "crit" comme stat d'objet (Armure de Rakshasa, Deadeye, Dague empoisonnée)
    // était silencieusement ignoré. Traité comme un bonus de LUCK (pas un %crit à part) --
    // cohérent avec le fait que luck pilote déjà le %crit ET le scaling d'arme "crit".
    // "luck" comme stat d'objet (Armure de Rakshasa, Deadeye, Dague empoisonnée) ajoute
    // directement à luckLineaire -- comme si le joueur avait investi ce montant lui-même.
    else if (stat === 'luck') s.luckLineaire += bonus;
}

function valeurStat(s, nomStat) {
    let brute;
    switch (nomStat) {
        case 'atk': brute = s.atk; break;
        case 'def': brute = s.def; break;
        case 'pv': brute = s.pv; break;
        case 'spd': brute = s.spdLineaire; break;
        case 'crit': brute = s.luckLineaire; break;
        default: return 0;
    }
    const poids = CST.POIDS_SCALING_STAT[nomStat] ?? 1.0;
    return brute * poids;
}

// Vue de l'arme selon la stance (1 = stance2) — substitue uniquement les champs de dégâts/scaling.
function vueArmeSelonStance(arme, stance) {
    if (!arme || !arme.dureeStance || stance === 0) return arme;
    return {
        ...arme,
        baseDegatsMin: arme.stance2BaseDegatsMin, baseDegatsMax: arme.stance2BaseDegatsMax,
        scaling1Stat: arme.stance2Scaling1Stat, scaling1Lettre: arme.stance2Scaling1Lettre,
        scaling2Stat: arme.stance2Scaling2Stat, scaling2Lettre: arme.stance2Scaling2Lettre,
    };
}

function appliquerBonusArmeStance(s, arme, stance, signe) {
    if (!arme) return;
    if (stance === 0) {
        appliquerStatAuPersonnage(s, arme.stat, signe * (arme.bonus || 0));
        appliquerStatAuPersonnage(s, arme.stat2, signe * (arme.bonus2 || 0));
        appliquerStatAuPersonnage(s, arme.stat3, signe * (arme.bonus3 || 0));
    } else {
        appliquerStatAuPersonnage(s, arme.stance2Stat, signe * (arme.stance2Bonus || 0));
        appliquerStatAuPersonnage(s, arme.stance2Stat2, signe * (arme.stance2Bonus2 || 0));
        appliquerStatAuPersonnage(s, arme.stance2Stat3, signe * (arme.stance2Bonus3 || 0));
    }
}

function estimerAtkEquivalent(stats, arme) {
    if (!arme || !arme.scaling1Stat) return stats.atk;
    let total = ((arme.baseDegatsMin || 0) + (arme.baseDegatsMax || 0)) / 2.0;
    let atkDejaCompte = false;
    function appliquer(nomStat, lettre) {
        if (!nomStat) return;
        const coef = CST.COEF_LETTRE_SCALING[lettre] || 0;
        const valeur = valeurStat(stats, nomStat);
        if (nomStat === 'atk') { total += valeur * coef; atkDejaCompte = true; }
        else total += valeur * coef * CST.PENALITE_HORS_ATK;
    }
    appliquer(arme.scaling1Stat, arme.scaling1Lettre);
    appliquer(arme.scaling2Stat, arme.scaling2Lettre);
    if (!atkDejaCompte) total += stats.atk * CST.COEF_ATK_BASE;
    return total;
}

// Moyenne 50/50 stance0/stance2, exactement comme EstimerAtkEquivalentAvecStance (voir duel.cs :
// le porteur passe autant de tours dans chaque stance, DureeStance régissant le switch dans les
// deux sens — c'est directement l'approximation justifiée par la mécanique réelle, pas un choix
// arbitraire de cette page).
function estimerAtkEquivalentAvecStance(s, arme) {
    const stance0 = estimerAtkEquivalent(s, arme);
    if (!arme || !arme.dureeStance) return stance0;
    const sStance2 = { ...s };
    appliquerBonusArmeStance(sStance2, arme, 0, -1.0);
    appliquerBonusArmeStance(sStance2, arme, 1, 1.0);
    const stance2 = estimerAtkEquivalent(sStance2, vueArmeSelonStance(arme, 1));
    return (stance0 + stance2) / 2.0;
}

// Horizon utilise pour amorcer une toute premiere estimation de survie, avant qu on ait pu
// calculer un survieTours reel pour CE personnage precis (voir le second passage plus bas, dans
// calculerPowerLevelSimule).
const HORIZON_INITIAL_TOURS = 10.0;

// Menace/cible "type" d un adversaire dont l investissement total en stacks est connu -- utilisees
// a la place de CST.BASE_ATK/CST.BASE_DEF fixes dans calculerPowerLevelSimule.
function dummyAtk(totalStacksInvestis) { return CST.DUMMY_ATK_BASE + CST.DUMMY_ATK_PENTE * totalStacksInvestis; }
function dummyDef(totalStacksInvestis) { return CST.DUMMY_DEF_BASE + CST.DUMMY_DEF_PENTE * totalStacksInvestis; }

function usagesEffectifsStrategeme(s, horizonTours) {
    const usages = Math.max(1, s.usagesParCombat || 1);
    let total = 0;
    for (let k = 1; k <= usages; k++) {
        const coolDownEcoule = (k - 1) * (s.cooldownTours || 0);
        total += Math.max(0, 1.0 - coolDownEcoule / Math.max(0.01, horizonTours));
    }
    return total;
}

// Simule tour par tour l accumulation de degats subis (fatigue/corde + soin par tour) jusqu a
// depassement de pvTotaux -- extrait en fonction a part car appelee DEUX FOIS par
// calculerPowerLevelSimule (une estimation grossiere, puis une estimation corrigee une fois
// qu on connait la vraie duree probable du combat, voir usagesEffectifsStrategeme plus haut).
function calculerSurvieTours(pvTotaux, dpaSubi, soinParTour, tourDebutFatigue, toursParTickFatigue) {
    let cumulDegatsSubis = 0.0;
    for (let tour = 1; tour <= CST.MAX_ACTIONS; tour++) {
        let paliersFatigue = 0;
        if (tour >= tourDebutFatigue) {
            paliersFatigue = Math.floor((tour - tourDebutFatigue) / toursParTickFatigue) + 1;
        }
        const degatsBrutsCeTour = dpaSubi * Math.pow(CST.FATIGUE_CROISSANCE, paliersFatigue);
        const degatsDeCeTour = degatsBrutsCeTour - Math.min(soinParTour, degatsBrutsCeTour * 0.60);
        const cumulAvantCeTour = cumulDegatsSubis;
        cumulDegatsSubis = cumulAvantCeTour + degatsDeCeTour;
        if (cumulDegatsSubis >= pvTotaux) {
            const restant = pvTotaux - cumulAvantCeTour;
            return Math.max(1.0, (tour - 1) + Math.min(1.0, restant / Math.max(0.01, degatsDeCeTour)));
        }
    }
    return Math.max(1.0, CST.MAX_ACTIONS);
}

// Port fidèle de CalculerPowerLevelSimule — même structure, mêmes noms de variable côté C#
// pour qu'un futur correctif soit trivial à reporter ici par simple comparaison ligne à ligne.
function calculerPowerLevelSimule(s, atkEquivalent, critPct, esquivePct, arme, offhand, torso, strat, totalStacksInvestis) {
    let lifesteal = 0, regen = 0, parade = 0, blocage = 0, blocageReduc = 0, shield = 0;
    let poisonDmg = 0, saignementDmg = 0, bonusPlatDivers = 0;
    let critBonusTotal = 0, precisionTotal = 0, penetrationTotal = 0;
    let etourdissementTotal = 0, reductionTirTotal = 0;

    const gearAvecSoin = [];
    [arme, offhand, torso].forEach(g => {
        if (!g) return;
        lifesteal += g.lifesteal || 0;
        regen += g.regeneration || 0;
        parade += g.paradeChance || 0;
        blocage += g.blocage || 0;
        blocageReduc += g.blocageReduction || 0;
        shield += g.shieldMontant || 0;
        if ((g.soinDirect || 0) > 0) gearAvecSoin.push(g);
        const pd = g.poisonDegats || 0;
        poisonDmg += pd * (pd + 1) / 2.0;
        saignementDmg += g.saignementDegats || 0;
        critBonusTotal += g.critBonus || 0;
        precisionTotal += g.precision || 0;
        penetrationTotal += g.penetration || 0;
        etourdissementTotal += g.etourdissementChance || 0;
        reductionTirTotal += g.reductionDegatsTir || 0;
        bonusPlatDivers += (g.resistanceCrit || 0) * 0.150;
        bonusPlatDivers += (g.reflection || 0) * 0.6;
        bonusPlatDivers += (g.antiHealPourcentage || 0) * (g.antiHealDuree || 0) * 0.3;
        bonusPlatDivers += (g.rageBonusMax || 0) * 1.0;
        bonusPlatDivers += (g.marqueDegatsPourcentage || 0) * (g.marqueDuree || 0) * 0.5;
        bonusPlatDivers += (g.tenaciteChance || 0) * 0.8;
        bonusPlatDivers += g.dernierSouffleActif ? 40.0 : 0;
        bonusPlatDivers += (g.frenesieBonusSpd || 0) * (g.frenesieDuree || 0) * 0.3;
        bonusPlatDivers += (g.resistancePoison || 0) * 0.2;
        bonusPlatDivers += (g.resistanceFeu || 0) * 0.2;
    });

    const esquiveCibleEffective = Math.max(0, CST.BASE_ESQUIVE - precisionTotal);
    const hitChance = (100.0 - esquiveCibleEffective) / 100.0;
    const critMulti = 1.0 + (critPct + critBonusTotal) / 100.0;
    const defCibleEffective = dummyDef(totalStacksInvestis) * (1.0 - Math.min(1.0, penetrationTotal / 100.0));
    const mitigationRef = mitigation(defCibleEffective);
    let dpaInflige = hitChance * (atkEquivalent * (1.0 - mitigationRef)) * critMulti;

    if (arme && arme.executionBonus > 0 && arme.executionSeuil > 0) {
        const fractionSousLeSeuil = Math.min(1.0, arme.executionSeuil / 100.0);
        dpaInflige *= (1.0 + fractionSousLeSeuil * (arme.executionBonus / 100.0));
    }

    let enemyHitChance = (100.0 - esquivePct) / 100.0;
    enemyHitChance *= (100.0 - parade) / 100.0;
    const mitigationSelf = mitigation(s.def);
    let dpaSubi = enemyHitChance * (dummyAtk(totalStacksInvestis) * (1.0 - mitigationSelf)) * (1.0 + CST.BASE_CRIT / 100.0);

    const blocageMitig = (blocage / 100.0) * (blocageReduc / 100.0);
    dpaSubi *= (1.0 - blocageMitig);

    if (etourdissementTotal > 0) {
        dpaSubi *= (1.0 - Math.min(0.5, hitChance * (etourdissementTotal / 100.0) * 0.7));
    }
    if (reductionTirTotal > 0) {
        dpaSubi *= (1.0 - Math.min(1.0, reductionTirTotal / 100.0) * CST.PROPORTION_ARMES_TIR);
    }

    const soinParTour = regen + (dpaInflige * (lifesteal / 100.0));

    const fractionActionsPropres = s.spd / (s.spd + CST.BASE_SPD);
    const tourDebutFatigue = CST.ROPE_START_ACTION * fractionActionsPropres;
    const toursParTickFatigue = Math.max(0.01, CST.ROPE_CADENCE * fractionActionsPropres);

    // Double passage (voir usagesEffectifsStrategeme) : un horizon generique d abord, pour sortir
    // une premiere estimation de survieTours, puis cette survie estimee reinjectee comme horizon
    // reel -- propre a CE personnage plutot qu a une duree de combat generique supposee.
    const calculerPvTotaux = (horizon) => {
        let soinDirectH = 0, shieldStratH = 0;
        gearAvecSoin.forEach(g => { soinDirectH += (g.soinDirect || 0) * usagesEffectifsStrategeme(g, horizon); });
        if (strat && strat.shieldMontant > 0) shieldStratH = strat.shieldMontant * usagesEffectifsStrategeme(strat, horizon);
        return s.pv + shield + shieldStratH + soinDirectH;
    };

    const survieToursEstimee = calculerSurvieTours(calculerPvTotaux(HORIZON_INITIAL_TOURS), dpaSubi, soinParTour, tourDebutFatigue, toursParTickFatigue);
    const pvTotaux = calculerPvTotaux(survieToursEstimee);
    let survieTours = calculerSurvieTours(pvTotaux, dpaSubi, soinParTour, tourDebutFatigue, toursParTickFatigue);

    let totalDmg = dpaInflige * survieTours * (s.spd / CST.BASE_SPD);

    const coupsQuiTouchent = hitChance * survieTours;
    const facteurPoisonSoutenu = Math.min(80.0, 1.0 + coupsQuiTouchent * coupsQuiTouchent * 0.03);
    totalDmg += poisonDmg * facteurPoisonSoutenu;
    totalDmg += saignementDmg * 3.0 * Math.min(3.0, survieTours / 3.0);

    if (strat) {
        // Meme correctif ici : le nombre de charges de degats/poison/brulure du strategeme
        // utilise maintenant la survie REELLE de ce personnage (survieTours) comme horizon, plutot
        // que l ancien horizon generique fixe -- vaut pour tout objet a "coordonnees"
        // usagesParCombat/cooldownTours, pas seulement les boucliers.
        let stratDegats = (strat.degatsDirects || 0) * usagesEffectifsStrategeme(strat, survieTours) * Math.max(1, strat.coupsParUsage || 1);
        if (strat.delaiTours > 0) {
            const fiabilite = Math.min(1.0, survieTours / (strat.delaiTours + 1.0));
            stratDegats *= fiabilite;
        }
        totalDmg += (stratDegats * CST.POIDS_BURST);

        if (strat.poisonDegats > 0) {
            const stratPoisonDmg = strat.poisonDegats * (strat.poisonDegats + 1) / 2.0 * usagesEffectifsStrategeme(strat, survieTours);
            totalDmg += stratPoisonDmg * CST.POIDS_BURST;
        }
        if (strat.brulureDegats > 0 && strat.brulureDuree > 0) {
            const stratBrulureDmg = strat.brulureDegats * strat.brulureDuree * usagesEffectifsStrategeme(strat, survieTours);
            totalDmg += stratBrulureDmg * CST.POIDS_BURST;
        }
    }

    const scoreBrut = totalDmg + bonusPlatDivers;
    const powerLevel = scoreBrut / CST.DIVISEUR;

    return { dpaInflige, dpaSubi, survieTours, totalDmg, powerLevel, pvTotaux, soinParTour };
}

// Point d'entrée unique pour la page : à partir de stacks + équipement CHOISIS, renvoie tout ce
// qu'affiche le calculateur. `equipementBrut` = { arme, offhand, torso, strat } (objets BRUTS du
// catalogue, avec un champ .niveau ajouté = nombre de doublons possédés, comme partout ailleurs
// sur le site) — le nivelage (AppliquerAmelioration) est fait ICI, une seule fois, avant tout calcul.
function simulerBuild(stacks, equipementBrut) {
    const equipement = nivelerEquipement(equipementBrut);
    const s = calculerStatsEffectives(stacks, equipement);
    const critPct = CST.BASE_CRIT + CST.LUCK_CRIT_MAX * Math.tanh(s.luckLineaire / CST.K_LUCK);
    const esquivePct = CST.BASE_ESQUIVE + s.esquiveGear;
    const atkEquivalent = estimerAtkEquivalentAvecStance(s, equipement.arme);
    const totalStacksInvestis = stacks.atk + stacks.def + stacks.pv + stacks.spd + stacks.luck;
    const resultat = calculerPowerLevelSimule(s, atkEquivalent, critPct, esquivePct, equipement.arme, equipement.offhand, equipement.torso, equipement.strat, totalStacksInvestis);
    return { stats: s, critPct, esquivePct, atkEquivalent, equipementNivele: equipement, ...resultat };
}

// Nivelle les 4 emplacements d'un coup (voir appliquerAmelioration). Centralisé ici pour qu'un
// seul appel niveler + un seul appel simulerBuild ne double jamais l'application du niveau.
function nivelerEquipement(equipementBrut) {
    return {
        arme: appliquerAmelioration(equipementBrut.arme, equipementBrut.arme ? (equipementBrut.arme.niveau || 0) : 0),
        offhand: appliquerAmelioration(equipementBrut.offhand, equipementBrut.offhand ? (equipementBrut.offhand.niveau || 0) : 0),
        torso: appliquerAmelioration(equipementBrut.torso, equipementBrut.torso ? (equipementBrut.torso.niveau || 0) : 0),
        strat: appliquerAmelioration(equipementBrut.strat, equipementBrut.strat ? (equipementBrut.strat.niveau || 0) : 0),
    };
}

if (typeof module !== 'undefined') module.exports = { CST, simulerBuild, calculerStatsEffectives, calculerPowerLevelSimule, estimerAtkEquivalentAvecStance, appliquerAmelioration, nivelerEquipement, mitigation };
