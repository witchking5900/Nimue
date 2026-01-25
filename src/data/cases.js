import { Activity, Heart } from 'lucide-react';

export const clinicalCases = [
  {
    id: "arrhythmia_01",
    title: { 
      en: "Arrhythmia Management (AFib)", 
      ka: "არითმიის მართვა (AFib)" 
    },
    category: "Cardiology",
    icon: Activity,
    color: "text-blue-500",
    difficulty: "Medium",
    patient: {
      details: { 
        en: "68-year-old male. History of Heart Failure (HF).", 
        ka: "68 წლის მამაკაცი. ანამნეზში გულის უკმარისობა (HF)." 
      },
      complaint: { 
        en: "Presented with palpitations and shortness of breath.", 
        ka: "შემოვიდა ფრიალის შეგრძნებით (Palpitations) და ქოშინით." 
      },
      ecg: { 
        en: "ECG: Atrial Fibrillation (AFib), HR 130 bpm.", 
        ka: "ეკგ: წინაგულთა ფიბრილაცია (AFib), HR 130 bpm." 
      },
      vitals: { bp: "110/70", hr: "130 bpm", o2: "94%" },
    },
    steps: [
      // STEP 1
      {
        id: 1,
        question: {
          en: "First, we need Rate Control. Which medication group do you choose?",
          ka: "პირველ რიგში გვინდა გულისცემის სიხშირის კონტროლი (Rate Control). რომელი ჯგუფის მედიკამენტს ირჩევთ?"
        },
        hint: {
          en: "Recall the side effects and contraindications of CCBs in Heart Failure.",
          ka: "გაიხსენეთ კალციუმის არხების ბლოკერების (CCB) გვერდითი ეფექტები და უკუჩვენებები გულის უკმარისობისას."
        },
        options: [
          {
            id: "a",
            text: { en: "Verapamil", ka: "ვერაპამილი (Verapamil)" },
            correct: false,
            feedback: {
              en: "Careful! 'Constipation is a major side effect of CCB'. Also, Verapamil has negative inotropic effects and is risky in HF.",
              ka: "ფრთხილად! თქვენს ფაილში წერია: 'Constipation is a major side effect of CCB'. გარდა ამისა, ვერაპამილს აქვს უარყოფითი ინოტროპული ეფექტი და გულის უკმარისობის დროს სარისკოა."
            },
          },
          {
            id: "b",
            text: { en: "Beta-Blocker (e.g., Metoprolol)", ka: "ბეტა-ბლოკერი (მაგ. მეტოპროლოლი)" },
            correct: true,
            feedback: {
              en: "Correct! Beta-blockers are safe and effective for rate control.",
              ka: "სწორია! ბეტა-ბლოკერი უსაფრთხო და ეფექტურია სიხშირის კონტროლისთვის."
            },
          },
          {
            id: "c",
            text: { en: "Adenosine", ka: "ადენოზინი" },
            correct: false,
            feedback: {
              en: "Adenosine only briefly blocks the AV node (for SVT). It is not used for AFib management.",
              ka: "ადენოზინი მხოლოდ ხანმოკლედ ბლოკავს AV კვანძს (SVT-სთვის). AFib-ის დროს ის არ გამოიყენება."
            },
          },
        ],
      },
      // STEP 2
      {
        id: 2,
        question: {
            en: "We choose Amiodarone for Rhythm Control. What is its mechanism of action?",
            ka: "რითმის კონტროლისთვის (Rhythm Control) ვირჩევთ ამიოდარონს. როგორია მისი მოქმედების მექანიზმი?"
        },
        hint: {
            en: " Which class does it belong to and which channels does it block?",
            ka: " რომელ კლასს მიეკუთვნება და რომელ არხებს ბლოკავს?"
        },
        options: [
            {
                id: "a",
                text: { en: "Class I (Na+ channel blockade)", ka: "Class I (Na+ არხების ბლოკადა)" },
                correct: false,
                feedback: { en: "No, that's Quinidine/Lidocaine.", ka: "არა, ეს არის ქინიდინი/ლიდოკაინი." }
            },
            {
                id: "b",
                text: { en: "Class III (K+ channel blockade)", ka: "Class III (K+ არხების ბლოკადა)" },
                correct: true,
                feedback: { en: "Exactly! Note says: 'Class III antiarrhythmic drugs → block K channels → ↑ duration of AP'.", ka: "ზუსტად! ფაილში წერია: 'Class III antiarrhythmic drugs → block K channels → ↑ duration of AP'." }
            },
            {
                id: "c",
                text: { en: "Class IV (Ca+ channel blockade)", ka: "Class IV (Ca+ არხების ბლოკადა)" },
                correct: false,
                feedback: { en: "No, that's Verapamil and Diltiazem.", ka: "არა, ეს ვერაპამილი და დილთიაზემია." }
            }
        ]
      },
      // STEP 3
      {
        id: 3,
        question: {
            en: "After starting Amiodarone, ECG shows QT prolongation. Should we stop the drug?",
            ka: "ამიოდარონის დაწყების შემდეგ, ეკგ-ზე ვხედავთ QT ინტერვალის გახანგრძლივებას. უნდა შევწყვიტოთ თუ არა წამალი?"
        },
        hint: {
            en: " Does Amiodarone cause Torsades des Pointes?",
            ka: " იწვევს თუ არა ამიოდარონი Torsades des Pointes-ს?"
        },
        options: [
            {
                id: "a",
                text: { en: "Yes, immediately! High risk of Torsades des Pointes.", ka: "დიახ, სასწრაფოდ! Torsades des Pointes-ის რისკი მაღალია." },
                correct: false,
                feedback: { en: "Incorrect. Unlike other Class III drugs (e.g. Sotalol), this is rare with Amiodarone.", ka: "შეცდომაა. სხვა კლასის III წამლებისგან (მაგ. სოტალოლი) განსხვავებით, ამიოდარონს ეს იშვიათად ახასიათებს." }
            },
            {
                id: "b",
                text: { en: "No, continue with monitoring.", ka: "არა, ვაგრძელებთ მონიტორინგით." },
                correct: true,
                feedback: { en: "Correct! Note says: 'Amiodarone causes prolongation of QT interval → but very little risk of torsade des pointes'.", ka: "სწორია! თქვენს ფაილში წერია: 'Amiodarone causes prolongation of QT interval → but very little risk of torsade des pointes'." }
            }
        ]
      },
      // STEP 4
      {
        id: 4,
        question: {
            en: "Patient returns after 6 months with fatigue and weight gain. Which organ toxicity do you suspect?",
            ka: "პაციენტი მოდის 6 თვის შემდეგ დაღლილობით და წონის მატებით. რომელი ორგანოს ტოქსიურობაზე მიიტანთ ეჭვს?"
        },
        hint: {
            en: "Thyroid complication is more common with preexisting disease.",
            ka: " ფარისებრი ჯირკვლის გართულებები უფრო ხშირია თანმხლები დაავადებების დროს."
        },
        options: [
            {
                id: "a",
                text: { en: "Adrenal gland", ka: "თირკმელზედა ჯირკვალი" },
                correct: false,
                feedback: { en: "Amiodarone does not affect the adrenal gland.", ka: "ამიოდარონი არ მოქმედებს თირკმელზედა ჯირკვალზე." }
            },
            {
                id: "b",
                text: { en: "Thyroid gland (Hypothyroidism)", ka: "ფარისებრი ჯირკვალი (ჰიპოთირეოზი)" },
                correct: true,
                feedback: { en: "Correct! Amiodarone causes both Hypo- and Hyperthyroidism (check TSH).", ka: "სწორია! ამიოდარონი იწვევს როგორც ჰიპო-, ისე ჰიპერთირეოზს (საჭიროა TSH-ის კონტროლი)." }
            },
            {
                id: "c",
                text: { en: "Pancreas", ka: "პანკრეასი" },
                correct: false,
                feedback: { en: "Not characteristic.", ka: "არ არის დამახასიათებელი." }
            }
        ]
      },
      // STEP 5
      {
        id: 5,
        question: {
            en: "What other side effects are expected with long-term Amiodarone use?",
            ka: "კიდევ რომელი გვერდითი ეფექტებია მოსალოდნელი ამიოდარონის ხანგრძლივი მიღებისას?"
        },
        hint: {
            en: " lung, liver, and nervous system.",
            ka: " ფილტვი, ღვიძლი და ნერვული სისტემა."
        },
        options: [
            {
                id: "a",
                text: { en: "Renal failure and gastritis", ka: "თირკმლის უკმარისობა და გასტრიტი" },
                correct: false,
                feedback: { en: "Not specific.", ka: "არ არის სპეციფიკური." }
            },
            {
                id: "b",
                text: { en: "Pulmonary fibrosis, hepatitis, optic neuritis", ka: "ფილტვის ფიბროზი, ჰეპატიტი, მხედველობის ნევრიტი" },
                correct: true,
                feedback: { en: "Correct! Note says: 'peripheral neuropathy, optic neuropathy, hepatitis & ↑ AST & ALT'.", ka: "სწორია! ფაილში მითითებულია: 'peripheral neuropathy, optic neuropathy, hepatitis & ↑ AST & ALT'." }
            }
        ]
      }
    ],
  },
  {
    id: "pericarditis_02",
    title: { en: "Chest Pain (Pericarditis)", ka: "გულმკერდის ტკივილი (Pericarditis)" },
    category: "Cardiology",
    icon: Heart,
    color: "text-red-500",
    difficulty: "Hard",
    patient: {
      details: { en: "34 yo male. Viral infection 2 weeks ago.", ka: "34 წლის მამაკაცი. 2 კვირის წინ გადაიტანა ვირუსული ინფექცია." },
      complaint: { en: "Sharp retrosternal pain, worse with deep inspiration.", ka: "უჩივის მწვავე ტკივილს მკერდის ძვლის უკან, რომელიც ძლიერდება ღრმა ჩასუნთქვაზე." },
      ecg: { en: "ECG: Diffuse ST elevation.", ka: "ეკგ: დიფუზური ST ელევაცია." },
      vitals: { bp: "120/80", hr: "98 bpm", temp: "37.8°C" },
    },
    steps: [
        // STEP 1
        {
        id: 1,
        question: {
            en: "Pain changes with position. Which position relieves Pericarditis pain?",
            ka: "პაციენტი აღნიშნავს, რომ ტკივილი იცვლება პოზის მიხედვით. რომელი პოზა ამსუბუქებს პერიკარდიტის ტკივილს?"
        },
        hint: {
            en: " Pericarditis pain is sharp & pleuritic.",
            ka: " პერიკარდიტის დროს ტკივილი მჩხვლეტი და პლევრული ხასიათისაა."
        },
        options: [
            {
                id: "a",
                text: { en: "Supine (Lying flat)", ka: "ზურგზე წოლა (Supine)" },
                correct: false,
                feedback: { en: "Supine worsens the pain due to pericardial stretching.", ka: "პირიქით, ზურგზე წოლა აძლიერებს ტკივილს პერიკარდიუმის გაჭიმვის გამო." }
            },
            {
                id: "b",
                text: { en: "Sitting up and leaning forward", ka: "წინ გადახრა (Sitting up and leaning forward)" },
                correct: true,
                feedback: { en: "Correct! This relieves pressure on the parietal pericardium.", ka: "სწორია! ეს პოზა ამცირებს ზეწოლას პარიეტულ პერიკარდიუმზე." }
            },
            {
                id: "c",
                text: { en: "Lying on left side", ka: "მარცხენა გვერდზე წოლა" },
                correct: false,
                feedback: { en: "Not specific for pericarditis.", ka: "ეს არ არის სპეციფიკური პერიკარდიტისთვის." }
            }
        ]
        },
        // STEP 2
        {
            id: 2,
            question: {
                en: "ECG shows diffuse ST elevation. What other ECG sign is specific for Pericarditis?",
                ka: "ეკგ-ზე ვხედავთ დიფუზურ ST ელევაციას. კიდევ რომელი ეკგ ნიშანია სპეციფიკური პერიკარდიტისთვის?"
            },
            hint: {
                en: "Look at the PR interval.",
                ka: "დააკვირდით PR ინტერვალს."
            },
            options: [
                {
                    id: "a",
                    text: { en: "PR interval depression", ka: "PR ინტერვალის დეპრესია" },
                    correct: true,
                    feedback: { en: "Correct! 'Diffuse ST elevation & PR depression' is a classic sign.", ka: "სწორია! 'Diffuse ST elevation & PR depression' არის კლასიკური ნიშანი." }
                },
                {
                    id: "b",
                    text: { en: "Q waves", ka: "Q ტალღები" },
                    correct: false,
                    feedback: { en: "This indicates a past infarction, not pericarditis.", ka: "ეს მიუთითებს გადატანილ ინფარქტზე და არა პერიკარდიტზე." }
                },
                {
                    id: "c",
                    text: { en: "Electrical Alternans", ka: "ელექტრული ალტერნაცია (Electrical Alternans)" },
                    correct: false,
                    feedback: { en: "This appears only with large effusion (Tamponade), it's too early.", ka: "ეს ნიშანი ჩნდება მხოლოდ დიდი რაოდენობით გამონაჟონის (ტამპონადის) დროს, ჯერ ადრეა." }
                }
            ]
        },
        // STEP 3
        {
            id: 3,
            question: {
                en: "Patient returns 3 days later worse: BP 80/50 mmHg, JVD present. What complication do you suspect?",
                ka: "პაციენტი ბრუნდება 3 დღის შემდეგ გაუარესებით: წნევა 80/50 mmHg, კისრის ვენები დაბერილია (JVD). რა გართულებაზე ეჭვობთ?"
            },
            hint: {
                en: " Beck Triad = Hypotension + JVD + Distant heart sounds.",
                ka: "ბეკის ტრიადა = ჰიპოტენზია + კისრის ვენების დაბერვა (JVD) + მოყრუებული გულის ტონები."
            },
            options: [
                {
                    id: "a",
                    text: { en: "Aortic Dissection", ka: "აორტის დისექცია" },
                    correct: false,
                    feedback: { en: "Unlikely with viral history.", ka: "ნაკლებად სავარაუდოა ვირუსული ანამნეზით." }
                },
                {
                    id: "b",
                    text: { en: "Cardiac Tamponade", ka: "გულის ტამპონადა" },
                    correct: true,
                    feedback: { en: "Exactly! This is Beck's Triad. Fluid compresses the heart.", ka: "ზუსტად! ეს არის ბეკის ტრიადა. სითხე აწვება გულს." }
                },
                {
                    id: "c",
                    text: { en: "Myocardial Infarction", ka: "მიოკარდიუმის ინფარქტი" },
                    correct: false,
                    feedback: { en: "ECG changes were diffuse, which excludes MI.", ka: "ეკგ ცვლილებები დიფუზური იყო, რაც ინფარქტს გამორიცხავს." }
                }
            ]
        },
        // STEP 4
        {
            id: 4,
            question: {
                en: "In tamponade, we check for 'Pulsus Paradoxus'. What does this mean?",
                ka: "ტამპონადის დროს ვამოწმებთ 'Pulsus Paradoxus'-ს. რას ნიშნავს ეს?"
            },
            hint: {
                en: "How does systolic BP change on inspiration?",
                ka: "როგორ იცვლება სისტოლური წნევა ჩასუნთქვისას?"
            },
            options: [
                {
                    id: "a",
                    text: { en: "Increased heart rate on inspiration", ka: "გულისცემის გახშირება ჩასუნთქვისას" },
                    correct: false,
                    feedback: { en: "This is physiological sinus arrhythmia.", ka: "ეს არის ფიზიოლოგიური სინუსური არითმია." }
                },
                {
                    id: "b",
                    text: { en: "Drop in systolic BP > 10 mmHg on inspiration", ka: "სისტოლური წნევის დაქვეითება >10 mmHg-ით ჩასუნთქვისას" },
                    correct: true,
                    feedback: { en: "Correct! 'Drop in systolic BP > 10 mmHg on inspiration'.", ka: "სწორია! 'Drop in systolic BP > 10 mmHg on inspiration'." }
                }
            ]
        }
    ]
  }
];