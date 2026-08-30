/* ------------------------------------------------------------------
   Star Wars: Edge of the Empire — GM flash card content.

   This file is plain data. Everything the app quizzes you on lives
   here, so it is safe (and expected) to edit, correct and extend.

   Markup available in any string:
     **bold**
     [[success]] [[advantage]] [[triumph]] [[failure]] [[threat]] [[despair]]
     [[boost]] [[setback]] [[ability]] [[difficulty]] [[proficiency]]
     [[challenge]] [[force]]
------------------------------------------------------------------ */

const EOTE = {};

/* ── Characteristics ─────────────────────────────────────────────── */

EOTE.characteristics = [
  'Brawn', 'Agility', 'Intellect', 'Cunning', 'Willpower', 'Presence'
];

/* ── Skills ──────────────────────────────────────────────────────── */

EOTE.skills = [
  // General
  ['Astrogation',          'Intellect', 'General',   'Plotting hyperspace routes, reading nav charts, calculating jumps.'],
  ['Athletics',            'Brawn',     'General',   'Running, climbing, swimming, jumping — raw physical exertion.'],
  ['Charm',                'Presence',  'General',   'Winning people over with warmth, likability and friendly persuasion.'],
  ['Coercion',             'Willpower', 'General',   'Threats, intimidation and interrogation — persuasion through fear.'],
  ['Computers',            'Intellect', 'General',   'Slicing, programming, searching databases, operating computer systems.'],
  ['Cool',                 'Presence',  'General',   'Staying composed in a tense but expected situation; gambling; Initiative when ready.'],
  ['Coordination',         'Agility',   'General',   'Balance, tumbling, contortion, escaping bonds, falling gracefully.'],
  ['Deception',            'Cunning',   'General',   'Lying, bluffing, disguises, misdirection and sleight of tongue.'],
  ['Discipline',           'Willpower', 'General',   'Mental fortitude — resisting fear, coercion and mental attacks.'],
  ['Leadership',           'Presence',  'General',   'Giving orders, rallying allies, commanding minions and crowds.'],
  ['Mechanics',            'Intellect', 'General',   'Repairing, modifying and building vehicles, droids, weapons and gear.'],
  ['Medicine',             'Intellect', 'General',   'Treating wounds and critical injuries, surgery, poisons and diagnosis.'],
  ['Negotiation',          'Presence',  'General',   'Haggling, brokering deals, diplomacy where both sides want something.'],
  ['Perception',           'Cunning',   'General',   'Actively looking, listening and searching for what is not obvious.'],
  ['Piloting (Planetary)', 'Agility',   'General',   'Landspeeders, airspeeders, swoops, walkers — anything in atmosphere.'],
  ['Piloting (Space)',     'Agility',   'General',   'Starfighters and starships in space, including dogfighting and docking.'],
  ['Resilience',           'Brawn',     'General',   'Enduring hardship — hunger, heat, poison, sleeplessness, forced marches.'],
  ['Skulduggery',          'Cunning',   'General',   'Locks, pickpocketing, traps, security devices, casing a target.'],
  ['Stealth',              'Agility',   'General',   'Moving unseen and unheard, hiding, tailing someone.'],
  ['Streetwise',           'Cunning',   'General',   'Navigating the criminal underworld: fences, rumours, contraband, safe houses.'],
  ['Survival',             'Cunning',   'General',   'Wilderness travel, tracking, foraging, handling animals, reading weather.'],
  ['Vigilance',            'Willpower', 'General',   'Reactive awareness — noticing danger unprompted; Initiative when caught out.'],
  // Combat
  ['Brawl',                'Brawn',     'Combat',    'Unarmed strikes and simple hand-held weapons like knuckledusters.'],
  ['Gunnery',              'Agility',   'Combat',    'Vehicle-mounted weapons, turrets, heavy repeating blasters, ordnance.'],
  ['Melee',                'Brawn',     'Combat',    'Hand-to-hand weapons: vibroblades, staves, clubs, swords.'],
  ['Ranged (Light)',       'Agility',   'Combat',    'One-handed ranged weapons: blaster pistols, hold-outs, bowcasters.'],
  ['Ranged (Heavy)',       'Agility',   'Combat',    'Two-handed ranged weapons: blaster rifles, carbines, bowcasters.'],
  ['Lightsaber',           'Brawn',     'Combat',    'Lightsabers and similar energy blades. (Force and Destiny line; may appear in mixed campaigns.)'],
  // Knowledge
  ['Knowledge (Core Worlds)', 'Intellect', 'Knowledge', 'The Core and Colonies: high society, politics, corporations, Coruscant.'],
  ['Knowledge (Education)',   'Intellect', 'Knowledge', 'Formal academia: science, mathematics, history, law, engineering theory.'],
  ['Knowledge (Lore)',        'Intellect', 'Knowledge', 'Myth, legend, ancient history, the Jedi, the Sith and the Force.'],
  ['Knowledge (Outer Rim)',   'Intellect', 'Knowledge', 'The Rim and Wild Space: frontier worlds, local customs, hyperlanes, hazards.'],
  ['Knowledge (Underworld)',  'Intellect', 'Knowledge', 'Crime syndicates, Hutt politics, black markets, bounty hunter culture.'],
  ['Knowledge (Xenology)',    'Intellect', 'Knowledge', 'Alien species, cultures, biology and non-sentient creatures.']
];

/* ── "Which skill do I call for?" adjudication scenarios ─────────── */

