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
    DIVISEUR: 2.8,
    // Même valeur approximative que le commentaire C# ("2 armes tir sur 7 au catalogue") —
    // à recalculer si le roster d'armes change significativement.
    PROPORTION_ARMES_TIR: 0.30,
};

function mitigation(def) {
    return (CST.DEF_MITIGATION_MAX * Math.tanh(def / CST.K_DEF_MITIGATION)) / 100.0;
}

// --- Construit les Stats effectives à partir de stacks CHOISIS (hypothétiques) et d'un
// équipement CHOISI (hypothétique) — équivalent JS de GetEffectiveStats, mais sans jamais lire
// les registres réels : tout vient des choix faits sur cette page.
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
        appliquerStatAuPersonnage(s, g.stat, (g.bonus || 0) + g.niveau * (g.increment || 0));
        appliquerStatAuPersonnage(s, g.stat2, (g.bonus2 || 0) + g.niveau * (g.increment2 || 0));
        appliquerStatAuPersonnage(s, g.stat3, (g.bonus3 || 0) + g.niveau * (g.increment3 || 0));
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

function usagesEffectifsStrategeme(s) {
    const TOURS_PROPRES_TYPE = 10.0;
    const usages = Math.max(1, s.usagesParCombat || 1);
    let total = 0;
    for (let k = 1; k <= usages; k++) {
        const coolDownEcoule = (k - 1) * (s.cooldownTours || 0);
        total += Math.max(0, 1.0 - coolDownEcoule / TOURS_PROPRES_TYPE);
    }
    return total;
}

