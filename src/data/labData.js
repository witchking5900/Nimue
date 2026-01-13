import { FlaskConical, Droplets, Flame, Skull } from 'lucide-react';

export const labScenarios = [
  {
    id: "anemia_01",
    // DUAL TITLES: One for the Alchemist, One for the Doctor
    title: {
      magical: { en: "The Pale Elixir", ka: "ფერმკრთალი ელექსირი" },
      standard: { en: "Hematology Case", ka: "ჰემატოლოგია" }
    },
    category: "Hematology",
    difficulty: "Easy",
    values: [
      { name: "Hb (Hemoglobin)", value: "8.5 g/dL", status: "low", normal: "12-16" },
      { name: "MCV (Size)", value: "72 fL", status: "low", normal: "80-100" },
      { name: "Ferritin", value: "10 ng/mL", status: "low", normal: "30-300" },
      { name: "TIBC", value: "450 mcg/dL", status: "high", normal: "250-400" }
    ],
    diagnosis: { 
      en: "Iron Deficiency Anemia", 
      ka: "რკინადეფიციტური ანემია" 
    },
    options: [
      { id: "a", text: { en: "Thalassemia Minor", ka: "თალასემია მინორი" }, correct: false },
      { id: "b", text: { en: "Iron Deficiency Anemia", ka: "რკინადეფიციტური ანემია" }, correct: true },
      { id: "c", text: { en: "Anemia of Chronic Disease", ka: "ქრონიკული დაავადების ანემია" }, correct: false }
    ],
    explanation: {
      en: "Low Ferritin is specific for Iron Deficiency. In Thalassemia, Ferritin is normal/high.",
      ka: "დაბალი ფერიტინი სპეციფიკურია რკინადეფიციტისთვის. თალასემიისას ფერიტინი ნორმაა/მომატებულია."
    }
  },
  {
    id: "thyroid_01",
    title: {
      magical: { en: "The Sluggish Potion", ka: "ზანტი ელექსირი" },
      standard: { en: "Endocrinology Case", ka: "ენდოკრინოლოგია" }
    },
    category: "Endocrinology",
    difficulty: "Medium",
    values: [
      { name: "TSH", value: "12.5 mIU/L", status: "high", normal: "0.4-4.0" },
      { name: "Free T4", value: "0.6 ng/dL", status: "low", normal: "0.9-1.7" },
      { name: "Anti-TPO", value: "Positive", status: "high", normal: "Negative" }
    ],
    diagnosis: { 
      en: "Hashimoto's Thyroiditis", 
      ka: "ჰაშიმოტოს თირეოიდიტი" 
    },
    options: [
      { id: "a", text: { en: "Graves' Disease", ka: "გრეივსის დაავადება" }, correct: false },
      { id: "b", text: { en: "Subclinical Hypothyroidism", ka: "სუბკლინიკური ჰიპოთირეოზი" }, correct: false },
      { id: "c", text: { en: "Hashimoto's Thyroiditis", ka: "ჰაშიმოტოს თირეოიდიტი" }, correct: true }
    ],
    explanation: {
      en: "High TSH + Low T4 = Primary Hypothyroidism. Positive Anti-TPO confirms autoimmune origin.",
      ka: "მაღალი TSH + დაბალი T4 = პირველადი ჰიპოთირეოზი. დადებითი Anti-TPO ადასტურებს აუტოიმუნურ გენეზს."
    }
  }
];