EOTE.calls = [
  ['A PC talks a nervous guard around by being warm and likeable.',            'Charm',              'Opposed by the target\'s Cool (or Discipline).'],
  ['A PC leans on an informant with threats of violence.',                     'Coercion',           'Opposed by the target\'s Discipline. Deals strain on a success.'],
  ['A PC haggles over the price of a shipment.',                               'Negotiation',        'Opposed by the other party\'s Negotiation or Cool.'],
  ['A PC claims to be an Imperial inspection officer.',                        'Deception',          'Opposed by the target\'s Discipline (or Vigilance if they are not engaged in the conversation).'],
  ['A PC rallies a frightened crowd of colonists to hold the line.',           'Leadership',         'Opposed by Discipline if the targets resist.'],
  ['A PC searches a cabin for a hidden smuggling compartment.',                'Perception',         'Active looking. If they might notice it without searching, call Vigilance instead.'],
  ['Someone is tailing the party and the GM wants to know if anyone notices.', 'Vigilance',          'Vigilance is reactive awareness; Perception is deliberate searching.'],
  ['A PC picks the lock on a durasteel cargo container.',                      'Skulduggery',        'Mechanical locks, traps, pockets and physical security.'],
  ['A PC slices a garrison\'s security network to open the blast doors.',      'Computers',          'Electronic systems, programming, data searches.'],
  ['A PC patches a blown power coupling on the ship\'s hyperdrive.',           'Mechanics',          'Repairs, modifications, sabotage of gear and vehicles.'],
  ['A PC digs a blaster bolt out of a friend and stops the bleeding.',         'Medicine',           'Healing wounds and Critical Injuries; the difficulty scales with the severity.'],
  ['A PC calculates a jump through an uncharted stretch of the Rim.',          'Astrogation',        'Time and difficulty scale with how bad the data is.'],
  ['A PC shakes two TIEs off the freighter\'s tail in open space.',            'Piloting (Space)',   'Atmosphere or ground vehicles would be Piloting (Planetary).'],
  ['A PC races a swoop through a canyon.',                                     'Piloting (Planetary)', 'Anything that flies in atmosphere or drives on a surface.'],
  ['A PC mans the freighter\'s dorsal quad laser.',                            'Gunnery',            'All vehicle-mounted weapons and heavy ordnance.'],
  ['A PC creeps past a patrol of stormtroopers.',                              'Stealth',            'Opposed by the guards\' Perception or Vigilance.'],
  ['A PC slips a set of binders and drops from a catwalk without breaking a leg.', 'Coordination',   'Balance, tumbling, contortion, controlled falls.'],
  ['A PC sprints across a collapsing bridge and leaps the gap.',               'Athletics',          'Raw exertion: run, climb, swim, jump, lift.'],
  ['A PC marches for two days across a desert without water.',                 'Resilience',         'Enduring privation, poison, extreme environments.'],
  ['A rancor roars and the PC has to hold their nerve.',                       'Discipline',         'Fear checks are Discipline or Cool depending on the situation.'],
  ['A PC asks around the docks for someone who can move stolen goods.',        'Streetwise',         'Streetwise finds the people; Knowledge (Underworld) recalls the facts.'],
  ['A PC tracks a wounded beast through jungle for a day.',                    'Survival',           'Tracking, foraging, shelter, animal handling.'],
  ['A PC tries to recall what a Gand\'s breathing apparatus means socially.',  'Knowledge (Xenology)', 'Species, cultures, biology, creatures.'],
  ['A PC recalls which noble house controls a Core trade lane.',               'Knowledge (Core Worlds)', 'Core and Colonies politics, high society, megacorporations.'],
  ['A PC recalls the safe approach vector to a lawless Rim moon.',             'Knowledge (Outer Rim)', 'Frontier worlds, hyperlanes, local customs and hazards.'],
  ['A PC recognises a pre-Republic script on a temple wall.',                  'Knowledge (Lore)',   'Myth, legend, ancient history, the Force, the Jedi and the Sith.'],
  ['A PC works out the yield of an unfamiliar reactor design.',               'Knowledge (Education)', 'Formal science, history, law, mathematics.'],
  ['Blaster fire erupts and the party was ready for it.',                      'Cool',               'Initiative is Cool when you are prepared, Vigilance when you are caught by surprise.'],
  ['The party is ambushed with no warning — roll Initiative.',                 'Vigilance',           'Vigilance covers being caught off guard.']
];

/* ── Narrative dice ──────────────────────────────────────────────── */

EOTE.dice = [
  {
    name: 'Boost die', short: 'Boost', color: 'Light blue', sides: 6, side: 'Positive',
    symbols: '[[success]] and [[advantage]]',
    source: 'Situational advantages: aiming, good gear, an ally assisting, favourable circumstances.',
    faces: 'Blank, blank, [[success]], [[success]] [[advantage]], [[advantage]] [[advantage]], [[advantage]]'
  },
  {
    name: 'Setback die', short: 'Setback', color: 'Black', sides: 6, side: 'Negative',
    symbols: '[[failure]] and [[threat]]',
    source: 'Minor obstacles: poor light, cover, difficult footing, an unhelpful crowd.',
    faces: 'Blank, blank, [[failure]], [[failure]], [[threat]], [[threat]]'
  },
  {
    name: 'Ability die', short: 'Ability', color: 'Green', sides: 8, side: 'Positive',
    symbols: '[[success]] and [[advantage]]',
    source: 'The character\'s raw capability — one per rank in the governing characteristic.',
    faces: 'Blank, [[success]], [[success]], [[success]] [[success]], [[advantage]], [[advantage]], [[success]] [[advantage]], [[advantage]] [[advantage]]'
  },
  {
    name: 'Difficulty die', short: 'Difficulty', color: 'Purple', sides: 8, side: 'Negative',
    symbols: '[[failure]] and [[threat]]',
    source: 'The inherent difficulty of the task — one per step on the difficulty ladder.',
    faces: 'Blank, [[failure]], [[failure]] [[failure]], [[threat]], [[threat]], [[threat]], [[threat]] [[threat]], [[failure]] [[threat]]'
  },
  {
    name: 'Proficiency die', short: 'Proficiency', color: 'Yellow', sides: 12, side: 'Positive',
    symbols: '[[success]], [[advantage]] and [[triumph]]',
    source: 'Training. Upgraded from an Ability die, one upgrade per rank in the skill.',
    faces: 'Blank, [[success]], [[success]], [[success]] [[success]], [[success]] [[success]], [[advantage]], [[success]] [[advantage]], [[success]] [[advantage]], [[success]] [[advantage]], [[advantage]] [[advantage]], [[advantage]] [[advantage]], [[triumph]]'
  },
  {
    name: 'Challenge die', short: 'Challenge', color: 'Red', sides: 12, side: 'Negative',
    symbols: '[[failure]], [[threat]] and [[despair]]',
    source: 'Serious opposition. Upgraded from a Difficulty die by a skilled opponent, a talent or a Destiny Point.',
    faces: 'Blank, [[failure]], [[failure]], [[failure]] [[failure]], [[failure]] [[failure]], [[threat]], [[threat]], [[failure]] [[threat]], [[failure]] [[threat]], [[threat]] [[threat]], [[threat]] [[threat]], [[despair]]'
  },
  {
    name: 'Force die', short: 'Force', color: 'White', sides: 12, side: 'Neither',
    symbols: 'Light side and dark side Force pips',
    source: 'Force powers, and the Destiny Pool roll at the start of each session.',
    faces: 'Six faces with one dark pip, one face with two dark pips, two faces with one light pip, three faces with two light pips — eight pips of each side in total.'
  }
];

