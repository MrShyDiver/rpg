/* ==========================================================================
   NAVIGATION COMMUNE — une seule ligne à ajouter dans chaque page :
       <script src="nav.js" defer></script>
   (à placer juste avant </body>)

   Le script s'injecte tout seul : il crée la barre, repère la page courante,
   et décale le contenu pour ne rien recouvrir. Aucune modification du HTML
   ou du CSS existant de tes pages n'est nécessaire.

   Sur les pages de profil (stats.html / inventaire.html), il ajoute en plus
   une barre de recherche qui bascule sur quelqu'un d'autre SANS changer de
   page : depuis l'inventaire d'Aurel, chercher "Ronon" ouvre l'inventaire de
   Ronon — pas son profil.

   Tout est préfixé "hdnav-" pour ne jamais entrer en conflit avec les classes
   déjà utilisées (.page, .entete, .wrap, .hero...).
   ========================================================================== */
(function () {
    "use strict";

    // Page d'accueil du site — définie UNE fois, pour que le logo et les liens
    // de repli suivent automatiquement si tu la renommes un jour.
    var ACCUEIL = "home.html";

    // --- Pages du menu -----------------------------------------------------
    // Pour ajouter/retirer une entrée, il suffit de modifier cette liste.
    // "profil: true"  = la page a besoin d'un ?user=pseudo pour s'afficher ; le
    //                   pseudo consulté est reporté d'une page à l'autre.
    // "rechercheNav"  = false pour les pages qui ont DÉJÀ leur propre sélecteur
    //                   de personnage (la boutique), afin de ne pas afficher
    //                   deux champs de recherche concurrents.
    // "donnees: ..."  = le fichier dont la page tire son contenu. Sert à dater
    //                   l'affichage ("mis à jour il y a X min"). Une page sans
    //                   données (le concept) n'a rien à dater.
    var PAGES = [
        { fichier: ACCUEIL,                label: "Accueil",                         donnees: "players.json" },
        { fichier: "annonce-saison.html", label: "Le concept" },
        { fichier: "stats.html",          label: "Profil",     profil: true,         donnees: "players.json" },
        { fichier: "inventaire.html",     label: "Inventaire", profil: true,         donnees: "players.json" },
        { fichier: "scout.html",           label: "Cibles",     profil: true,         donnees: "players.json" },
        { fichier: "shop.html",           label: "Boutique",   profil: true, rechercheNav: false, donnees: "players.json" },
        { fichier: "ranking.html",        label: "Classements",                      donnees: "players.json" },
        { fichier: "codex.html",          label: "Codex",                            donnees: "catalogue_stats.json" }
    ];

    // --- Page courante -----------------------------------------------------
    var fichierCourant = (location.pathname.split("/").pop() || ACCUEIL).toLowerCase();
    if (fichierCourant === "") fichierCourant = ACCUEIL;

    // Le pseudo consulté est transporté d'une page à l'autre : si tu regardes
    // le profil de quelqu'un et que tu cliques sur "Inventaire", tu restes sur
    // la même personne au lieu de retomber sur une page vide.
    var userCourant = new URLSearchParams(location.search).get("user");

    // La page courante doit-elle recevoir la barre de recherche du menu ?
    // (= page de profil qui n'a pas déjà son propre sélecteur)
    var estPageProfil = PAGES.some(function (p) {
        return p.profil && p.rechercheNav !== false && p.fichier === fichierCourant;
    });

    function lienDe(page) {
        if (!page.profil) return page.fichier;
        if (userCourant) return page.fichier + "?user=" + encodeURIComponent(userCourant);
        // Sans pseudo, ces pages n'ont rien à montrer : on renvoie vers la
        // recherche de l'accueil plutôt que vers un écran vide.
        return ACCUEIL + "#recherche";
    }

    // --- Polices (ne recharge pas si la page les a déjà) --------------------
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
        var pre = document.createElement("link");
        pre.rel = "preconnect"; pre.href = "https://fonts.gstatic.com"; pre.crossOrigin = "";
        document.head.appendChild(pre);
        var f = document.createElement("link");
        f.rel = "stylesheet";
        f.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap";
        document.head.appendChild(f);
    }

    // --- Styles ------------------------------------------------------------
    var css = document.createElement("style");
    css.textContent = [
        /* Les variables sont redéclarées en secours : si une page ne définit */
        /* pas :root (cas improbable), la barre garde quand même la bonne     */
        /* apparence au lieu de tomber sur du noir sur noir.                  */
        ".hdnav{--hdnav-bg:#141416;--hdnav-bord:#2c2c2e;--hdnav-jaune:#f2c230;--hdnav-texte:#e9e3d2;--hdnav-attenue:#b8b2a0;",
        "position:fixed;top:0;left:0;right:0;z-index:900;background:rgba(11,11,13,.94);",
        "backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);",
        "border-bottom:3px solid var(--hdnav-jaune);font-family:'Barlow',sans-serif;}",

        ".hdnav-interieur{max-width:1040px;margin:0 auto;padding:0 18px;display:flex;align-items:center;gap:14px;min-height:52px;}",

        /* Marque : renvoie à l'accueil, avec un liseré jaune vertical qui   */
        /* reprend le motif de bordure des .entete existantes.               */
        ".hdnav-marque{display:flex;align-items:center;gap:9px;text-decoration:none;flex:0 0 auto;padding:6px 0;}",
        ".hdnav-marque b{font-family:'Oswald',sans-serif;font-weight:700;font-size:15px;letter-spacing:.04em;",
        "text-transform:uppercase;color:var(--hdnav-texte);line-height:1;}",
        ".hdnav-marque i{display:block;width:3px;height:19px;background:var(--hdnav-jaune);flex:0 0 auto;}",
        ".hdnav-marque:hover b{color:var(--hdnav-jaune);}",

        ".hdnav-liens{display:flex;align-items:center;gap:2px;margin-left:auto;flex-wrap:wrap;}",
        ".hdnav-liens a{font-family:'Oswald',sans-serif;font-weight:500;font-size:13px;letter-spacing:.05em;",
        "text-transform:uppercase;color:var(--hdnav-attenue);text-decoration:none;padding:8px 11px;",
        "border-bottom:2px solid transparent;transition:color .12s,border-color .12s;white-space:nowrap;}",
        ".hdnav-liens a:hover{color:var(--hdnav-texte);border-bottom-color:var(--hdnav-bord);}",
        /* La page courante est signalée par le même jaune que les titres.    */
        ".hdnav-liens a[aria-current=page]{color:var(--hdnav-jaune);border-bottom-color:var(--hdnav-jaune);}",
        ".hdnav a:focus-visible{outline:2px solid var(--hdnav-jaune);outline-offset:2px;border-radius:2px;}",

        /* ---- Recherche de profil (pages stats / inventaire seulement) ---- */
        ".hdnav-rech{position:relative;flex:0 1 230px;min-width:150px;}",
        ".hdnav-rech input{width:100%;background:var(--hdnav-bg);border:1px solid var(--hdnav-bord);",
        "border-radius:6px;padding:7px 11px;color:var(--hdnav-texte);font-size:13px;",
        "font-family:'Barlow',sans-serif;}",
        ".hdnav-rech input::placeholder{color:#6f6b60;}",
        ".hdnav-rech input:focus{outline:none;border-color:var(--hdnav-jaune);}",

        ".hdnav-listbox{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:10;",
        "background:var(--hdnav-bg);border:1px solid var(--hdnav-bord);border-top:3px solid var(--hdnav-jaune);",
        "border-radius:0 0 6px 6px;max-height:min(58vh,340px);overflow-y:auto;display:none;",
        "box-shadow:0 12px 28px rgba(0,0,0,.5);}",
        ".hdnav-listbox.hdnav-ouvert{display:block;}",
        ".hdnav-option{display:flex;align-items:center;gap:10px;padding:8px 11px;cursor:pointer;",
        "border-bottom:1px solid var(--hdnav-bord);}",
        ".hdnav-option:last-child{border-bottom:none;}",
        ".hdnav-option:hover,.hdnav-option.hdnav-actif{background:#1e1e21;}",
        ".hdnav-option.hdnav-actif{box-shadow:inset 2px 0 0 var(--hdnav-jaune);}",
        ".hdnav-option img,.hdnav-option .hdnav-init{width:26px;height:26px;border-radius:50%;flex:0 0 auto;",
        "object-fit:cover;background:#232326;border:1px solid var(--hdnav-bord);}",
        ".hdnav-init{display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;",
        "font-size:12px;color:var(--hdnav-attenue);}",
        ".hdnav-option span{font-size:13px;color:var(--hdnav-texte);white-space:nowrap;overflow:hidden;",
        "text-overflow:ellipsis;flex:1 1 auto;}",
        ".hdnav-option em{font-style:normal;font-family:'Oswald',sans-serif;font-size:12px;",
        "color:var(--hdnav-jaune);flex:0 0 auto;}",
        ".hdnav-vide{padding:11px;font-size:13px;color:var(--hdnav-attenue);}",

        /* ---- Fraîcheur des données, intégrée à la barre ---- */
        ".hdnav-maj{display:flex;align-items:center;gap:7px;flex:0 0 auto;padding-left:14px;",
        "margin-left:6px;border-left:1px solid var(--hdnav-bord);}",
        ".hdnav-maj-texte{font-size:11.5px;color:var(--hdnav-attenue);white-space:nowrap;}",
        ".hdnav-maj-texte b{color:var(--hdnav-texte);font-weight:600;}",
        /* Au-delà de 15 min, les données sortent du rythme habituel de mise à */
        /* jour (5-10 min) : on le signale au lieu de laisser croire au frais. */
        ".hdnav-maj-texte.hdnav-vieux b{color:var(--hdnav-jaune);}",

        ".hdnav-actu{display:flex;align-items:center;justify-content:center;width:28px;height:28px;",
        "background:none;border:1px solid var(--hdnav-bord);border-radius:5px;color:var(--hdnav-attenue);",
        "cursor:pointer;padding:0;flex:0 0 auto;}",
        ".hdnav-actu svg{width:15px;height:15px;display:block;}",
        ".hdnav-actu:hover{border-color:var(--hdnav-jaune);color:var(--hdnav-jaune);}",
        ".hdnav-actu:focus-visible{outline:2px solid var(--hdnav-jaune);outline-offset:2px;}",
        ".hdnav-actu[disabled]{color:var(--hdnav-jaune);border-color:var(--hdnav-jaune);cursor:default;}",
        ".hdnav-actu[disabled] svg{animation:hdnav-tourne .7s linear infinite;}",
        "@keyframes hdnav-tourne{to{transform:rotate(360deg);}}",
        "@media (prefers-reduced-motion:reduce){.hdnav-actu[disabled] svg{animation:none;}}",

        /* Bouton mobile */
        ".hdnav-bouton{display:none;background:none;border:1px solid var(--hdnav-bord);",
        "color:var(--hdnav-texte);font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:.06em;",
        "text-transform:uppercase;padding:7px 12px;border-radius:6px;cursor:pointer;flex:0 0 auto;}",
        ".hdnav-bouton:hover{border-color:var(--hdnav-jaune);color:var(--hdnav-jaune);}",

        "@media (max-width:860px){.hdnav-rech{flex-basis:180px;}}",
        /* Sous 560px, on garde le chiffre mais on coupe le libellé : c'est la */
        /* durée qui informe, pas les mots qui la précèdent.                   */
        "@media (max-width:560px){.hdnav-maj-prefixe{display:none;}",
        ".hdnav-maj{padding-left:10px;margin-left:2px;}}",

        "@media (max-width:760px){",
        ".hdnav-bouton{display:block;}",
        /* Les liens (qui portaient le margin-left:auto) sont repliés ici :   */
        /* c'est le groupe fraîcheur qui prend le relais pour caler la fin de */
        /* barre à droite.                                                  */
        ".hdnav-maj{margin-left:auto;}",
        /* Sur mobile la recherche passe sur sa propre ligne, pleine largeur, */
        /* et reste visible même menu fermé : c'est l'action la plus utile    */
        /* d'une page de profil.                                              */
        ".hdnav-rech{order:3;flex:1 1 100%;min-width:0;margin-bottom:8px;}",
        ".hdnav-liens{display:none;order:4;width:100%;margin:0;flex-direction:column;align-items:stretch;gap:0;",
        "padding-bottom:8px;border-top:1px solid var(--hdnav-bord);}",
        ".hdnav-liens.hdnav-ouvert{display:flex;}",
        ".hdnav-liens a{padding:11px 4px;border-bottom:1px solid var(--hdnav-bord);border-left:2px solid transparent;}",
        ".hdnav-liens a[aria-current=page]{border-left-color:var(--hdnav-jaune);border-bottom-color:var(--hdnav-bord);}",
        ".hdnav-interieur{flex-wrap:wrap;padding-top:6px;padding-bottom:0;}",
        "}",

        "@media (prefers-reduced-motion:reduce){.hdnav-liens a{transition:none;}}"
    ].join("");
    document.head.appendChild(css);

    // --- Recherche de profil ----------------------------------------------
    function construireRecherche() {
        var boite = document.createElement("div");
        boite.className = "hdnav-rech";

        var input = document.createElement("input");
        input.type = "text";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.placeholder = "Voir quelqu'un d'autre...";
        input.setAttribute("role", "combobox");
        input.setAttribute("aria-expanded", "false");
        input.setAttribute("aria-controls", "hdnav-listbox");
        input.setAttribute("aria-autocomplete", "list");
        input.setAttribute("aria-label", "Rechercher un autre personnage");

        var listbox = document.createElement("div");
        listbox.className = "hdnav-listbox";
        listbox.id = "hdnav-listbox";
        listbox.setAttribute("role", "listbox");

        boite.appendChild(input);
        boite.appendChild(listbox);

        var personnages = null;   // null = pas encore chargé
        var chargement = false;
        var indexActif = -1;

        function echapper(t) {
            return String(t).replace(/[&<>"']/g, function (c) {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
            });
        }

        // Chargé seulement au premier focus : une page de profil ne télécharge
        // players.json que si on cherche réellement quelqu'un.
        function charger() {
            if (personnages || chargement) return Promise.resolve();
            chargement = true;
            return fetch("players.json?v=" + Date.now())
                .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
                .then(function (data) {
                    personnages = Object.keys(data).map(function (cle) {
                        var j = data[cle], s = j.stats || {};
                        return {
                            cle: cle,
                            nom: j.nomAffichage || cle,
                            avatar: j.avatar || "",
                            power: s.powerLevel || 0
                        };
                    }).sort(function (a, b) { return b.power - a.power; });
                    chargement = false;
                })
                .catch(function () {
                    chargement = false;
                    personnages = [];
                    listbox.innerHTML = '<div class="hdnav-vide">Liste indisponible. Recharge la page.</div>';
                    ouvrir();
                });
        }

        function ouvrir() {
            listbox.classList.add("hdnav-ouvert");
            input.setAttribute("aria-expanded", "true");
        }
        function fermer() {
            listbox.classList.remove("hdnav-ouvert");
            input.setAttribute("aria-expanded", "false");
            input.removeAttribute("aria-activedescendant");
            indexActif = -1;
        }

        // On reste sur la MÊME page, seul le pseudo change.
        function urlVers(cle) {
            return fichierCourant + "?user=" + encodeURIComponent(cle);
        }

        function rendre() {
            if (!personnages || !personnages.length) return;
            var q = input.value.trim().toLowerCase();
            var liste = personnages;
            if (q) {
                liste = personnages.filter(function (p) {
                    return p.nom.toLowerCase().indexOf(q) !== -1 || p.cle.indexOf(q) !== -1;
                });
            }
            // Sans frappe, on propose les plus puissants : une liste vide
            // n'aiderait personne à démarrer.
            var visibles = liste.slice(0, 8);
            indexActif = -1;
            input.removeAttribute("aria-activedescendant");

            if (!visibles.length) {
                listbox.innerHTML = '<div class="hdnav-vide">Aucun personnage ne correspond.</div>';
                ouvrir();
                return;
            }
            listbox.innerHTML = visibles.map(function (p, i) {
                var img = p.avatar
                    ? '<img src="' + echapper(p.avatar) + '" alt="" loading="lazy">'
                    : '<div class="hdnav-init">' + echapper((p.nom || "?").charAt(0).toUpperCase()) + "</div>";
                return '<div class="hdnav-option" role="option" id="hdnav-opt-' + i + '"' +
                       ' aria-selected="false" data-cle="' + echapper(p.cle) + '">' +
                       img + "<span>" + echapper(p.nom) + "</span>" +
                       "<em>" + Math.round(p.power) + "</em></div>";
            }).join("");
            ouvrir();
        }

        function surligner(n) {
            var options = listbox.querySelectorAll(".hdnav-option");
            if (!options.length) return;
            if (indexActif >= 0 && options[indexActif]) {
                options[indexActif].classList.remove("hdnav-actif");
                options[indexActif].setAttribute("aria-selected", "false");
            }
            indexActif = (n + options.length) % options.length;
            options[indexActif].classList.add("hdnav-actif");
            options[indexActif].setAttribute("aria-selected", "true");
            input.setAttribute("aria-activedescendant", "hdnav-opt-" + indexActif);
            options[indexActif].scrollIntoView({ block: "nearest" });
        }

        input.addEventListener("focus", function () { charger().then(rendre); });
        input.addEventListener("input", function () { charger().then(rendre); });

        input.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { fermer(); input.blur(); return; }
            var options = listbox.querySelectorAll(".hdnav-option");
            if (e.key === "ArrowDown") { e.preventDefault(); if (options.length) surligner(indexActif + 1); }
            else if (e.key === "ArrowUp") { e.preventDefault(); if (options.length) surligner(indexActif - 1); }
            else if (e.key === "Enter") {
                e.preventDefault();
                // Sans sélection au clavier, Entrée ouvre le premier résultat.
                var cible = options[indexActif >= 0 ? indexActif : 0];
                if (cible) location.href = urlVers(cible.getAttribute("data-cle"));
            }
        });

        listbox.addEventListener("mousedown", function (e) {
            // mousedown plutôt que click : le blur de l'input fermerait la
            // liste avant que le clic n'aboutisse.
            var opt = e.target.closest(".hdnav-option");
            if (opt) { e.preventDefault(); location.href = urlVers(opt.getAttribute("data-cle")); }
        });

        document.addEventListener("click", function (e) {
            if (!boite.contains(e.target)) fermer();
        });

        return boite;
    }

    // --- Construction ------------------------------------------------------
    var nav = document.createElement("nav");
    nav.className = "hdnav";
    nav.setAttribute("aria-label", "Navigation principale");

    var interieur = document.createElement("div");
    interieur.className = "hdnav-interieur";

    var marque = document.createElement("a");
    marque.className = "hdnav-marque";
    marque.href = ACCUEIL;
    marque.innerHTML = '<i></i><b>Twitch RPG</b>';
    interieur.appendChild(marque);

    // La recherche n'apparaît que là où elle a un sens : sur les pages qui
    // affichent UNE personne. Sur l'accueil, les classements ou le codex,
    // elle ferait doublon avec les outils déjà présents.
    if (estPageProfil) interieur.appendChild(construireRecherche());

    var bouton = document.createElement("button");
    bouton.className = "hdnav-bouton";
    bouton.type = "button";
    bouton.textContent = "Menu";
    bouton.setAttribute("aria-expanded", "false");
    // Inséré plus bas, APRÈS le groupe de fraîcheur : la fin de barre doit se
    // lire "liens · données · menu", aussi bien sur bureau que sur mobile.

    var liens = document.createElement("div");
    liens.className = "hdnav-liens";
    liens.id = "hdnav-liens";
    bouton.setAttribute("aria-controls", "hdnav-liens");

    PAGES.forEach(function (page) {
        var a = document.createElement("a");
        a.href = lienDe(page);
        a.textContent = page.label;
        if (page.fichier === fichierCourant) a.setAttribute("aria-current", "page");
        liens.appendChild(a);
    });
    interieur.appendChild(liens);

    // --- Fraîcheur des données, dans la barre elle-même --------------------
    // Les données sont republiées toutes les 5 à 10 minutes : sans repère de
    // fraîcheur, impossible de savoir si un duel qu'on vient de jouer est déjà
    // pris en compte. On lit la date réelle du fichier de données (en-tête
    // Last-Modified) plutôt qu'une date écrite dans la page, qui mentirait.
    var pageCourante = PAGES.filter(function (p) { return p.fichier === fichierCourant; })[0];

    var maj = document.createElement("div");
    maj.className = "hdnav-maj";

    var majTexte = document.createElement("div");
    majTexte.className = "hdnav-maj-texte";
    majTexte.setAttribute("aria-live", "polite");

    var boutonActu = document.createElement("button");
    boutonActu.className = "hdnav-actu";
    boutonActu.type = "button";
    boutonActu.title = "Recharger la page en ignorant le cache";
    // Sans texte visible, le bouton a besoin d'un nom pour les lecteurs d'écran.
    boutonActu.setAttribute("aria-label", "Actualiser la page");
    boutonActu.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';

    maj.appendChild(majTexte);
    maj.appendChild(boutonActu);

    // Recharge en contournant le cache : on change l'URL (paramètre "maj")
    // plutôt qu'appeler reload(), dont le rechargement forcé n'est plus
    // honoré par les navigateurs. Le pseudo consulté est conservé.
    boutonActu.addEventListener("click", function () {
        boutonActu.disabled = true;   // l'icône se met à tourner (voir CSS)
        var url = new URL(location.href);
        url.searchParams.set("maj", Date.now());
        location.href = url.toString();
    });

    function formuler(dateFichier) {
        var minutes = Math.max(0, Math.round((Date.now() - dateFichier.getTime()) / 60000));
        var quand;
        if (minutes < 1)        quand = "à l'instant";
        else if (minutes < 60) quand = "il y a " + minutes + " min";
        else {
            var h = Math.floor(minutes / 60);
            quand = "il y a " + h + " h";
        }
        majTexte.innerHTML = '<span class="hdnav-maj-prefixe">Données </span><b>' + quand + "</b>";
        majTexte.classList.toggle("hdnav-vieux", minutes >= 15);
        maj.title = "Dernière publication : " + dateFichier.toLocaleString("fr-FR");
    }

    if (pageCourante && pageCourante.donnees) {
        fetch(pageCourante.donnees, { method: "HEAD", cache: "no-store" })
            .then(function (r) {
                var lm = r.headers.get("Last-Modified");
                if (!lm) throw new Error("date absente");
                var d = new Date(lm);
                if (isNaN(d.getTime())) throw new Error("date illisible");
                formuler(d);
                // Le compteur continue d'avancer si la page reste ouverte
                // longtemps (typiquement un second écran pendant le stream).
                setInterval(function () { formuler(d); }, 30000);
            })
            .catch(function () {
                // Pas de date disponible : on le dit, au lieu d'afficher une
                // fraîcheur inventée. Le bouton, lui, reste utile.
                majTexte.innerHTML = '<span class="hdnav-maj-prefixe">Date de mise à jour </span>indisponible';
            });
    }

    interieur.appendChild(maj);
    interieur.appendChild(bouton);

    nav.appendChild(interieur);
    document.body.insertBefore(nav, document.body.firstChild);

    bouton.addEventListener("click", function () {
        var ouvert = liens.classList.toggle("hdnav-ouvert");
        bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
    });

    // --- Décalage du contenu ----------------------------------------------
    // On AJOUTE la hauteur de la barre au padding déjà présent, au lieu de le
    // remplacer : chaque page garde ainsi son espacement d'origine (28px sur
    // les unes, 0 sur annonce-saison.html qui commence par un hero).
    var paddingInitial = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
    function decaler() {
        document.body.style.paddingTop = (paddingInitial + nav.offsetHeight) + "px";
    }
    decaler();
    window.addEventListener("resize", decaler);
    // La barre change de hauteur quand le menu mobile s'ouvre.
    if (window.ResizeObserver) new ResizeObserver(decaler).observe(nav);
})();
