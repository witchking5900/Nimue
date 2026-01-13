export const getRoleLabel = (role, theme, language) => {
  // Database Value : { Magic Display, Standard Display }
  const definitions = {
    archmage: {
      magic: { en: "Archmage", ka: "არქიმაგი" },
      std:   { en: "Department Chair", ka: "დეპ. ხელმძღვანელი" },
      color: "text-red-500" // Special color for you
    },
    insubstantial: {
      magic: { en: "Insubstantial", ka: "ილუზორული" },
      std:   { en: "Honorary Fellow", ka: "საპატიო წევრი" },
      color: "text-purple-400"
    },
    grand_magus: {
      magic: { en: "Grand Magus", ka: "დიდი ჯადოქარი" },
      std:   { en: "Attending Physician", ka: "მკურნალი ექიმი" },
      color: "text-amber-500"
    },
    magus: {
      magic: { en: "Magus", ka: "ჯადოქარი" },
      std:   { en: "Resident", ka: "რეზიდენტი" },
      color: "text-blue-500"
    },
    apprentice: {
      magic: { en: "Apprentice", ka: "მოსწავლე" },
      std:   { en: "Student", ka: "სტუდენტი" },
      color: "text-slate-500"
    },
    // Fallback for default 'student' in DB
    student: {
      magic: { en: "Apprentice", ka: "მოსწავლე" },
      std:   { en: "Student", ka: "სტუდენტი" },
      color: "text-slate-500"
    }
  };

  const def = definitions[role] || definitions.student;
  const isMagic = theme === 'magical';
  const text = isMagic ? def.magic[language] : def.std[language];
  
  return { text, color: def.color };
};