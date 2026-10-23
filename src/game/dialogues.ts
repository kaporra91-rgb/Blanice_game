/**
 * Authentic Czech & Slovak Dialogue Trees for Kolej Blanice (Jižní Město).
 * Features arguing with the Kolejbába (vrátná) and Czech-Slovak student banter.
 */

import { DialogueNode } from './types';

export const DIALOGUES: Record<string, DialogueNode> = {
  // --- KOLEJBÁBA (PANÍ VRÁTNÁ) ---
  kolejbaba_start: {
    id: 'kolejbaba_start',
    speaker: 'Paní Kropáčková',
    role: 'Noční Vrátná (Kolejbába)',
    text: 'Co tady couráte v tuhle noční hodinu?! Noční klid na Blanici platí od desíti! Zase nemáte přezůvky a šlapete mi po čerstvě vytřeným linu! Kde máte kolejku?!',
    choices: [
      {
        text: 'Dobrý večer, paní vrátná! Zdržel jsem se v menze a učil se na zkoušku z ekonomie...',
        nextNodeId: 'kolejbaba_argument_1',
      },
      {
        text: 'Paní vrátná, nechte toho, venku na Jižáku mrzne a potřebuju se dostat na pokoj 312.',
        nextNodeId: 'kolejbaba_argument_2',
      },
      {
        text: 'Nesu vám z automatuStudentskou pečeť a kafe...',
        nextNodeId: 'kolejbaba_bribe',
        action: 'get_elevator_chip',
      },
    ],
  },

  kolejbaba_argument_1: {
    id: 'kolejbaba_argument_1',
    speaker: 'Paní Kropáčková',
    role: 'Noční Vrátná (Kolejbába)',
    text: 'Zkouška z ekonomie, to určitě! Spíš jste seděli U Blanice na dvanáctce! Víte vy vůbec, že nahoře ve třetím patře vypadly pojistky a výtah je zamčený na čip?! Bez zápisu do Knihy nočních příchodů vás nikam nepustím!',
    choices: [
      {
        text: 'Slibuju, že se zapíšu a budu po chodbách potichu jako pěna.',
        nextNodeId: 'kolejbaba_give_chip',
        action: 'get_elevator_chip',
      },
      {
        text: 'A mohl bych dostat čip od výtahu? Mám nahoře index a skripta.',
        nextNodeId: 'kolejbaba_lecture',
      },
    ],
  },

  kolejbaba_argument_2: {
    id: 'kolejbaba_argument_2',
    speaker: 'Paní Kropáčková',
    role: 'Noční Vrátná (Kolejbába)',
    text: 'Mladíku, nebuďte drzý! Já tady na Blanici sloužím od roku 1988, ještě když se Jižní Město teprve stavělo! Za mých časů by vás za pozdní příchod vyloučili z koleje i ze školy!',
    choices: [
      {
        text: 'Omlouvám se, paní vrátná. Máte pravdu, respektuji kolejní řád. Pustíte mě nahoru?',
        nextNodeId: 'kolejbaba_give_chip',
        action: 'get_elevator_chip',
      },
      {
        text: 'Co se to vlastně nahoře děje za divné zvuky?',
        nextNodeId: 'kolejbaba_warning',
      },
    ],
  },

  kolejbaba_bribe: {
    id: 'kolejbaba_bribe',
    speaker: 'Paní Kropáčková',
    role: 'Noční Vrátná (Kolejbába)',
    text: 'No proto! Aspoň jeden student na tomhle bloku má kousek vychování a pamatuje na noční službu. Na, tady máš čip k výtahu do 3. patra. Ale bacha nahoře na chodbě, chodí tam ten přísný profesor z Národohospodářské fakulty a kontroluje indexy!',
    choices: [
      {
        text: 'Díky moc, paní vrátná! Dám si pozor.',
        nextNodeId: 'close',
      },
    ],
  },

  kolejbaba_lecture: {
    id: 'kolejbaba_lecture',
    speaker: 'Paní Kropáčková',
    role: 'Noční Vrátná (Kolejbába)',
    text: 'Skripta jste měl mít v hlavě už před týdnem! Ale no tak... než abyste mi tu mrznul na vrátnici, tady máte čip k výtahu. A opovažte se dělat bordel!',
    choices: [
      {
        text: 'Děkuji, paní Kropáčková! Hned jdu k výtahu.',
        nextNodeId: 'close',
        action: 'get_elevator_chip',
      },
    ],
  },

  kolejbaba_give_chip: {
    id: 'kolejbaba_give_chip',
    speaker: 'Paní Kropáčková',
    role: 'Noční Vrátná (Kolejbába)',
    text: 'Tady máte ten čip k výtahu. Přiložte ho k panelu ve výtahové šachtě a vyjeďte do 3. patra. A pamatujte: noční klid!',
    choices: [
      {
        text: 'Rozumím, děkuji! Jdu k výtahu.',
        nextNodeId: 'close',
      },
    ],
  },

  kolejbaba_warning: {
    id: 'kolejbaba_warning',
    speaker: 'Paní Kropáčková',
    role: 'Noční Vrátná (Kolejbába)',
    text: 'Ve 3. patře vypadl proud a po chodbách tam bloumá ten starý profesor z NF. Furt tam mumlá něco o Phillipsově křivce a zápočtech. Tady máte čip od výtahu a vezměte si baterku!',
    choices: [
      {
        text: 'Díky za varování, paní vrátná! Vezmu si čip.',
        nextNodeId: 'close',
        action: 'get_elevator_chip',
      },
    ],
  },

  // --- CZECH & SLOVAK STUDENTS (HONZA & MAŤO) ---
  students_start: {
    id: 'students_start',
    speaker: 'Honza & Maťo',
    role: 'Spolužáci z VŠE (Čech a Slovák)',
    text: 'Honza: "Čauvec! Ty jdeš taky z venku z Jižáku? Viděl jsi tu frontu v menze na smažák?"\nMaťo: "Servus, bratu! Povedz mu ten vtip o čučoriedkach, kým pôjde hore do tej tmy!"',
    choices: [
      {
        text: 'Ahoj kluci! Jakej vtip o čučoriedkach?',
        nextNodeId: 'students_joke_1',
      },
      {
        text: 'Jak to vypadá nahoře ve 3. patře? Prý tam vypadl proud...',
        nextNodeId: 'students_dorm_info',
      },
      {
        text: 'Byli jste se podívat v posilovně nebo v bazénu?',
        nextNodeId: 'students_facilities',
      },
    ],
  },

  students_joke_1: {
    id: 'students_joke_1',
    speaker: 'Maťo (Slovák z Košic)',
    role: 'Student FIS VŠE',
    text: 'Maťo: "Počúvaj: Pýta sa Pražák na trhu v Poprade: Prosím vás, a to černé to je borůvka? Predavač vraví: Nie, to je čučoriedka. A prečo je červená? Lebo je ešte zelená!"\nHonza: "Haha! A víš ty, Maťo, proč slovenský student na VŠE nejezdí metrem? Protože v Bratislavě mají na lístku napsáno: Metro je dočasně ve výstavbě od roku 1985!"',
    choices: [
      {
        text: 'Haha, klasické česko-slovenské špičkování! Co říkali o tom profesorovi nahoře?',
        nextNodeId: 'students_dorm_info',
        action: 'joke_reaction',
      },
      {
        text: 'Půjdu se ještě kouknout do menzy a posilovny, pak vyrazím nahoru.',
        nextNodeId: 'close',
      },
    ],
  },

  students_dorm_info: {
    id: 'students_dorm_info',
    speaker: 'Honza (Čech z Prahy)',
    role: 'Student FPH VŠE',
    text: 'Honza: "Hele, nahoře ve 3. patře je to divný. Zhasly zářivky a ten profesor z Národohospodářské fakulty tam prý zkouší studenty z makroekonomie přímo na chodbě! Když nevíš vzoreček, dá ti Fko a vyhodí tě z koleje!"\nMaťo: "Presne! Ale vraj ak nájdeš ISIC kartu a kód k InSISu (niečo ako 5214 z mikroekonómie), dá sa nahodiť poistka v rozvodni a utiecť únikovým východom!"',
    choices: [
      {
        text: 'Díky za radu, kluci! Už mám čip od kolejbáby, jdu k výtahu.',
        nextNodeId: 'close',
      },
    ],
  },

  students_facilities: {
    id: 'students_facilities',
    speaker: 'Maťo & Honza',
    role: 'Spolužáci',
    text: 'Maťo: "V posilke chalani ešte benchujú pred skúškovým, aby vybili stres. A v bazéne je super teplá voda, ale plavčík už zhasína."\nHonza: "V menze naproti už zametají, ale kávomat u vstupu ještě funguje. Určitě si vezmi čip k výtahu od paní Kropáčkové na vrátnici!"',
    choices: [
      {
        text: 'Jasně, skočím k vrátnici pro čip a pak jedu výtahem.',
        nextNodeId: 'close',
      },
    ],
  },
};