/* ── Weapon qualities ────────────────────────────────────────────── */
/* [name, activation, effect] */

EOTE.qualities = [
  ['Accurate X',    'Passive',                 'Add X [[boost]] to the combat check made with this weapon.'],
  ['Auto-fire',     'Active (2 [[advantage]])','Increases the difficulty of the attack by one when used. Spend 2 [[advantage]] per additional hit, which may be assigned to the original target or others engaged with it.'],
  ['Blast X',       'Active (X [[advantage]])','On a hit, spend [[advantage]] equal to X to also deal X damage to everyone engaged with the target. On a miss, 3 [[advantage]] deals the Blast damage to the target and everyone engaged with it.'],
  ['Breach X',      'Passive',                 'Ignores 10 points of soak or armour per rank of X, and lets a personal-scale weapon damage planetary-scale targets.'],
  ['Burn X',        'Active (1 [[advantage]])','The target catches fire and suffers the weapon\'s base damage again at the start of each of its turns for X rounds.'],
  ['Concussive X',  'Active (2 [[advantage]])','The target is staggered for X rounds — it cannot take actions.'],
  ['Cortosis',      'Passive',                 'The item cannot be destroyed by Sunder. Cortosis armour also makes the wearer immune to Critical Injuries.'],
  ['Cumbersome X',  'Passive',                 'A wielder with Brawn lower than X adds [[setback]] equal to the difference to checks with the weapon.'],
  ['Defensive X',   'Passive',                 'Grants the wielder melee defence equal to X.'],
  ['Deflection X',  'Passive',                 'Grants the wielder ranged defence equal to X.'],
  ['Disorient X',   'Active (1 [[advantage]])','The target is disoriented for X rounds, adding [[setback]] to all of its checks.'],
  ['Ensnare X',     'Active (2 [[advantage]])','The target is immobilised for X rounds; it may attempt an Average Athletics or Coordination check to break free.'],
  ['Guided X',      'Active (3 [[advantage]])','A missed shot may attack the target again on the following round as an out-of-turn incidental, using X [[boost]] instead of the normal pool.'],
  ['Inaccurate X',  'Passive',                 'Add X [[setback]] to the combat check made with this weapon.'],
  ['Ion',           'Passive',                 'Damages droids and vehicles as system strain / strain rather than wounds or hull trauma.'],
  ['Knockdown',     'Active (2 [[advantage]])','The target is knocked prone. Costs one additional [[advantage]] per silhouette above 1.'],
  ['Limited Ammo X','Passive',                 'The weapon may be fired X times before it needs a Manage Gear manoeuvre to reload.'],
  ['Linked X',      'Active (2 [[advantage]])','Spend 2 [[advantage]] per additional hit, up to X, all against the original target.'],
  ['Pierce X',      'Passive',                 'Ignores X points of the target\'s soak.'],
  ['Prepare X',     'Passive',                 'The weapon requires X manoeuvres to ready before it can be fired.'],
  ['Slow-Firing X', 'Passive',                 'The weapon cannot be fired again for X rounds after being fired.'],
  ['Stun X',        'Active (2 [[advantage]])','Deals X strain to the target, ignoring soak.'],
  ['Stun Damage',   'Passive',                 'The weapon deals its damage as strain instead of wounds (soak still applies).'],
  ['Sunder',        'Active (1 [[advantage]])','Damage one item the target is carrying by one step; each additional [[advantage]] damages it a further step.'],
  ['Superior',      'Passive',                 'The weapon adds an automatic [[advantage]] to the result of the check.'],
  ['Tractor X',     'Passive',                 'A vehicle caught in the beam must make a Piloting check against difficulty X to escape.'],
  ['Unwieldy X',    'Passive',                 'A wielder with Agility lower than X adds [[setback]] equal to the difference to checks with the weapon.'],
  ['Vicious X',     'Passive',                 'Add +10 per rank of X to any Critical Injury result inflicted by this weapon.']
];

/* ── Talents ─────────────────────────────────────────────────────── */
/* [name, tier, activation, ranked, effect] */

