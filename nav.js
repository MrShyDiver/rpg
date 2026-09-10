/* ==========================================================================
   NAVIGATION COMMUNE — une seule ligne à ajouter dans chaque page :
       <script src="nav.js" defer></script>
   (à placer juste avant </body>)

   Design moderne : Effet verre trempé (glassmorphism), animations fluides,
   menu mobile en overlay, et boutons arrondis (pill design).
   ========================================================================== */
(function () {
    "use strict";

    var ACCUEIL = "home.html";

    var PAGES = [
        { fichier: ACCUEIL,               label: "Accueil",                         donnees: "players.json" },
        { fichier: "annonce-saison.html", label: "Le concept" },
        { fichier: "stats.html",          label: "Profil",     profil: true,        donnees: "players.json" },
        { fichier: "inventaire.html",     label: "Inventaire", profil: true,        donnees: "players.json" },
        { fichier: "scout.html",          label: "Scout",     profil: true,        donnees: "players.json" },
        { fichier: "shop.html",           label: "Boutique",   profil: true, rechercheNav: false, donnees: "players.json" },
        { fichier: "ranking.html",        label: "Classements",                     donnees: "players.json" },
        { fichier: "codex.html",          label: "Codex",                           donnees: "catalogue_stats.json" }
    ];

    var fichierCourant = (location.pathname.split("/").pop() || ACCUEIL).toLowerCase();
    if (fichierCourant === "") fichierCourant = ACCUEIL;

    var userCourant = new URLSearchParams(location.search).get("user");

    var estPageProfil = PAGES.some(function (p) {
        return p.profil && p.rechercheNav !== false && p.fichier === fichierCourant;
    });

    function lienDe(page) {
        if (!page.profil) return page.fichier;
        if (userCourant) return page.fichier + "?user=" + encodeURIComponent(userCourant);
        return ACCUEIL + "#recherche";
    }

    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
        var pre = document.createElement("link");
        pre.rel = "preconnect"; pre.href = "https://fonts.gstatic.com"; pre.crossOrigin = "";
        document.head.appendChild(pre);
        var f = document.createElement("link");
        f.rel = "stylesheet";
        f.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap";
        document.head.appendChild(f);
    }

    /* --- STYLES MODERNISÉS --- */
    var css = document.createElement("style");
    css.textContent = [
        ".hdnav { --hdnav-bg: rgba(15, 15, 18, 0.85); --hdnav-bord: #2c2c2e; --hdnav-jaune: #f2c230; --hdnav-texte: #e9e3d2; --hdnav-attenue: #b8b2a0; --hdnav-hover: rgba(255, 255, 255, 0.06);",
        "position: fixed; top: 0; left: 0; right: 0; z-index: 900; background: var(--hdnav-bg);",
        "backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);",
        "border-bottom: 1px solid rgba(255,255,255,0.05); font-family: 'Barlow', sans-serif; box-shadow: 0 4px 30px rgba(0,0,0,0.3); transition: background 0.3s ease; }",

        ".hdnav-interieur { max-width: 1040px; margin: 0 auto; padding: 0 18px; display: flex; align-items: center; gap: 16px; min-height: 56px; }",

        /* Marque */
        ".hdnav-marque { display: flex; align-items: center; gap: 10px; text-decoration: none; flex: 0 0 auto; padding: 6px 0; transition: transform 0.2s ease; }",
        ".hdnav-marque:hover { transform: scale(1.02); }",
        ".hdnav-marque b { font-family: 'Oswald', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: .04em; text-transform: uppercase; color: var(--hdnav-texte); line-height: 1; transition: color 0.2s ease; }",
        ".hdnav-marque i { display: block; width: 4px; height: 18px; background: var(--hdnav-jaune); border-radius: 2px; flex: 0 0 auto; box-shadow: 0 0 8px rgba(242,194,48,0.4); }",
        ".hdnav-marque:hover b { color: var(--hdnav-jaune); }",

        /* Liens (Pill design) */
        ".hdnav-liens { display: flex; align-items: center; gap: 4px; margin-left: auto; flex-wrap: wrap; }",
        ".hdnav-liens a { font-family: 'Oswald', sans-serif; font-weight: 500; font-size: 13.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--hdnav-attenue); text-decoration: none; padding: 8px 14px; border-radius: 8px; transition: all 0.2s ease; white-space: nowrap; }",
        ".hdnav-liens a:hover { background: var(--hdnav-hover); color: var(--hdnav-texte); }",
        ".hdnav-liens a[aria-current=page] { background: rgba(242,194,48,0.12); color: var(--hdnav-jaune); }",
        ".hdnav a:focus-visible { outline: 2px solid var(--hdnav-jaune); outline-offset: 2px; }",

        /* Recherche avec loupe intégrée */
        ".hdnav-rech { position: relative; flex: 0 1 240px; min-width: 150px; }",
        ".hdnav-rech input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--hdnav-bord); border-radius: 8px; padding: 8px 12px 8px 36px; color: var(--hdnav-texte); font-size: 13.5px; font-family: 'Barlow', sans-serif; transition: all 0.2s ease; ",
        /* Icone Loupe en SVG Data URI */
        "background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23b8b2a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E\");",
        "background-repeat: no-repeat; background-position: 12px center; }",
        ".hdnav-rech input::placeholder { color: #6f6b60; }",
        ".hdnav-rech input:focus { outline: none; border-color: var(--hdnav-jaune); background-color: rgba(0,0,0,0.5); box-shadow: 0 0 0 3px rgba(242,194,48,0.15); }",

        /* Résultats de recherche animés */
        ".hdnav-listbox { position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 10; background: rgba(20,20,23,0.95); backdrop-filter: blur(12px); border: 1px solid var(--hdnav-bord); border-radius: 8px; max-height: min(58vh,340px); overflow-y: auto; box-shadow: 0 16px 40px rgba(0,0,0,0.6); ",
        "opacity: 0; transform: translateY(-10px); visibility: hidden; transition: opacity 0.2s ease, transform 0.2s ease; }",
        ".hdnav-listbox.hdnav-ouvert { opacity: 1; transform: translateY(0); visibility: visible; }",
        ".hdnav-option { display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }",
        ".hdnav-option:last-child { border-bottom: none; }",
        ".hdnav-option:hover, .hdnav-option.hdnav-actif { background: rgba(255,255,255,0.06); }",
        ".hdnav-option.hdnav-actif { border-left: 3px solid var(--hdnav-jaune); padding-left: 11px; }",
        ".hdnav-option img, .hdnav-option .hdnav-init { width: 30px; height: 30px; border-radius: 50%; flex: 0 0 auto; object-fit: cover; background: #232326; border: 1px solid var(--hdnav-bord); }",
        ".hdnav-init { display: flex; align-items: center; justify-content: center; font-family: 'Oswald', sans-serif; font-size: 13px; color: var(--hdnav-attenue); }",
        ".hdnav-option span { font-size: 14px; font-weight: 500; color: var(--hdnav-texte); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1 1 auto; }",
        ".hdnav-option em { font-style: normal; font-family: 'Oswald', sans-serif; font-size: 12.5px; color: var(--hdnav-jaune); flex: 0 0 auto; background: rgba(242,194,48,0.1); padding: 2px 6px; border-radius: 4px; }",
        ".hdnav-vide { padding: 14px; font-size: 13.5px; color: var(--hdnav-attenue); text-align: center; }",

        /* Fraîcheur des données (Badge) */
        ".hdnav-maj { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; margin-left: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 4px 6px 4px 10px; border-radius: 20px; }",
        ".hdnav-maj-texte { font-size: 11px; font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; color: var(--hdnav-attenue); white-space: nowrap; }",
        ".hdnav-maj-texte b { color: var(--hdnav-texte); font-family: 'Barlow', sans-serif; letter-spacing: 0; font-weight: 600; text-transform: none; margin-left: 3px; }",
        ".hdnav-maj-texte.hdnav-vieux b { color: var(--hdnav-jaune); }",

        ".hdnav-actu { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: none; border: none; border-radius: 50%; color: var(--hdnav-attenue); cursor: pointer; padding: 0; transition: all 0.2s ease; }",
        ".hdnav-actu svg { width: 14px; height: 14px; display: block; }",
        ".hdnav-actu:hover { background: rgba(255,255,255,0.1); color: var(--hdnav-texte); }",
        ".hdnav-actu[disabled] { color: var(--hdnav-jaune); cursor: default; background: transparent; }",
        ".hdnav-actu[disabled] svg { animation: hdnav-tourne .7s linear infinite; }",
        "@keyframes hdnav-tourne { to { transform: rotate(360deg); } }",

        /* Bouton Hamburger Mobile */
        ".hdnav-bouton { display: none; background: none; border: 1px solid rgba(255,255,255,0.1); color: var(--hdnav-texte); border-radius: 6px; cursor: pointer; flex: 0 0 auto; padding: 6px 8px; transition: all 0.2s; }",
        ".hdnav-bouton:hover { background: rgba(255,255,255,0.05); }",
        ".hdnav-bouton svg { width: 22px; height: 22px; stroke: currentColor; transition: transform 0.3s ease; }",
        
        "@media (max-width: 860px) { .hdnav-rech { flex-basis: 180px; } }",
        "@media (max-width: 600px) { .hdnav-maj-prefixe { display: none; } .hdnav-maj { padding-left: 8px; } }",

        /* MOBILE OVERLAY */
        "@media (max-width: 780px) {",
        ".hdnav-bouton { display: block; }",
        ".hdnav-maj { margin-left: auto; }",
        ".hdnav-rech { order: 3; flex: 1 1 100%; min-width: 0; margin-top: 4px; }",
        /* Le menu devient un panneau déroulant en overlay (ne pousse plus le contenu) */
        ".hdnav-liens { position: absolute; top: 100%; left: 0; right: 0; background: rgba(18, 18, 22, 0.98); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.5); flex-direction: column; align-items: stretch; gap: 4px; padding: 12px 18px 24px; opacity: 0; visibility: hidden; transform: translateY(-15px); transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); margin: 0; z-index: -1; }",
        ".hdnav-liens.hdnav-ouvert { opacity: 1; visibility: visible; transform: translateY(0); }",
        ".hdnav-liens a { padding: 12px 16px; border-radius: 8px; font-size: 15px; background: rgba(255,255,255,0.02); }",
        ".hdnav-interieur { flex-wrap: wrap; padding-top: 8px; padding-bottom: 8px; }",
        "}"
    ].join("");
    document.head.appendChild(css);

    /* --- RECHERCHE --- */
    function construireRecherche() {
        var boite = document.createElement("div");
        boite.className = "hdnav-rech";

        var input = document.createElement("input");
        input.type = "text";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.placeholder = "Chercher qqn...";
        input.setAttribute("role", "combobox");
        input.setAttribute("aria-expanded", "false");
        input.setAttribute("aria-controls", "hdnav-listbox");
        input.setAttribute("aria-autocomplete", "list");

        var listbox = document.createElement("div");
        listbox.className = "hdnav-listbox";
        listbox.id = "hdnav-listbox";
        listbox.setAttribute("role", "listbox");

        boite.appendChild(input);
        boite.appendChild(listbox);

        var personnages = null;
        var chargement = false;
        var indexActif = -1;

        function echapper(t) {
            return String(t).replace(/[&<>"']/g, function (c) {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
            });
        }

        function charger() {
            if (personnages || chargement) return Promise.resolve();
            chargement = true;
            return fetch("players.json?v=" + Date.now())
                .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
                .then(function (data) {
                    personnages = Object.keys(data).map(function (cle) {
                        var j = data[cle], s = j.stats || {};
                        return { cle: cle, nom: j.nomAffichage || cle, avatar: j.avatar || "", power: s.powerLevel || 0 };
                    }).sort(function (a, b) { return b.power - a.power; });
                    chargement = false;
                })
                .catch(function () {
                    chargement = false; personnages = [];
                    listbox.innerHTML = '<div class="hdnav-vide">Données indisponibles.</div>';
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

        function urlVers(cle) {
            return fichierCourant + "?user=" + encodeURIComponent(cle);
        }

        function rendre() {
            if (!personnages || !personnages.length) return;
            var q = input.value.trim().toLowerCase();
            var liste = q ? personnages.filter(function (p) {
                return p.nom.toLowerCase().indexOf(q) !== -1 || p.cle.indexOf(q) !== -1;
            }) : personnages;
            
            var visibles = liste.slice(0, 8);
            indexActif = -1;
            input.removeAttribute("aria-activedescendant");

            if (!visibles.length) {
                listbox.innerHTML = '<div class="hdnav-vide">Aucun résultat.</div>';
                ouvrir(); return;
            }
            listbox.innerHTML = visibles.map(function (p, i) {
                var img = p.avatar ? '<img src="' + echapper(p.avatar) + '" alt="" loading="lazy">'
                                   : '<div class="hdnav-init">' + echapper((p.nom || "?").charAt(0).toUpperCase()) + "</div>";
                return '<div class="hdnav-option" role="option" id="hdnav-opt-' + i + '" aria-selected="false" data-cle="' + echapper(p.cle) + '">' +
                       img + "<span>" + echapper(p.nom) + "</span><em>" + Math.round(p.power) + "</em></div>";
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
                var cible = options[indexActif >= 0 ? indexActif : 0];
                if (cible) location.href = urlVers(cible.getAttribute("data-cle"));
            }
        });

        listbox.addEventListener("mousedown", function (e) {
            var opt = e.target.closest(".hdnav-option");
            if (opt) { e.preventDefault(); location.href = urlVers(opt.getAttribute("data-cle")); }
        });

        document.addEventListener("click", function (e) { if (!boite.contains(e.target)) fermer(); });
        return boite;
    }

    /* --- CONSTRUCTION DU DOM --- */
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

    if (estPageProfil) interieur.appendChild(construireRecherche());

    var bouton = document.createElement("button");
    bouton.className = "hdnav-bouton";
    bouton.type = "button";
    bouton.setAttribute("aria-label", "Ouvrir le menu");
    bouton.setAttribute("aria-expanded", "false");
    // Icône Hamburger SVG (se transforme visuellement via le CSS ou la classe ouvert si on veut l'animer, ici on garde simple)
    bouton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';

    var liens = document.createElement("div");
    liens.className = "hdnav-liens";
    liens.id = "hdnav-liens";

    PAGES.forEach(function (page) {
        var a = document.createElement("a");
        a.href = lienDe(page);
        a.textContent = page.label;
        if (page.fichier === fichierCourant) a.setAttribute("aria-current", "page");
        liens.appendChild(a);
    });
    interieur.appendChild(liens);

    var pageCourante = PAGES.filter(function (p) { return p.fichier === fichierCourant; })[0];
    var maj = document.createElement("div");
    maj.className = "hdnav-maj";

    var majTexte = document.createElement("div");
    majTexte.className = "hdnav-maj-texte";

    var boutonActu = document.createElement("button");
    boutonActu.className = "hdnav-actu";
    boutonActu.type = "button";
    boutonActu.setAttribute("aria-label", "Actualiser les données");
    boutonActu.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';

    maj.appendChild(majTexte);
    maj.appendChild(boutonActu);

    boutonActu.addEventListener("click", function () {
        boutonActu.disabled = true;
        var url = new URL(location.href);
        url.searchParams.set("maj", Date.now());
        location.href = url.toString();
    });

    function formuler(dateFichier) {
        var minutes = Math.max(0, Math.round((Date.now() - dateFichier.getTime()) / 60000));
        var quand = minutes < 1 ? "à l'instant" : minutes < 60 ? minutes + " min" : Math.floor(minutes / 60) + " h";
        majTexte.innerHTML = '<span class="hdnav-maj-prefixe">MAJ </span><b>' + quand + "</b>";
        majTexte.classList.toggle("hdnav-vieux", minutes >= 15);
        maj.title = "Dernière publication : " + dateFichier.toLocaleString("fr-FR");
    }

    if (pageCourante && pageCourante.donnees) {
        fetch(pageCourante.donnees, { method: "HEAD", cache: "no-store" })
            .then(function (r) {
                var lm = r.headers.get("Last-Modified");
                if (!lm) throw new Error();
                var d = new Date(lm);
                if (isNaN(d.getTime())) throw new Error();
                formuler(d);
                setInterval(function () { formuler(d); }, 30000);
            })
            .catch(function () {
                majTexte.innerHTML = '<span class="hdnav-maj-prefixe">MAJ </span><b>?</b>';
            });
    }

    interieur.appendChild(maj);
    interieur.appendChild(bouton);
    nav.appendChild(interieur);
    document.body.insertBefore(nav, document.body.firstChild);

    /* Toggle Menu Mobile */
    bouton.addEventListener("click", function () {
        var ouvert = liens.classList.toggle("hdnav-ouvert");
        bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
        // Animation simple de l'icône hamburger -> croix
        if (ouvert) {
            bouton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M6 18L18 6M6 6l12 12"/></svg>';
            nav.style.background = "rgba(18, 18, 22, 0.98)";
        } else {
            bouton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
            nav.style.background = "";
        }
    });

    /* Ajustement de la page pour ne pas être couverte par la barre fixe */
    /* (Le menu mobile n'étant plus en block mais en absolute/overlay, on n'a plus besoin du ResizeObserver) */
    var paddingInitial = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
    function decaler() {
        // On calcule la hauteur de base (sans le menu mobile déroulé)
        var hauteurNav = interieur.offsetHeight;
        document.body.style.paddingTop = (paddingInitial + hauteurNav) + "px";
    }
    // Petit timeout pour s'assurer que le rendu initial est passé
    setTimeout(decaler, 50);
    window.addEventListener("resize", decaler);
})();
