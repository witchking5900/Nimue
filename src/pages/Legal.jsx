import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, FileText, RefreshCw, Lock, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Legal() {
  const { theme, language } = useTheme();
  const isMagical = theme === 'magical';
  const [activeTab, setActiveTab] = useState('terms');

  const tabs = [
    { id: 'terms', icon: FileText, label: { en: "Terms & Conditions", ka: "წესები და პირობები" } },
    { id: 'privacy', icon: Lock, label: { en: "Privacy Policy", ka: "კონფიდენციალურობა" } },
    { id: 'refund', icon: RefreshCw, label: { en: "Refund & Delivery", ka: "დაბრუნება და მიწოდება" } },
  ];

  return (
    <div className={`min-h-screen p-6 md:p-12 ${isMagical ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-50 hover:opacity-100">
            <ChevronLeft size={18} /> {language === 'ka' ? "უკან" : "Back"}
        </Link>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <ShieldAlert className={isMagical ? "text-amber-500" : "text-blue-600"} />
            {language === 'ka' ? "სამართლებრივი დოკუმენტაცია" : "Legal Documentation"}
        </h1>

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all border-2 ${
                        activeTab === tab.id 
                        ? (isMagical ? 'bg-amber-600 border-amber-600 text-white' : 'bg-blue-600 border-blue-600 text-white shadow-lg')
                        : (isMagical ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-slate-300')
                    }`}
                >
                    <tab.icon size={18} /> {tab.label[language]}
                </button>
            ))}
        </div>

        {/* DOCUMENT CONTAINER */}
        <div className={`p-8 md:p-12 rounded-3xl border-2 min-h-[60vh] text-sm md:text-base leading-relaxed ${isMagical ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            
            {/* --- TAB 1: TERMS AND CONDITIONS --- */}
            {activeTab === 'terms' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-4 mb-6 border-opacity-20 border-gray-500">
                        {language === 'ka' ? "წესები და პირობები" : "Terms and Conditions"}
                    </h2>
                    
                    {language === 'ka' ? (
                        <>
                            <p><strong>1. ზოგადი დებულებები</strong><br/>
                            წინამდებარე წესები და პირობები წარმოადგენს შეთანხმებას მომხმარებელსა და შპს "Nimue's med"-ს შორის (ს/კ: [418486132]). ვებ-გვერდით სარგებლობისას თქვენ ეთანხმებით ამ პირობებს.</p>
                            
                            <p><strong>2. მომსახურების აღწერა</strong><br/>
                            ჩვენ გთავაზობთ ციფრულ საგანმანათლებლო რესურსებს სამედიცინო სფეროში. სერვისი მოიცავს ონლაინ ტესტებს, კლინიკურ ქეისებს და თეორიულ მასალებს.</p>
                            
                            <p><strong>3. რეგისტრაცია და უსაფრთხოება</strong><br/>
                            მომხმარებელი ვალდებულია დაიცვას საკუთარი ანგარიშის უსაფრთხოება. კომპანია არ არის პასუხისმგებელი მესამე პირის მიერ თქვენი ანგარიშის არასანქცირებულ გამოყენებაზე.</p>
                            
                            <p><strong>4. ინტელექტუალური საკუთრება</strong><br/>
                            ვებ-გვერდზე განთავსებული ყველა მასალა (ტექსტი, დიზაინი, ლოგო) წარმოადგენს კომპანიის საკუთრებას. მასალების უნებართვო გავრცელება აკრძალულია.</p>
                        </>
                    ) : (
                        <>
                            <p><strong>1. General Provisions</strong><br/>
                            These Terms and Conditions constitute an agreement between the user and Nimue's med LLC (ID: [418486132]). By using this website, you agree to these terms.</p>
                            
                            <p><strong>2. Service Description</strong><br/>
                            We provide digital educational resources in the medical field. Services include online quizzes, clinical cases, and theoretical materials.</p>
                            
                            <p><strong>3. Registration & Security</strong><br/>
                            Users are responsible for maintaining the confidentiality of their account. The company is not liable for unauthorized use of your account by third parties.</p>
                            
                            <p><strong>4. Intellectual Property</strong><br/>
                            All content on this website (text, design, logos) is the property of the company. Unauthorized distribution is prohibited.</p>
                        </>
                    )}
                </div>
            )}

            {/* --- TAB 2: PRIVACY POLICY --- */}
            {activeTab === 'privacy' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-4 mb-6 border-opacity-20 border-gray-500">
                        {language === 'ka' ? "კონფიდენციალურობის პოლიტიკა" : "Privacy Policy"}
                    </h2>

                    {language === 'ka' ? (
                        <>
                            <p><strong>1. მონაცემთა შეგროვება</strong><br/>
                            ჩვენ ვაგროვებთ მხოლოდ მომსახურების მიწოდებისთვის აუცილებელ ინფორმაციას: სახელი, ელ-ფოსტა და ავტორიზაციის მონაცემები.</p>

                            <p><strong>2. მონაცემთა დამუშავება</strong><br/>
                            თქვენი მონაცემები გამოიყენება მხოლოდ სასწავლო პროგრესის დასათვლელად და ტექნიკური მხარდაჭერისთვის. ჩვენ არ გადავცემთ თქვენს მონაცემებს მესამე პირებს მარკეტინგული მიზნებისთვის.</p>

                            <p><strong>3. ბარათის მონაცემები</strong><br/>
                            ჩვენ არ ვინახავთ თქვენი საბანკო ბარათის მონაცემებს. გადახდები ხორციელდება დაცული საგადახდო სისტემის (Keepz/Bank of Georgia) მეშვეობით.</p>
                        </>
                    ) : (
                        <>
                            <p><strong>1. Data Collection</strong><br/>
                            We collect only information necessary for service delivery: Name, Email, and authentication credentials.</p>

                            <p><strong>2. Data Processing</strong><br/>
                            Your data is used solely for tracking educational progress and technical support. We do not share your data with third parties for marketing purposes.</p>

                            <p><strong>3. Card Information</strong><br/>
                            We do not store your credit card information. Payments are processed securely through our payment provider (Keepz/Bank of Georgia).</p>
                        </>
                    )}
                </div>
            )}

            {/* --- TAB 3: REFUND & DELIVERY --- */}
            {activeTab === 'refund' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-4 mb-6 border-opacity-20 border-gray-500">
                        {language === 'ka' ? "მიწოდების და დაბრუნების პოლიტიკა" : "Delivery & Refund Policy"}
                    </h2>

                    {language === 'ka' ? (
                        <>
                            <p><strong>1. მიწოდების პირობები</strong><br/>
                            მომსახურება (პრემიუმ წვდომა) აქტიურდება გადახდის დასრულებისთანავე, ავტომატურ რეჟიმში. ფიზიკური მიწოდება არ ხორციელდება.</p>

                            <p><strong>2. დაბრუნების პოლიტიკა</strong><br/>
                            რადგან პროდუქტი არის ციფრული და მისი მოხმარება იწყება მყისიერად, გადახდილი თანხა უკან არ ბრუნდება, გარდა იმ შემთხვევისა, თუ დაფიქსირდა ტექნიკური ხარვეზი ჩვენი მხრიდან.</p>

                            <p><strong>3. გამოწერის გაუქმება</strong><br/>
                            მომხმარებელს შეუძლია გააუქმოს გამოწერა ნებისმიერ დროს "პროფილის" გვერდიდან. გაუქმების შემთხვევაში, სერვისი აქტიური დარჩება მიმდინარე პერიოდის ბოლომდე.</p>
                            
                            <div className="mt-8 p-4 border border-amber-500/30 bg-amber-500/10 rounded-xl text-sm">
                                <strong>საკონტაქტო ინფორმაცია:</strong><br/>
                                შპს "Nimue med"<br/>
                                მისამართი: [Gori, Robakidze st #26, Georgia]<br/>
                                ელ-ფოსტა: support@nimue.ge<br/>
                                ტელ: +995 555 00 00 00
                            </div>
                        </>
                    ) : (
                        <>
                            <p><strong>1. Delivery Policy</strong><br/>
                            Service (Premium Access) is activated instantly and automatically upon successful payment. No physical delivery involves.</p>

                            <p><strong>2. Refund Policy</strong><br/>
                            Since the product is digital and consumed instantly, refunds are generally not provided unless there is a proven technical failure on our end.</p>

                            <p><strong>3. Cancellation</strong><br/>
                            Users may cancel their subscription at any time via the "Profile" page. Upon cancellation, access remains active until the end of the current billing period.</p>

                            <div className="mt-8 p-4 border border-amber-500/30 bg-amber-500/10 rounded-xl text-sm">
                                <strong>Contact Information:</strong><br/>
                                Nimue' med LLC<br/>
                                Address: [Gori, Robakidze st #26, Georgia]<br/>
                                Email: support@nimue.ge<br/>
                                Tel: +995 555 00 00 00
                            </div>
                        </>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
}