EOTE.talents = [
  ['Grit',                1, 'Passive',                 true,  'Gain +1 strain threshold per rank.'],
  ['Toughened',           2, 'Passive',                 true,  'Gain +2 wound threshold per rank.'],
  ['Dedication',          5, 'Passive',                 true,  'Gain +1 to a single characteristic per rank. This cannot bring a characteristic above 6.'],
  ['Quick Draw',          1, 'Incidental',              false, 'Once per round, draw or holster an easily accessible weapon or item as an incidental instead of a manoeuvre.'],
  ['Quick Strike',        1, 'Passive',                 true,  'Add [[boost]] per rank to combat checks against any target that has not yet acted in the encounter.'],
  ['Point Blank',         1, 'Passive',                 true,  'Add 1 damage per rank to Ranged (Light) and Ranged (Heavy) attacks made at engaged or short range.'],
  ['Jump Up',             1, 'Incidental',              false, 'Stand up from prone or a seated position as an incidental instead of a manoeuvre.'],
  ['Brace',               1, 'Manoeuvre',               true,  'Remove [[setback]] per rank imposed on the next check by environmental conditions.'],
  ['Convincing Demeanour',1, 'Passive',                 true,  'Remove [[setback]] per rank from all Deception and Skulduggery checks.'],
  ['Kill with Kindness',  1, 'Passive',                 true,  'Remove [[setback]] per rank from all Charm and Leadership checks.'],
  ['Street Smarts',       1, 'Passive',                 true,  'Remove [[setback]] per rank from all Streetwise and Knowledge (Underworld) checks.'],
  ['Galaxy Mapper',       1, 'Passive',                 true,  'Remove [[setback]] per rank from all Astrogation checks.'],
  ['Skilled Jockey',      1, 'Passive',                 true,  'Remove [[setback]] per rank from all Piloting (Planetary) and Piloting (Space) checks.'],
  ['Solid Repairs',       1, 'Passive',                 true,  'Repair +1 hull trauma per rank when a vehicle or ship is repaired.'],
  ['Let\'s Ride',         1, 'Incidental',              false, 'Mount or dismount a vehicle or beast, or enter a cockpit or gun position, as an incidental.'],
  ['Rapid Reaction',      2, 'Out-of-turn incidental',  true,  'Suffer strain to add an equal number of [[success]] to an Initiative check, up to your ranks in Rapid Reaction.'],
  ['Dodge',               2, 'Out-of-turn incidental',  true,  'When targeted by a combat check, suffer strain up to your ranks to upgrade the difficulty of that check the same number of times.'],
  ['Side Step',           2, 'Manoeuvre',               true,  'Suffer strain (no more than your ranks) to upgrade the difficulty of all incoming ranged attacks by that number until the end of your next turn.'],
  ['Defensive Stance',    2, 'Manoeuvre',               true,  'Suffer strain (no more than your ranks) to upgrade the difficulty of all incoming melee attacks by that number until the end of your next turn.'],
  ['Second Wind',         2, 'Incidental',              true,  'Once per encounter, recover strain equal to your ranks in Second Wind.'],
  ['Durable',             2, 'Passive',                 true,  'Reduce any Critical Injury result inflicted on you by 10 per rank.'],
  ['Lethal Blows',        3, 'Passive',                 true,  'Add +10 per rank to any Critical Injury result you inflict.'],
  ['True Aim',            3, 'Manoeuvre',               true,  'Perform before an attack: it counts as aiming and upgrades the ability of the combat check once per rank.'],
  ['Nobody\'s Fool',      3, 'Passive',                 true,  'Upgrade the difficulty of incoming Charm, Coercion and Deception checks once per rank.'],
  ['Natural [Skill]',     3, 'Incidental',              false, 'Once per session, reroll any one check using the named skill (e.g. Natural Marksman, Natural Negotiator).'],
  ['Adversary X',         0, 'Passive',                 true,  'NPC-only. Upgrade the difficulty of any combat check targeting this character once per rank.']
];

/* ── Rules cards ─────────────────────────────────────────────────── */
/* {t: topic, q: front, a: back, n: optional footnote} */

