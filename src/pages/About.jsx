import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, MapPin, Phone, Mail, Scroll, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About({ onBack }) {
  const { theme, language } = useTheme();
  const isMagical = theme === 'magical';

  // --- CONTENT CONFIGURATION ---
  // ⚠️ ACTION REQUIRED: Fill these in with your REAL Legal Entity details
  const companyInfo = {
    name: "Nimue med LLC", // Your Registered Company Name
    id: "ID: 418486132",          // Identification Number (Saidentifikatsio)
    address: "Gori, Robakidze #26 Georgia", 
    phone: "+995 551 000 177",
    email: "Witchking5900@gmail.com"
  };

  const text = {
    title: { en: "About Us", ka: "ჩვენს შესახებ" },
    missionTitle: { en: "Our Mission", ka: "ჩვენი მისია" },
    mission: {
      en: "Nimue's Grimoire bridges the gap between ancient medical wisdom and modern clinical practice. We provide a gamified platform for medical students to master complex theories through interactive challenges.",
      ka: "Nimue's Grimoire აერთიანებს ძველ სამედიცინო სიბრძნესა და თანამედროვე კლინიკურ პრაქტიკას. ჩვენ ვქმნით გემიფიცირებულ პლატფორმას სტუდენტებისთვის რთული თეორიების ასათვისებლად."
    },
    contactTitle: { en: "Contact Information", ka: "საკონტაქტო ინფორმაცია" },
    serviceTitle: { en: "Service Description", ka: "მომსახურების აღწერა" },
    service: {
      en: "We offer digital educational content, including interactive quizzes, clinical case simulations, and study materials. Prices are listed in GEL on the subscription page.",
      ka: "ჩვენ გთავაზობთ ციფრულ საგანმანათლებლო კონტენტს: ინტერაქტიულ ქვიზებს, კლინიკურ ქეისებს და სასწავლო მასალებს. ფასები მოცემულია ლარში გამოწერის გვერდზე."
    }
  };

  const t = (key) => text[key][language];

  return (
    <div className={`min-h-screen p-6 md:p-12 animate-in fade-in ${isMagical ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link to="/" className={`inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl transition-all ${isMagical ? 'bg-slate-800 hover:bg-slate-700 text-amber-100' : 'bg-white hover:bg-slate-100 text-slate-600 shadow-sm'}`}>
            <ChevronLeft size={18} /> {language === 'ka' ? "მთავარი" : "Home"}
        </Link>
        <h1 className={`text-4xl font-bold ${isMagical ? 'text-amber-100 font-serif' : 'text-slate-900'}`}>{t('title')}</h1>
      </div>

      <div className="max-w-4xl mx-auto grid gap-8">
        
        {/* MISSION SECTION */}
        <div className={`p-8 rounded-3xl border-2 ${isMagical ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex items-center gap-3 mb-4">
                <Scroll className={isMagical ? "text-amber-500" : "text-blue-600"} />
                <h2 className="text-2xl font-bold">{t('missionTitle')}</h2>
            </div>
            <p className="text-lg opacity-80 leading-relaxed">{t('mission')}</p>
        </div>

        {/* SERVICE DESCRIPTION (Required by BOG) */}
        <div className={`p-8 rounded-3xl border-2 ${isMagical ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h2 className="text-xl font-bold mb-4">{t('serviceTitle')}</h2>
            <p className="opacity-80">{t('service')}</p>
        </div>

        {/* CONTACT INFO (Required by BOG) */}
        <div className={`p-8 rounded-3xl border-2 ${isMagical ? 'bg-slate-900 border-amber-900/30' : 'bg-blue-50 border-blue-100'}`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShieldCheck className={isMagical ? "text-amber-500" : "text-blue-600"} />
                {t('contactTitle')}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="font-bold text-lg">{companyInfo.name}</div>
                    <div className="opacity-60 text-sm">{companyInfo.id}</div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <MapPin size={20} className="opacity-50" />
                        <span>{companyInfo.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone size={20} className="opacity-50" />
                        <span>{companyInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail size={20} className="opacity-50" />
                        <span>{companyInfo.email}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}