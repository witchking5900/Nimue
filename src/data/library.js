export const medicalLibrary = [
  {
    id: 'biochem',
    title: { en: 'Biochemistry', ka: 'ბიოქიმია' },
    icon: 'Atom',
    subtopics: [
      {
        id: 'heme',
        title: { en: 'Heme Degradation', ka: 'ჰემის დაშლა' },
        // This is the actual medical text mixed with magical notes
        content: [
          {
            type: 'text',
            en: "Red blood cells live for about 120 days. When they die, they are broken down in the spleen.",
            ka: "ერითროციტები ცოცხლობენ დაახლოებით 120 დღე. სიკვდილის შემდეგ ისინი იშლებიან ელენთაში."
          },
          {
            type: 'mnemonic', // "Important" Magic
            en: "Mnemonic: 'Heme' rhymes with 'Dream'. When RBCs dream, they go to the Spleen to die.",
            ka: "მნემონიკა: ჰემი და სიზმარი (Dream). როცა ერითროციტებს ესიზმრებათ, ისინი ელენთაში მიდიან."
          },
          {
            type: 'text',
            en: "The Heme is converted to Biliverdin (Green) and then to Bilirubin (Yellow/Orange).",
            ka: "ჰემი გარდაიქმნება ბილივერდინად (მწვანე) და შემდეგ ბილირუბინად (ყვითელი/ნარინჯისფერი)."
          },
          {
            type: 'joke', // "Full" Magic
            en: "Why was the Bilirubin sad? Because his father was a 'Has-been' (Heme) and his future was just crap (stercobilin).",
            ka: "რატომ იყო ბილირუბინი მოწყენილი? რადგან მამამისი იყო 'ყოფილ-ი' (ჰემი), მომავალი კი განავალი (სტერკობილინი)."
          }
        ]
      },
      {
        id: 'energy',
        title: { en: 'Energy Chain', ka: 'ენერგეტიკული ცვლა' },
        content: [
          { type: 'text', en: "Mitochondria is the powerhouse of the cell.", ka: "მიტოქონდრია უჯრედის ენერგო-სადგურია." }
        ]
      }
    ]
  },
  {
    id: 'cardio',
    title: { en: 'Cardiology', ka: 'კარდიოლოგია' },
    icon: 'Heart',
    subtopics: []
  }
];