EOTE.rules = [

  /* ---- Dice, pools and symbols ---- */
  { t: 'dice', q: 'How do you build a dice pool from a characteristic and a skill?',
    a: 'Roll [[ability]] equal to the **higher** of the characteristic and the skill ranks, then **upgrade** a number of them to [[proficiency]] equal to the **lower** of the two.',
    n: 'Agility 3 / Stealth 1 gives two green and one yellow. Agility 2 / Stealth 3 gives one green and two yellow.' },
  { t: 'dice', q: 'The character has no ranks in the skill at all — what do you roll?',
    a: 'Roll [[ability]] equal to the characteristic with no upgrades. Zero ranks means zero [[proficiency]].' },
  { t: 'dice', q: 'What are the six steps of the difficulty ladder?',
    a: 'Simple (no [[difficulty]]), Easy (1), Average (2), Hard (3), Daunting (4), Formidable (5).',
    n: 'Most checks in play sit at Easy, Average or Hard. Reach for Daunting and above sparingly.' },
  { t: 'dice', q: 'What is the difference between **adding** a die and **upgrading** a die?',
    a: '**Adding** puts a new die of that type into the pool. **Upgrading** converts one die into its stronger version — [[ability]] becomes [[proficiency]], [[difficulty]] becomes [[challenge]]. If there is nothing to upgrade, add the weaker die first, then upgrade it.' },
  { t: 'dice', q: 'Which symbols cancel which?',
    a: '[[success]] cancels [[failure]] one for one. [[advantage]] cancels [[threat]] one for one. The two pairs resolve **independently**.',
    n: 'So you can fail a check and still net [[advantage]], or succeed while generating [[threat]]. That is where the good scenes live.' },
  { t: 'dice', q: 'What does a [[triumph]] do, and can it be cancelled?',
    a: 'A [[triumph]] counts as one [[success]] **and** grants a spectacular narrative effect or a powerful mechanical option. The [[success]] part can be cancelled by [[failure]]; the [[triumph]] effect itself is never cancelled.' },
  { t: 'dice', q: 'What does a [[despair]] do, and does a [[triumph]] cancel it?',
    a: 'A [[despair]] counts as one [[failure]] **and** causes a serious complication or reversal. [[triumph]] and [[despair]] do **not** cancel each other — you can absolutely get both on the same roll.' },
  { t: 'dice', q: 'How many net [[success]] do you need to pass a check, and what do extras do?',
    a: 'One net [[success]] passes; the number of extras only measures **magnitude**. In combat each extra [[success]] adds +1 damage to the hit.' },
  { t: 'dice', q: 'The pool comes up completely blank on both sides. What happened?',
    a: 'No net [[success]] means the check fails — but with no [[advantage]] or [[threat]] there are no side effects either. Nothing changes; describe a flat, frustrating attempt and move on.' },
  { t: 'dice', q: 'Where do [[boost]] and [[setback]] dice come from?',
    a: 'Situational modifiers: aiming, assistance, good gear, cover, poor light, difficult footing, a distracting crowd. They are the GM\'s fine adjustment — add or remove them freely instead of nudging the difficulty.' },

  /* ---- Making checks ---- */
  { t: 'core', q: 'How do you set the difficulty of an **opposed** check?',
    a: 'Use the opponent\'s relevant characteristic as the number of [[difficulty]], then **upgrade** that pool once per rank the opponent has in the opposing skill.',
    n: 'Sneaking past a guard with Cunning 3 and Perception 2 gives three purple, two of them upgraded to red.' },
  { t: 'core', q: 'What is a **competitive** check?',
    a: 'Both parties roll their own pool against the same difficulty; whoever scores more net [[success]] wins. Ties are broken by net [[advantage]].',
    n: 'Use it for races and contests where both sides are actively performing, rather than one acting against the other.' },
  { t: 'core', q: 'What does an ally **assisting** a check provide?',
    a: 'Add one [[boost]] to the check for meaningful help. Only characters who can plausibly contribute may assist, and the GM should cap how many pile on.' },
  { t: 'core', q: 'When should you **not** call for a check?',
    a: 'When failure is not interesting, when there is no meaningful opposition, or when the character would simply succeed given time and no pressure. A check needs a real cost attached to failure.' },
  { t: 'core', q: 'What is the difference between **structured** and **narrative** time?',
    a: '**Structured** time is initiative order with turns, actions and manoeuvres — used for combat and other tense sequences. **Narrative** time is free-flowing; characters act as the fiction demands with no turn economy.' },

  /* ---- Turn economy ---- */
  { t: 'core', q: 'What may a character do on their turn in structured time?',
    a: 'One **action** and one **manoeuvre**, plus any number of reasonable **incidentals**.' },
  { t: 'core', q: 'How do you get a second manoeuvre, and what is the hard cap?',
    a: 'Either suffer **2 strain**, or give up your **action** for it. Either way, never more than **two manoeuvres** in a single turn.' },
  { t: 'core', q: 'Give examples of manoeuvres.',
    a: 'Aim, Move (one range band), Manage Gear (draw, holster, reload, mount), Guarded Stance, Preparation, Assist, Interact with the environment (open a door, take cover), Mount or dismount a vehicle.' },
  { t: 'core', q: 'What is an **incidental**?',
    a: 'A free, effectively costless action: speaking a line or two, dropping an item, glancing at a display, releasing a weapon. Free, but the GM caps how many are reasonable in one turn.' },
  { t: 'core', q: 'How does the **Aim** manoeuvre work?',
    a: 'One Aim manoeuvre adds one [[boost]] to the combat check; spending both manoeuvres aiming adds two [[boost]]. Aiming may instead be used to make a called shot at a specific location or item, which increases the difficulty of the attack by two.' },
  { t: 'core', q: 'Which skill do you roll for Initiative?',
    a: '**Cool** if the character is ready and aware that trouble is coming; **Vigilance** if they are surprised, distracted or ambushed.' },
  { t: 'core', q: 'How does the Initiative order actually work once everyone has rolled?',
    a: 'Rank all results by net [[success]] ([[advantage]] breaks ties) to produce a list of **slots**, each marked PC or NPC. On each PC slot the players choose which character takes it — the order can change round to round.',
    n: 'One of the most commonly forgotten rules at the table: slots belong to the side, not the individual.' },

  /* ---- Range and movement ---- */
  { t: 'core', q: 'Name the five personal-scale range bands.',
    a: 'Engaged, Short, Medium, Long, Extreme.' },
  { t: 'core', q: 'How much movement does one manoeuvre buy?',
    a: 'One range band — including closing from short to engaged, or disengaging from engaged to short. Moving between **long and extreme** range takes two manoeuvres.' },
  { t: 'core', q: 'What difficulty are ranged attacks at each band?',
    a: 'Short — Easy (1 [[difficulty]]). Medium — Average (2). Long — Hard (3). Extreme — Daunting (4). Engaged — Average (2), since it is awkward to bring a gun to bear in a scrum.' },
  { t: 'core', q: 'What difficulty are Brawl, Melee and Lightsaber attacks?',
    a: 'Average (2 [[difficulty]]), always, regardless of range — they can only be made while engaged.' },

  /* ---- Damage, soak, thresholds ---- */
  { t: 'combat', q: 'How is damage from a hit calculated?',
    a: 'Weapon base damage + 1 per net [[success]], then subtract the target\'s **soak**. The remainder is dealt as wounds.' },
  { t: 'combat', q: 'What makes up **soak**, and what does it not stop?',
    a: 'Soak = Brawn + armour + talents and effects. It reduces the wounds from **each individual hit**, and never reduces strain a character suffers from exertion, talents or effects.' },
  { t: 'combat', q: 'What are wound and strain thresholds, and what happens when you exceed them?',
    a: 'Wound threshold = Brawn + species/career modifier; strain threshold = Willpower + modifier. Exceeding your **wound** threshold knocks you out **and** inflicts one Critical Injury. Exceeding your **strain** threshold knocks you out with no Critical Injury.',
    n: 'Being exactly at your threshold is still standing. It is only exceeding it that drops you.' },
  { t: 'combat', q: 'How is a Critical Injury triggered and rolled?',
    a: 'After a hit that deals damage past soak, spend [[advantage]] equal to the weapon\'s **Crit rating**. Roll d100 on the Critical Injury table, adding **+10 for every Critical Injury the target already has**.',
    n: 'Vicious X adds +10 per rank; Lethal Blows adds +10 per rank; Durable subtracts 10 per rank.' },
  { t: 'combat', q: 'What does **defence** do, and where does it come from?',
    a: 'Ranged and melee defence are separate ratings. Each adds that many [[setback]] to incoming attacks of that type. It comes from armour, cover, vehicle profiles and talents.' },
  { t: 'combat', q: 'What does taking **cover** give you?',
    a: 'Ranged defence 1 — one [[setback]] on incoming ranged attacks — plus whatever the fiction justifies. Taking cover is a manoeuvre.' },
  { t: 'combat', q: 'What are minions, rivals and nemeses?',
    a: '**Minions** act in groups, share one wound pool, have no strain threshold, and gain skill ranks from group size. **Rivals** are individuals with no strain threshold, incapacitated when wounds exceed their threshold. **Nemeses** work exactly like PCs — strain, Critical Injuries and all.' },
  { t: 'combat', q: 'How do minion groups get their skills?',
    a: 'A minion group has ranks in a group skill equal to the number of minions in the group **minus one**. Kill minions and the group gets measurably worse at everything.' },

  /* ---- Spending advantage and threat ---- */
  { t: 'combat', q: 'What can you buy for **1 [[advantage]]** in combat?',
    a: 'Recover 1 strain (one per [[advantage]] spent) · Add [[boost]] to the next allied character\'s check · Notice a single important detail in the fight · Inflict a Critical Injury, if the weapon\'s Crit rating is 1.' },
  { t: 'combat', q: 'What can you buy for **2 [[advantage]]** in combat?',
    a: 'Perform an immediate free manoeuvre (this may not break the two-manoeuvre cap) · Add [[setback]] to the next opponent\'s check · Add [[boost]] to any ally\'s next check, including the active character\'s.' },
  { t: 'combat', q: 'What can you buy for **3 [[advantage]]** in combat?',
    a: 'Negate the target\'s defensive bonuses until the end of your next turn · Ignore penalising environmental conditions until the end of your next turn · Force the target to drop a held item.' },
  { t: 'combat', q: 'What can a **[[triumph]]** buy in combat?',
    a: 'Anything [[advantage]] can buy, plus: upgrade the difficulty of the target\'s next check · upgrade an ally\'s next check · have the damage from this hit ignore soak entirely. Two [[triumph]] can destroy the target\'s weapon outright.' },
  { t: 'combat', q: 'What can the GM spend **[[threat]]** on?',
    a: 'The mirror of [[advantage]]: the active character suffers 1 strain per [[threat]] · loses the free manoeuvre they were counting on · drops or loses the use of an item · the next enemy check gains [[boost]] · the character falls prone or is knocked back.' },
  { t: 'combat', q: 'What does a **[[despair]]** typically cost the character?',
    a: 'A serious, lasting reversal: the weapon jams or is damaged a step, the character suffers a Critical Injury, reinforcements arrive, the cover collapses, the getaway ship is spotted. It should change the shape of the scene, not just cost a point.' },
  { t: 'combat', q: 'Is [[advantage]] on a **failed** check wasted?',
    a: 'No — and forgetting this is the single most common table mistake. Spend it normally: recover strain, hand an ally a [[boost]], notice a detail, take a free manoeuvre. You missed, but you learned something or got into position.' },

  /* ---- Gear ---- */
  { t: 'gear', q: 'What is a character\'s **encumbrance threshold**, and what happens when it is exceeded?',
    a: 'Threshold = Brawn + 5. For each point of encumbrance over the threshold, add one [[setback]] to all Brawn and Agility checks. Exceed the threshold by more than 5 and the character is immobilised.' },
  { t: 'gear', q: 'How do stimpacks work?',
    a: 'The first stimpack a character receives in a day heals 5 wounds; each subsequent one that day heals one fewer (5, 4, 3, 2, 1), and the sixth and beyond heal nothing. Administering one is an action.' },
  { t: 'gear', q: 'What are the numbers on a weapon\'s stat line?',
    a: '**Skill** used · **Damage** (base, before net [[success]]) · **Critical rating** (the [[advantage]] cost to trigger a Critical Injury) · **Range** band · **Encumbrance** · **Hard points** for modification · **Special qualities**.' },
  { t: 'gear', q: 'What does armour do?',
    a: 'Armour adds to **soak** (reducing wounds from every hit) and may add ranged and/or melee **defence** (adding [[setback]] to incoming attacks). It carries its own encumbrance and hard points.' },

  /* ---- Vehicles ---- */
  { t: 'vehicles', q: 'What are the vehicle equivalents of wounds and strain?',
    a: '**Hull trauma** stands in for wounds and **system strain** for strain. Exceeding hull trauma disables or destroys the ship; exceeding system strain leaves it adrift and unresponsive.' },
  { t: 'vehicles', q: 'What is **silhouette** and what is it used for?',
    a: 'A 0–10 measure of physical size used for targeting, scale, and capacity. A human is silhouette 1, a starfighter around 3, a light freighter like a YT-1300 around 4, and an Imperial Star Destroyer 8.' },
  { t: 'vehicles', q: 'How do personal and planetary **scale** interact?',
    a: 'A planetary-scale weapon that hits a personal-scale target deals its damage **×10**. A personal-scale weapon can only hurt a vehicle if it has the **Breach** or **Ion** quality.' },
  { t: 'vehicles', q: 'What does a vehicle\'s **handling** rating do?',
    a: 'Positive handling adds that many [[boost]] to Piloting checks with the vehicle; negative handling adds that many [[setback]]. It is the ship\'s personality expressed in dice.' },
  { t: 'vehicles', q: 'What are a vehicle\'s **defence zones**?',
    a: 'Fore, aft, port and starboard. Each zone has its own defence rating, so which side of the ship an attack comes from matters — and shifting shields to a threatened arc is worth making the crew do.' },

  /* ---- Obligation and Destiny ---- */
  { t: 'obligation', q: 'What is **Obligation** and what is it for?',
    a: 'Edge of the Empire\'s signature story mechanic. Every PC carries an Obligation — a debt, a bounty, a family duty — with a numeric value. It is the GM\'s built-in supply of plot hooks tied to the characters\' own histories.' },
  { t: 'obligation', q: 'What does the GM do with Obligation at the start of a session?',
    a: 'Roll d100 against the party\'s combined Obligation ranges. If the roll lands in a character\'s range, that Obligation drives this session — and the **whole party** reduces their strain threshold by 1 (by 2 if the roll was doubles).' },
  { t: 'obligation', q: 'Name several Obligation types.',
    a: 'Debt, Betrayal, Bounty, Blackmail, Criminal, Dutybound, Family, Favour, Oath, Obsession, Responsibility, Addiction.' },
  { t: 'obligation', q: 'How does Obligation change during play?',
    a: 'It goes **down** when characters pay debts, settle scores or resolve their entanglements; it goes **up** when they buy favours, take on new debts, or trade Obligation for credits, gear or extra XP.' },
  { t: 'obligation', q: 'How is the **Destiny Pool** created?',
    a: 'At the start of each session every player rolls one [[force]]. Each light pip becomes a **Light Side** Destiny Point, each dark pip a **Dark Side** point. The pool is public and sits in the middle of the table.' },
  { t: 'obligation', q: 'Who spends which Destiny Points, and what happens to a spent point?',
    a: 'Players spend **Light Side** points; the GM spends **Dark Side** points. A spent point **flips** to the other side and returns to the pool — every use hands ammunition to the other side of the table.' },
  { t: 'obligation', q: 'What can a Destiny Point be spent on?',
    a: 'Upgrade one ability die of a check to [[proficiency]], or upgrade the difficulty of an opponent\'s check to [[challenge]] (once per check) · introduce a minor narrative fact ("of course this port has a spice dealer") · power certain talents and abilities.' },

  /* ---- Spending results, in general ---- */
  { t: 'spends', q: 'What do [[advantage]] and [[threat]] actually represent?',
    a: 'Side effects, resolved **separately from whether the check passed**. [[advantage]] is something good that is not "you succeed"; [[threat]] is a cost or complication that is not "you fail".',
    n: 'This is the engine of the whole system. If you only read success and failure, you are playing a worse game with prettier dice.' },
  { t: 'spends', q: 'Who decides what [[advantage]] and [[threat]] mean?',
    a: 'The **player** proposes what their [[advantage]] buys, with the GM signing off. The **GM** spends [[threat]] and [[despair]]. Let players pitch first — they invent better complications for themselves than you will.' },
  { t: 'spends', q: 'When do results have to be spent?',
    a: '**Immediately**, as the check resolves. They do not bank, carry to the next roll, or get saved for later. Unspent [[advantage]] is simply lost.',
    n: 'So never let the table stall on it. Have a default ready — recover a strain, hand an ally a [[boost]] — and move.' },
  { t: 'spends', q: 'What can spare [[advantage]] buy on a **non-combat** check?',
    a: 'Recover 1 strain per [[advantage]] · Add [[boost]] to the next allied character\'s check · Notice a useful detail about the task or surroundings · Take an immediate free manoeuvre in structured time · Reduce the time the task takes.',
    n: 'Two [[advantage]] is roughly "a real, concrete benefit". Three or more should visibly change the scene.' },
  { t: 'spends', q: 'What can [[threat]] cost on a **non-combat** check?',
    a: 'Suffer 1 strain per [[threat]] · Lose the benefit of a previously spent [[advantage]] · The task takes considerably longer · A tool, dose or piece of gear is used up or damaged · Somebody notices you doing it.' },
  { t: 'spends', q: 'The check **failed** but generated 3 [[advantage]]. What now?',
    a: 'Spend it normally. The attempt did not work, but something came of it: you learned where the real lock is, you are in a better position, an ally gets a [[boost]], you recover strain.',
    n: 'Failure with [[advantage]] is the most useful roll in the game — the plan dies but the scene moves forward.' },
  { t: 'spends', q: 'The check **succeeded** but generated 3 [[threat]]. What now?',
    a: 'They get what they wanted, and it costs them. The rule of thumb: [[threat]] **complicates, never negates**. If your complication amounts to "actually it did not work", you have written a failure instead.' },
  { t: 'spends', q: 'How should a [[triumph]] differ from just another [[success]]?',
    a: 'Extra [[success]] measures **magnitude** — more damage, a better result. [[triumph]] is a **narrative gift**: the thing you did not ask for. The guard turns out to owe you a favour; the door you sliced also unlocks the cell block.',
    n: 'Give the player the pitch. A [[triumph]] they invented is remembered; one you handed them is not.' },
  { t: 'spends', q: 'How should a [[despair]] differ from just another [[failure]]?',
    a: 'Extra [[failure]] means it went worse. [[despair]] means something **changes and stays changed** — gear breaks, a relationship turns, reinforcements arrive, the ship is now on a list. It should still be there two scenes later.' },
  { t: 'spends', q: 'A GM habit worth drilling: what do you do the moment the dice land?',
    a: 'Read them in this order: **net [[success]] or [[failure]]** — did it work? Then **net [[advantage]] or [[threat]]** — what else happened? Then **[[triumph]] or [[despair]]** — what changed for good? Narrate all three as one sentence, not three rulings.' },

  /* ---- Advancement ---- */
  { t: 'xp', q: 'What does it cost to buy a rank in a skill?',
    a: '5 × the **new** rank in XP for a career skill, and 5 more than that for a non-career skill.',
    n: 'Career rank 1 costs 5, rank 2 costs 10, rank 3 costs 15. Non-career: 10, 15, 20.' },
  { t: 'xp', q: 'What does a talent cost?',
    a: '5 × its **tier**: 5 XP at tier 1, 10 at tier 2, 15 at tier 3, 20 at tier 4, 25 at tier 5.' },
  { t: 'xp', q: 'What are the rules for moving down a talent tree?',
    a: 'A talent must connect by a line to a talent you already own in that tree, and you need at least **two** talents in the preceding tier before buying into the next one.' },
  { t: 'xp', q: 'What does an additional **specialisation** cost?',
    a: '10 × the total number of specialisations the character will then have. The second costs 20 XP, the third 30, the fourth 40.' },
  { t: 'xp', q: 'How do you raise a **characteristic** after character creation?',
    a: 'Normally you cannot. Characteristics are bought only at creation (10 × the new rating). After that, the **Dedication** talent at tier 5 is the way up.' },
  { t: 'xp', q: 'What can Obligation buy at character creation?',
    a: 'Taking on additional starting Obligation grants extra starting XP or extra starting credits. More rope now, more trouble later.' }
];

