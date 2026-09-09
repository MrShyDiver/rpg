/* ==========================================================================
   NAVIGATION COMMUNE — une seule ligne à ajouter dans chaque page :
       <script src="nav.js" defer></script>
   (à placer juste avant </body>)

   Le script s'injecte tout seul : il crée la barre, repère la page courante,
   et décale le contenu pour ne rien recouvrir. Aucune modification du HTML
   ou du CSS existant de tes pages n'est nécessaire.

   Tout est préfixé "hdnav-" pour ne jamais entrer en conflit avec les classes
   déjà utilisées (.page, .entete, .wrap, .hero...).
   ========================================================================== */
(function () {
    "use strict";

    // --- Pages du menu -----------------------------------------------------
    // Pour ajouter/retirer une entrée, il suffit de modifier cette liste.
    // "profil: true" = la page a besoin d'un ?user=pseudo pour s'afficher.
    var PAGES = [
        { fichier: "home.html",          label: "Accueil" },
        { fichier: "annonce-saison.html", label: "Le concept" },
        { fichier: "stats.html",          label: "Profil",     profil: true },
        { fichier: "inventaire.html",     label: "Inventaire", profil: true },
        { fichier: "ranking.html",        label: "Classements" },
        { fichier: "codex.html",          label: "Codex" }

    ];

    // --- Page courante -----------------------------------------------------
    var fichierCourant = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (fichierCourant === "") fichierCourant = "index.html";

    // Le pseudo consulté est transporté d'une page à l'autre : si tu regardes
    // le profil de quelqu'un et que tu cliques sur "Inventaire", tu restes sur
    // la même personne au lieu de retomber sur une page vide.
    var userCourant = new URLSearchParams(location.search).get("user");

    function lienDe(page) {
        if (!page.profil) return page.fichier;
        if (userCourant) return page.fichier + "?user=" + encodeURIComponent(userCourant);
        // Sans pseudo, ces pages n'ont rien à montrer : on renvoie vers la
        // recherche de l'accueil plutôt que vers un écran vide.
        return "index.html#recherche";
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

        ".hdnav-interieur{max-width:1040px;margin:0 auto;padding:0 18px;display:flex;align-items:center;gap:18px;min-height:52px;}",

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
        /* La page courante est signalée par le même jaune que les titres.   */
        ".hdnav-liens a[aria-current=page]{color:var(--hdnav-jaune);border-bottom-color:var(--hdnav-jaune);}",
        ".hdnav a:focus-visible{outline:2px solid var(--hdnav-jaune);outline-offset:2px;border-radius:2px;}",

        /* Bouton mobile */
        ".hdnav-bouton{display:none;margin-left:auto;background:none;border:1px solid var(--hdnav-bord);",
        "color:var(--hdnav-texte);font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:.06em;",
        "text-transform:uppercase;padding:7px 12px;border-radius:6px;cursor:pointer;}",
        ".hdnav-bouton:hover{border-color:var(--hdnav-jaune);color:var(--hdnav-jaune);}",

        "@media (max-width:760px){",
        ".hdnav-bouton{display:block;}",
        ".hdnav-liens{display:none;width:100%;margin:0;flex-direction:column;align-items:stretch;gap:0;",
        "padding-bottom:8px;border-top:1px solid var(--hdnav-bord);}",
        ".hdnav-liens.hdnav-ouvert{display:flex;}",
        ".hdnav-liens a{padding:11px 4px;border-bottom:1px solid var(--hdnav-bord);border-left:2px solid transparent;}",
        ".hdnav-liens a[aria-current=page]{border-left-color:var(--hdnav-jaune);border-bottom-color:var(--hdnav-bord);}",
        ".hdnav-interieur{flex-wrap:wrap;padding-top:6px;padding-bottom:0;}",
        "}",

        "@media (prefers-reduced-motion:reduce){.hdnav-liens a{transition:none;}}"
    ].join("");
    document.head.appendChild(css);

    // --- Construction ------------------------------------------------------
    var nav = document.createElement("nav");
    nav.className = "hdnav";
    nav.setAttribute("aria-label", "Navigation principale");

    var interieur = document.createElement("div");
    interieur.className = "hdnav-interieur";

    var marque = document.createElement("a");
    marque.className = "hdnav-marque";
    marque.href = "index.html";
    marque.innerHTML = '<i></i><b>Twitch RPG</b>';
    interieur.appendChild(marque);

    var bouton = document.createElement("button");
    bouton.className = "hdnav-bouton";
    bouton.type = "button";
    bouton.textContent = "Menu";
    bouton.setAttribute("aria-expanded", "false");
    interieur.appendChild(bouton);

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