// Port fidèle de CalculerPowerLevelSimule — même structure, mêmes noms de variable côté C#
// pour qu'un futur correctif soit trivial à reporter ici par simple comparaison ligne à ligne.
function calculerPowerLevelSimule(s, atkEquivalent, critPct, esquivePct, arme, offhand, torso, strat) {
    let lifesteal = 0, regen = 0, parade = 0, blocage = 0, blocageReduc = 0, shield = 0, soinDirect = 0;
    let poisonDmg = 0, saignementDmg = 0, bonusPlatDivers = 0;
    let critBonusTotal = 0, precisionTotal = 0, penetrationTotal = 0;
    let etourdissementTotal = 0, reductionTirTotal = 0;

    [arme, offhand, torso].forEach(g => {
        if (!g) return;
        lifesteal += g.lifesteal || 0;
        regen += g.regeneration || 0;
        parade += g.paradeChance || 0;
        blocage += g.blocage || 0;
        blocageReduc += g.blocageReduction || 0;
        shield += g.shieldMontant || 0;
        soinDirect += (g.soinDirect || 0) * usagesEffectifsStrategeme(g);
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
    const defCibleEffective = CST.BASE_DEF * (1.0 - Math.min(1.0, penetrationTotal / 100.0));
    const mitigationRef = mitigation(defCibleEffective);
    let dpaInflige = hitChance * (atkEquivalent * (1.0 - mitigationRef)) * critMulti;

    if (arme && arme.executionBonus > 0 && arme.executionSeuil > 0) {
        const fractionSousLeSeuil = Math.min(1.0, arme.executionSeuil / 100.0);
        dpaInflige *= (1.0 + fractionSousLeSeuil * (arme.executionBonus / 100.0));
    }

    let enemyHitChance = (100.0 - esquivePct) / 100.0;
    enemyHitChance *= (100.0 - parade) / 100.0;
    const mitigationSelf = mitigation(s.def);
    let dpaSubi = enemyHitChance * (CST.BASE_ATK * (1.0 - mitigationSelf)) * (1.0 + CST.BASE_CRIT / 100.0);

    const blocageMitig = (blocage / 100.0) * (blocageReduc / 100.0);
    dpaSubi *= (1.0 - blocageMitig);

    if (etourdissementTotal > 0) {
        dpaSubi *= (1.0 - Math.min(0.5, hitChance * (etourdissementTotal / 100.0) * 0.7));
    }
    if (reductionTirTotal > 0) {
        dpaSubi *= (1.0 - Math.min(1.0, reductionTirTotal / 100.0) * CST.PROPORTION_ARMES_TIR);
    }

    const soinParTour = regen + (dpaInflige * (lifesteal / 100.0));

    if (strat && strat.shieldMontant > 0) {
        shield += strat.shieldMontant * usagesEffectifsStrategeme(strat);
    }
    const pvTotaux = s.pv + shield + soinDirect;

    const fractionActionsPropres = s.spd / (s.spd + CST.BASE_SPD);
    const tourDebutFatigue = CST.ROPE_START_ACTION * fractionActionsPropres;
    const toursParTickFatigue = Math.max(0.01, CST.ROPE_CADENCE * fractionActionsPropres);

    let survieTours = CST.MAX_ACTIONS;
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
            survieTours = (tour - 1) + Math.min(1.0, restant / Math.max(0.01, degatsDeCeTour));
            break;
        }
    }
    survieTours = Math.max(1.0, survieTours);

    let totalDmg = dpaInflige * survieTours * (s.spd / CST.BASE_SPD);

    const coupsQuiTouchent = hitChance * survieTours;
    const facteurPoisonSoutenu = Math.min(80.0, 1.0 + coupsQuiTouchent * coupsQuiTouchent * 0.03);
    totalDmg += poisonDmg * facteurPoisonSoutenu;
    totalDmg += saignementDmg * 3.0 * Math.min(3.0, survieTours / 3.0);

    if (strat) {
        let stratDegats = (strat.degatsDirects || 0) * usagesEffectifsStrategeme(strat) * Math.max(1, strat.coupsParUsage || 1);
        if (strat.delaiTours > 0) {
            const fiabilite = Math.min(1.0, survieTours / (strat.delaiTours + 1.0));
            stratDegats *= fiabilite;
        }
        totalDmg += (stratDegats * CST.POIDS_BURST);

        if (strat.poisonDegats > 0) {
            const stratPoisonDmg = strat.poisonDegats * (strat.poisonDegats + 1) / 2.0 * usagesEffectifsStrategeme(strat);
            totalDmg += stratPoisonDmg * CST.POIDS_BURST;
        }
        if (strat.brulureDegats > 0 && strat.brulureDuree > 0) {
            const stratBrulureDmg = strat.brulureDegats * strat.brulureDuree * usagesEffectifsStrategeme(strat);
            totalDmg += stratBrulureDmg * CST.POIDS_BURST;
        }
    }

    const scoreBrut = totalDmg + bonusPlatDivers;
    const powerLevel = scoreBrut / CST.DIVISEUR;

    return { dpaInflige, dpaSubi, survieTours, totalDmg, powerLevel, pvTotaux, soinParTour };
}

// Point d'entrée unique pour la page : à partir de stacks + équipement CHOISIS, renvoie tout ce
// qu'affiche le calculateur. `equipement` = { arme, offhand, torso, strat } (objets du catalogue,
// avec un champ .niveau ajouté = nombre de doublons possédés, comme partout ailleurs sur le site).
function simulerBuild(stacks, equipement) {
    const s = calculerStatsEffectives(stacks, equipement);
    const critPct = CST.BASE_CRIT + CST.LUCK_CRIT_MAX * Math.tanh(Math.max(0, stacks.luck) / CST.K_LUCK);
    const esquivePct = CST.BASE_ESQUIVE + s.esquiveGear;
    const atkEquivalent = estimerAtkEquivalentAvecStance(s, equipement.arme);
    const resultat = calculerPowerLevelSimule(s, atkEquivalent, critPct, esquivePct, equipement.arme, equipement.offhand, equipement.torso, equipement.strat);
    return { stats: s, critPct, esquivePct, atkEquivalent, ...resultat };
}

if (typeof module !== 'undefined') module.exports = { CST, simulerBuild, calculerStatsEffectives, calculerPowerLevelSimule, estimerAtkEquivalentAvecStance, mitigation };