/* ── Spending results on a skill check ──────────────────────────────
   Per-skill prompts for the question that actually stalls a table:
   "it succeeded, but there are two Threat — now what?"

   These are SUGGESTED reads, written to give a GM somewhere to jump
   from. They are not a transcription of the core rulebook's own
   per-skill lists. Where your book gives specific results for a skill,
   trust it, and use Bulk add to load its wording in.

   [skill, what spare Advantage could buy, what Threat could cost]     */

EOTE.spends = [
  ['Stealth',
   'You learn the patrol pattern on the way past · You leave no trace, so the alarm comes late or never · You end up somewhere better than planned — at the console rather than across the room · A boost to the next character sneaking the same route.',
   'You get through but leave something behind: a print, a jammed door, a guard found early · The window is shorter than you thought · You are in, but cut off from the rest of the party.'],
  ['Perception',
   'You spot a second thing beyond what you were looking for — the maker\'s mark, the fresh scuff, the other person watching the room.',
   'You find it, but you took long enough to be noticed looking · You fixate on the wrong detail and miss what mattered.'],
  ['Vigilance',
   'You notice, and you know where it is coming from — a boost on Initiative or the first move.',
   'You notice too late to warn anyone · You flinch, and now they know that you know.'],
  ['Charm',
   'They also volunteer a rumour, knock something off the price, or will vouch for you later.',
   'They like you, but now they want something from you · They will remember your face · Someone who dislikes them saw you making friends.'],
  ['Deception',
   'They believe it and repeat it to someone else, spreading the lie for you.',
   'They buy it now but will check the story later · Someone else in the room knows better and says nothing yet.'],
  ['Coercion',
   'They talk, and they stay frightened enough not to warn anybody.',
   'They talk, and report you the moment you are gone · You go far enough that the rest of the room turns against you.'],
  ['Negotiation',
   'Better terms than asked: extra cargo, faster delivery, a contact thrown in.',
   'The deal closes with a string attached · Word gets around what you were willing to pay.'],
  ['Leadership',
   'They follow the order and keep their heads — a boost on their next check.',
   'They obey and resent it · One of them improvises and does rather more than you asked.'],
  ['Skulduggery',
   'It opens faster than expected · You spot the second lock, or the trap, before it matters.',
   'It opens, but the pick snaps or stays behind · The tampering is obvious to the next person through.'],
  ['Computers',
   'You get the data and cover your tracks · You pull a bonus file worth having.',
   'You are in, but you tripped a passive log · Something noticed and is now looking · You are on a clock you cannot see.'],
  ['Mechanics',
   'The repair also improves something — extra system strain recovered, or it holds better than it has any right to.',
   'It works, but it is a field patch that will fail at the worst moment · It cost a part you needed for something else.'],
  ['Medicine',
   'Extra wounds or strain healed · You read something off the injury: what weapon, how long ago, how skilled.',
   'They are up but hurting, with a lingering effect · You burned the last of the supplies doing it.'],
  ['Astrogation',
   'A shorter jump, less fuel burned, or a route nobody thinks to watch.',
   'The route works but passes an Imperial checkpoint · It takes noticeably longer than you told everyone.'],
  ['Piloting (Space)',
   'You lose them and come out of it in a better firing position · Recover system strain.',
   'You make it, but the ship is strained · You are now somewhere you did not want to be.'],
  ['Piloting (Planetary)',
   'You arrive early, or arrive unseen.',
   'You arrive, but the speeder is smoking · You were clocked on the way in.'],
  ['Gunnery',
   'Extra damage, a Critical Injury, or you knock out one specific system.',
   'The weapon overheats · Ammunition runs low · You hit something you would rather have left intact.'],
  ['Athletics',
   'You make it across and can help the next person over — a boost for them.',
   'You make it, but you drop something on the way · You arrive winded, and take strain for it.'],
  ['Resilience',
   'You endure and find something useful doing it: water, shelter, a landmark.',
   'You endure, but gear is ruined · You arrive too exhausted to be much use straight away.'],
  ['Streetwise',
   'Your contact is willing to make the introduction personally.',
   'You get the name, but you have now been asked about — somebody knows you are looking.'],
  ['Survival',
   'You track them and read the trail: how many, how fresh, heading where.',
   'You find the trail, and it is bait · Something larger has started following you.'],
  ['Cool',
   'You stay level and move first — a boost, or the better slot in the order.',
   'You hold it together, but everyone can see what it cost you.'],
  ['Discipline',
   'You shrug it off and steady somebody else while you are at it.',
   'You hold, but the strain lingers into the next scene.'],
  ['Knowledge (any)',
   'You recall one extra actionable detail: a name, a weakness, a debt somebody owes.',
   'You have one specific detail wrong · Knowing it means somebody else knows that you know.']
];

