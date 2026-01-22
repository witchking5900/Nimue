import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, FileText, RefreshCw, Lock, ShieldAlert, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Legal() {
  const { theme, language } = useTheme();
  const isMagical = theme === 'magical';
  const [activeTab, setActiveTab] = useState('disclaimer');

  // Defined tabs including the new Medical Disclaimer
  const tabs = [
    { id: 'disclaimer', icon: Activity, label: { en: "Medical Disclaimer", ka: "სამედიცინო პასუხისმგებლობა" } },
    { id: 'terms', icon: FileText, label: { en: "Terms & Conditions", ka: "წესები და პირობები" } },
    { id: 'privacy', icon: Lock, label: { en: "Privacy Policy", ka: "კონფიდენციალურობა" } },
    { id: 'refund', icon: RefreshCw, label: { en: "Refund Policy", ka: "დაბრუნების პოლიტიკა" } },
  ];

  return (
    <div className={`min-h-screen p-6 md:p-12 transition-colors duration-500 ${isMagical ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-50 hover:opacity-100 transition-opacity">
            <ChevronLeft size={18} /> {language === 'ka' ? "უკან" : "Back"}
        </Link>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <ShieldAlert className={isMagical ? "text-amber-500" : "text-blue-600"} />
            {language === 'ka' ? "სამართლებრივი დოკუმენტაცია" : "Legal Documentation"}
        </h1>

        {/* TABS NAVIGATION */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all border-2 ${
                        activeTab === tab.id 
                        ? (isMagical ? 'bg-amber-600 border-amber-600 text-white' : 'bg-blue-600 border-blue-600 text-white shadow-lg')
                        : (isMagical ? 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-400' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600')
                    }`}
                >
                    <tab.icon size={18} /> {tab.label[language]}
                </button>
            ))}
        </div>

        {/* DOCUMENT CONTENT CONTAINER */}
        <div className={`p-8 md:p-12 rounded-3xl border-2 min-h-[60vh] text-sm md:text-base leading-relaxed animate-in fade-in zoom-in duration-300 ${isMagical ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            
            {/* --- TAB 1: MEDICAL DISCLAIMER (CRITICAL) --- */}
            {activeTab === 'disclaimer' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-4 mb-6 border-opacity-20 border-gray-500 text-red-500 flex items-center gap-2">
                        <Activity size={24} />
                        {language === 'ka' ? "სამედიცინო პასუხისმგებლობის უარყოფა" : "Medical Disclaimer"}
                    </h2>
                    
                    <div className={`p-4 rounded-xl border ${isMagical ? 'bg-red-900/20 border-red-500/30 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <strong>IMPORTANT:</strong> {language === 'ka' ? "გთხოვთ ყურადღებით გაეცნოთ." : "Please read carefully."}
                    </div>

                    {language === 'ka' ? (
                        <>
                            <p><strong>1. საგანმანათლებლო მიზანი</strong><br/>
                            საიტზე (nimue.ge) მოცემული მასალა, ტესტები და კლინიკური სცენარები განკუთვნილია <strong>მხოლოდ საგანმანათლებლო და საინფორმაციო მიზნებისთვის</strong>.</p>
                            
                            <p><strong>2. არ არის სამედიცინო რჩევა</strong><br/>
                            აღნიშნული ინფორმაცია არ წარმოადგენს სამედიცინო რეკომენდაციას, დიაგნოზს ან მკურნალობის ოფიციალურ გაიდლაინს. ის არ ანაცვლებს პროფესიონალურ სამედიცინო კონსულტაციას.</p>
                            
                            <p><strong>3. პასუხისმგებლობის შეზღუდვა</strong><br/>
                            nimue.ge და მისი მფლობელი (შპს "ნიმუე მედ") არ იღებს პასუხისმგებლობას მესამე პირის მიერ ამ მასალებზე დაყრდნობით მიღებულ კლინიკურ გადაწყვეტილებებზე.</p>

                            <p><strong>4. რეალური პაციენტები</strong><br/>
                            ყოველთვის გაიარეთ კონსულტაცია კვალიფიციურ სამედიცინო პერსონალთან რეალური სამედიცინო საკითხების ან პაციენტების მართვის დროს.</p>
                        </>
                    ) : (
                        <>
                            <p><strong>1. Educational Purpose</strong><br/>
                            All content, quizzes, and clinical scenarios on nimue.ge are provided for <strong>educational and informational purposes only</strong>.</p>
                            
                            <p><strong>2. Not Medical Advice</strong><br/>
                            The information provided does not constitute medical advice, diagnosis, or treatment guidelines. It is not a substitute for professional medical consultation.</p>
                            
                            <p><strong>3. Limitation of Liability</strong><br/>
                            nimue.ge and its owner (LLC Nimue Med) expressly disclaim any liability for clinical decisions made based on this material.</p>

                            <p><strong>4. Real World Application</strong><br/>
                            Always consult a qualified healthcare professional for any real-world medical concerns or patient management.</p>
                        </>
                    )}
                </div>
            )}

            {/* --- TAB 2: TERMS AND CONDITIONS --- */}
            {activeTab === 'terms' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-4 mb-6 border-opacity-20 border-gray-500">
                        {language === 'ka' ? "წესები და პირობები" : "Terms and Conditions"}
                    </h2>
                    
                    {language === 'ka' ? (
                        <>
                            <p><strong>1. ზოგადი შეთანხმება</strong><br/>
                            ვებგვერდით სარგებლობით თქვენ ეთანხმებით შპს "ნიმუე მედის" (ს/კ 418486132) წესებს.</p>
                            
                            <p><strong>2. ინტელექტუალური საკუთრება</strong><br/>
                            საიტზე განთავსებული მასალების (ტექსტები, ტესტები, დიზაინი) უნებართვო კოპირება, გავრცელება ან სქრინშოტების გაზიარება აკრძალულია და ისჯება კანონით.</p>
                            
                            <p><strong>3. ანგარიშის გამოყენება</strong><br/>
                            ერთი მომხმარებლის ანგარიშის გამოყენება რამდენიმე პირის მიერ ("ექაუნთის გაზიარება") კატეგორიულად აკრძალულია. დარღვევის შემთხვევაში ადმინისტრაცია იტოვებს უფლებას დაბლოკოს მომხმარებელი გაფრთხილების გარეშე.</p>

                            <p><strong>4. თანხის დაბრუნება</strong><br/>
                            რადგან პროდუქტი ციფრულია, თანხის დაბრუნება არ ხდება მას შემდეგ, რაც მომხმარებელი მიიღებს წვდომას სასწავლო მასალაზე.</p>
                        </>
                    ) : (
                        <>
                            <p><strong>1. General Agreement</strong><br/>
                            By using this website, you agree to the terms of LLC Nimue Med (ID: 418486132).</p>
                            
                            <p><strong>2. Intellectual Property</strong><br/>
                            Unauthorized copying, distribution, or sharing of materials (including screenshots) is strictly prohibited and protected by law.</p>
                            
                            <p><strong>3. Account Use</strong><br/>
                            Sharing a single user account among multiple people is strictly prohibited. We reserve the right to terminate accounts found in violation of this rule.</p>

                            <p><strong>4. Refund Policy</strong><br/>
                            Refund Policy: As this is a digital product, no refunds are issued once access to the educational content has been granted.</p>
                        </>
                    )}
                </div>
            )}

            {/* --- TAB 3: PRIVACY POLICY --- */}
            {activeTab === 'privacy' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-4 mb-6 border-opacity-20 border-gray-500">
                        {language === 'ka' ? "კონფიდენციალურობის პოლიტიკა" : "Privacy Policy"}
                    </h2>

                    {language === 'ka' ? (
                        <>
                            <p><strong>1. მონაცემთა შეგროვება</strong><br/>
                            ჩვენ ვაგროვებთ მხოლოდ იმ მონაცემებს (იმეილი, სახელი, ავტორიზაციის დეტალები), რომლებიც აუცილებელია სერვისის ტექნიკურად მოსაწოდებლად.</p>

                            <p><strong>2. მონაცემთა უსაფრთხოება</strong><br/>
                            თქვენი პერსონალური მონაცემები დაცულია და არ გადაეცემა მესამე პირებს, გარდა კანონით გათვალისწინებული შემთხვევებისა.</p>

                            <p><strong>3. მონაცემთა წაშლა</strong><br/>
                            მომხმარებელს აქვს უფლება მოითხოვოს თავისი ანგარიშისა და ყველა მონაცემის წაშლა ნებისმიერ დროს.</p>
                        </>
                    ) : (
                        <>
                            <p><strong>1. Data Collection</strong><br/>
                            We only collect data (email, name, auth details) necessary to provide our services technically.</p>

                            <p><strong>2. Data Security</strong><br/>
                            Your personal data is secure and will not be shared with third parties, except as required by law.</p>

                            <p><strong>3. Data Deletion</strong><br/>
                            Users have the right to request the deletion of their account and all associated data at any time.</p>
                        </>
                    )}
                </div>
            )}

            {/* --- TAB 4: REFUND & DELIVERY (Explicit) --- */}
            {activeTab === 'refund' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-4 mb-6 border-opacity-20 border-gray-500">
                        {language === 'ka' ? "დაბრუნება და მიწოდება" : "Refund & Delivery"}
                    </h2>

                    {language === 'ka' ? (
                        <>
                            <p><strong>1. მიწოდება</strong><br/>
                            სერვისი აქტიურდება გადახდის დასრულებისთანავე. ფიზიკური მიწოდება არ ხორციელდება.</p>

                            <p><strong>2. დაბრუნების პირობები</strong><br/>
                            გთხოვთ გაითვალისწინოთ: ციფრული პროდუქტების სპეციფიკიდან გამომდინარე, <strong>გადახდილი თანხა უკან არ ბრუნდება</strong>.</p>
                            
                            <div className="mt-8 p-6 border rounded-xl bg-opacity-50 flex flex-col gap-2 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                                <h3 className="font-bold text-lg mb-2">კონტაქტი</h3>
                                <p>შპს "ნიმუე მედ" (ს/კ 418486132)</p>
                                <p>რობაქიძის ქ. #26, გორი, საქართველო</p>
                                <p>Witchking5900@gmail.com</p>
                                <p>+995 551 000 177</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <p><strong>1. Delivery</strong><br/>
                            Service is activated instantly upon payment. No physical delivery is involved.</p>

                            <p><strong>2. Refund Policy</strong><br/>
                            Please note: Due to the nature of digital products, <strong>all sales are final and non-refundable</strong>.</p>

                            <div className="mt-8 p-6 border rounded-xl bg-opacity-50 flex flex-col gap-2 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                                <h3 className="font-bold text-lg mb-2">Contact Info</h3>
                                <p>LLC Nimue Med (ID: 418486132)</p>
                                <p>26 Robakidze St, Gori, Georgia</p>
                                <p>Witchking5900@gmail.com</p>
                                <p>+995 551 000 177</p>
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