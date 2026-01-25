[
  {
    id: "elyte_01",
    title: {
      magical: { en: "The Electric Storm", ka: "ელექტრული ქარიშხალი" },
      standard: { en: "Electrolyte Imbalance", ka: "ელექტროლიტური დისბალანსი" }
    },
    category: "Electrolytes",
    difficulty: "Medium",
    values: [
      { name: "Sodium (Na+)", value: "128 mmol/L", status: "low", normal: "135-145" },
      { name: "Glucose", value: "600 mg/dL", status: "high", normal: "70-100" },
      { name: "Osmolality", value: "310 mOsm/kg", status: "high", normal: "275-295" }
    ],
    diagnosis: {
      en: "Hyperglycemic Hyponatremia (Dilutional)",
      ka: "ჰიპერგლიკემიური ჰიპონატრიემია"
    },
    options: [
      { id: "a", text: { en: "SIADH", ka: "SIADH" }, correct: false, feedback: { en: "Incorrect. SIADH typically presents with normal glucose and low serum osmolality.", ka: "არასწორია. SIADH-ს დროს გლუკოზა ნორმაშია და ოსმოლარობა დაბალი." } },
      { id: "b", text: { en: "True Hyponatremia", ka: "ჭეშმარიტი ჰიპონატრიემია" }, correct: false, feedback: { en: "Incorrect. The sodium is low due to the dilutional effect of high glucose.", ka: "არასწორია. ნატრიუმი დაბალია მაღალი გლუკოზის გამხსნელი ეფექტის გამო." } },
      { id: "c", text: { en: "Dilutional Hyponatremia", ka: "განზავებითი ჰიპონატრიემია" }, correct: true, feedback: { en: "Correct! High glucose draws water into the serum, artificially lowering sodium concentration.", ka: "სწორია! მაღალი გლუკოზა იზიდავს წყალს სისხლში, რაც ხელოვნურად ამცირებს ნატრიუმის კონცენტრაციას." } }
    ],
    explanation: {
      en: "Corrected Na increases by ~1.6 for every 100 mg/dL rise in glucose over 100.",
      ka: "კორეგირებული Na იზრდება ~1.6-ით ყოველ 100 მგ/დლ გლუკოზის მატებაზე."
    }
  },
  {
    id: "renal_01",
    title: {
      magical: { en: "The Failing Filter", ka: "დაზიანებული ფილტრი" },
      standard: { en: "Nephrology Case", ka: "ნეფროლოგია" }
    },
    category: "Nephrology",
    difficulty: "Hard",
    values: [
      { name: "Creatinine", value: "2.8 mg/dL", status: "high", normal: "0.6-1.2" },
      { name: "BUN", value: "80 mg/dL", status: "high", normal: "7-20" },
      { name: "BUN/Cr Ratio", value: "28", status: "high", normal: "10-20" },
      { name: "Urine Na", value: "< 10 mmol/L", status: "low", normal: "> 20" }
    ],
    diagnosis: {
      en: "Prerenal Azotemia",
      ka: "პრერენალური აზოტემია"
    },
    options: [
      { id: "a", text: { en: "Acute Tubular Necrosis (ATN)", ka: "მილაკოვანი ნეკროზი (ATN)" }, correct: false, feedback: { en: "Incorrect. In ATN, the kidney cannot reabsorb sodium, so Urine Na would be > 40 and BUN/Cr < 15.", ka: "არასწორია. ATN-ს დროს თირკმელი ვერ იწოვს ნატრიუმს, ამიტომ შარდის Na > 40 და BUN/Cr < 15." } },
      { id: "b", text: { en: "Prerenal Azotemia", ka: "პრერენალური აზოტემია" }, correct: true, feedback: { en: "Correct! High BUN/Cr ratio (>20) and low Urine Na (<10) indicate the kidneys are avidly retaining sodium due to low perfusion.", ka: "სწორია! მაღალი BUN/Cr ფარდობა (>20) და დაბალი შარდის Na (<10) მიუთითებს, რომ თირკმელი იკავებს ნატრიუმს დაბალი პერფუზიის გამო." } },
      { id: "c", text: { en: "Postrenal Obstruction", ka: "პოსტრენალური ობსტრუქცია" }, correct: false, feedback: { en: "Incorrect. Obstruction typically causes a BUN/Cr ratio closer to 10-15 initially.", ka: "არასწორია. ობსტრუქცია ჩვეულებრივ იწვევს BUN/Cr ფარდობას 10-15-ის ფარგლებში." } }
    ],
    explanation: {
      en: "Prerenal causes (dehydration, heart failure) lead to avid Na/Water reabsorption.",
      ka: "პრერენალური მიზეზები (გაუწყლოება, გულის უკმარისობა) იწვევს Na/წყლის გაძლიერებულ რეაბსორბციას."
    }
  },
  {
    id: "liver_01",
    title: {
      magical: { en: "The Yellow Draft", ka: "ყვითელი ნაყენი" },
      standard: { en: "Hepatology Case", ka: "ჰეპატოლოგია" }
    },
    category: "Hepatology",
    difficulty: "Medium",
    values: [
      { name: "AST", value: "1200 U/L", status: "high", normal: "10-40" },
      { name: "ALT", value: "1500 U/L", status: "high", normal: "7-56" },
      { name: "Alk Phos", value: "130 U/L", status: "normal", normal: "44-147" },
      { name: "Bilirubin", value: "2.1 mg/dL", status: "high", normal: "0.1-1.2" }
    ],
    diagnosis: {
      en: "Acute Viral Hepatitis",
      ka: "მწვავე ვირუსული ჰეპატიტი"
    },
    options: [
      { id: "a", text: { en: "Alcoholic Hepatitis", ka: "ალკოჰოლური ჰეპატიტი" }, correct: false, feedback: { en: "Incorrect. Alcoholic hepatitis usually has AST > ALT (2:1 ratio) and values typically < 500.", ka: "არასწორია. ალკოჰოლური ჰეპატიტის დროს AST > ALT (2:1 ფარდობა) და მაჩვენებლები < 500." } },
      { id: "b", text: { en: "Choledocholithiasis (Stone)", ka: "ქოლედოქოლითიაზი" }, correct: false, feedback: { en: "Incorrect. A stone would cause a much higher elevation in Alkaline Phosphatase.", ka: "არასწორია. კენჭი გამოიწვევდა ტუტე ფოსფატაზის მკვეთრ მომატებას." } },
      { id: "c", text: { en: "Acute Viral Hepatitis", ka: "მწვავე ვირუსული ჰეპატიტი" }, correct: true, feedback: { en: "Correct! Transaminases in the 1000s with normal/mild Alk Phos suggest hepatocellular damage like viral hepatitis.", ka: "სწორია! ტრანსამინაზები 1000-ებში და ნორმალური ტუტე ფოსფატაზა მიუთითებს ჰეპატოცელულარულ დაზიანებაზე." } }
    ],
    explanation: {
      en: "Very high AST/ALT (>1000) indicates acute hepatocellular necrosis (Viral, Toxin, Ischemia).",
      ka: "ძალიან მაღალი AST/ALT (>1000) მიუთითებს მწვავე ჰეპატოცელულარულ ნეკროზზე (ვირუსი, ტოქსინი, იშემია)."
    }
  },
  {
    id: "abg_01",
    title: {
      magical: { en: "Breath of Fire", ka: "ცეცხლოვანი სუნთქვა" },
      standard: { en: "Acid-Base Case", ka: "მჟავა-ტუტოვანი წონასწორობა" }
    },
    category: "Pulmonology",
    difficulty: "Medium",
    values: [
      { name: "pH", value: "7.25", status: "low", normal: "7.35-7.45" },
      { name: "pCO2", value: "60 mmHg", status: "high", normal: "35-45" },
      { name: "HCO3", value: "26 mEq/L", status: "normal", normal: "22-26" }
    ],
    diagnosis: {
      en: "Acute Respiratory Acidosis",
      ka: "მწვავე რესპირატორული აციდოზი"
    },
    options: [
      { id: "a", text: { en: "Metabolic Acidosis", ka: "მეტაბოლური აციდოზი" }, correct: false, feedback: { en: "Incorrect. In metabolic acidosis, HCO3 would be low.", ka: "არასწორია. მეტაბოლური აციდოზის დროს HCO3 დაბალი იქნებოდა." } },
      { id: "b", text: { en: "Acute Respiratory Acidosis", ka: "მწვავე რესპირატორული აციდოზი" }, correct: true, feedback: { en: "Correct! Low pH (acidosis) driven by high CO2 (respiratory). Normal HCO3 means kidneys haven't compensated yet (Acute).", ka: "სწორია! დაბალი pH (აციდოზი) გამოწვეულია მაღალი CO2-ით. ნორმალური HCO3 ნიშნავს, რომ კომპენსაცია ჯერ არ მომხდარა (მწვავე)." } },
      { id: "c", text: { en: "Chronic Respiratory Acidosis", ka: "ქრონიკული რესპირატორული აციდოზი" }, correct: false, feedback: { en: "Incorrect. In chronic cases, HCO3 would be elevated to compensate.", ka: "არასწორია. ქრონიკულ შემთხვევაში HCO3 მომატებული იქნებოდა კომპენსაციისთვის." } }
    ],
    explanation: {
      en: "Hypoventilation (e.g., Opioid overdose) causes CO2 retention. Lack of HCO3 rise confirms acute onset.",
      ka: "ჰიპოვენტილაცია (მაგ. ოპიოიდები) იწვევს CO2-ის დაგროვებას. HCO3-ის ნორმა ადასტურებს მწვავე პროცესს."
    }
  },
  {
    id: "cardio_01",
    title: {
      magical: { en: "Heart of the Golem", ka: "გოლემის გული" },
      standard: { en: "Cardiology Case", ka: "კარდიოლოგია" }
    },
    category: "Cardiology",
    difficulty: "Medium",
    values: [
      { name: "Troponin I", value: "0.02 ng/mL", status: "normal", normal: "< 0.04" },
      { name: "BNP", value: "1200 pg/mL", status: "high", normal: "< 100" },
      { name: "Creatinine", value: "1.1 mg/dL", status: "normal", normal: "0.6-1.2" }
    ],
    diagnosis: {
      en: "Acute Heart Failure Exacerbation",
      ka: "გულის უკმარისობის გამწვავება"
    },
    options: [
      { id: "a", text: { en: "Acute Myocardial Infarction", ka: "მიოკარდიუმის მწვავე ინფარქტი" }, correct: false, feedback: { en: "Incorrect. Troponin is normal, making acute ischemia unlikely.", ka: "არასწორია. ტროპონინი ნორმაშია, რაც მწვავე იშემიას ნაკლებად სავარაუდოს ხდის." } },
      { id: "b", text: { en: "Pulmonary Embolism", ka: "ფილტვის არტერიის თრომბოემბოლია" }, correct: false, feedback: { en: "Incorrect. While PE can raise BNP, such a high level is classic for Heart Failure overload.", ka: "არასწორია. თრომბოემბოლიამ შეიძლება აწიოს BNP, მაგრამ ასეთი მაღალი დონე გულის უკმარისობისთვისაა დამახასიათებელი." } },
      { id: "c", text: { en: "Heart Failure Exacerbation", ka: "გულის უკმარისობის გამწვავება" }, correct: true, feedback: { en: "Correct! Highly elevated BNP indicates ventricular stretch due to fluid overload.", ka: "სწორია! მკვეთრად მომატებული BNP მიუთითებს პარკუჭის გაჭიმვაზე სითხით დატვირთვის გამო." } }
    ],
    explanation: {
      en: "BNP is a hormone released by the ventricles in response to stretch. It is a sensitive marker for volume overload.",
      ka: "BNP ჰორმონია, რომელიც გამოიყოფა პარკუჭებიდან გაჭიმვის საპასუხოდ. ის მოცულობით გადატვირთვის მგრძნობიარე მარკერია."
    }
  }
]