/* ── Topics ──────────────────────────────────────────────────────── */

EOTE.topics = [
  { id: 'skills',     label: 'Skills',               blurb: 'All 33 skills, their characteristics and what they cover.', color: '#34d399' },
  { id: 'calls',      label: 'Making the Call',      blurb: 'A situation lands on the table — which skill do you ask for?', color: '#38bdf8' },
  { id: 'dice',       label: 'Dice & Symbols',       blurb: 'The seven dice, their faces, and how symbols resolve.', color: '#eab308' },
  { id: 'core',       label: 'Checks & Turns',       blurb: 'Difficulty, opposed checks, turn economy, range bands.', color: '#cbd5e1' },
  { id: 'combat',     label: 'Combat',               blurb: 'Damage, soak, thresholds, crits and spending symbols.', color: '#f87171' },
  { id: 'qualities',  label: 'Weapon Qualities',     blurb: 'Accurate, Pierce, Vicious, Auto-fire and the rest.', color: '#fb923c' },
  { id: 'talents',    label: 'Talents',              blurb: 'Common talents: tier, activation and effect.', color: '#a78bfa' },
  { id: 'gear',       label: 'Gear',                 blurb: 'Encumbrance, stimpacks, armour and weapon stat lines.', color: '#2dd4bf' },
  { id: 'vehicles',   label: 'Vehicles',             blurb: 'Hull trauma, silhouette, scale, handling, defence zones.', color: '#818cf8' },
  { id: 'obligation', label: 'Obligation & Destiny', blurb: 'The two table-level mechanics that shape a session.', color: '#fb7185' },
  { id: 'xp',         label: 'Advancement',          blurb: 'What everything costs in experience points.', color: '#a3e635' },
  { id: 'spends',     label: 'Spending Results',     blurb: 'It succeeded, but there are two Threat — now what?', color: '#facc15' }
];

if (typeof window !== 'undefined') window.EOTE = EOTE;
if (typeof module !== 'undefined') module.exports = EOTE;
