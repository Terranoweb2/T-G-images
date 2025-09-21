import React from 'react';

const SubscriptionPage: React.FC = () => {
    const plans = [
        {
            name: "Plan Gratuit",
            price: "Gratuit",
            description: "Accès limité pour découvrir T-Glacia Images².",
            features: ["2 générations gratuites", "Téléchargement HD"],
            buttonText: "Actuellement actif",
            current: true,
        },
        {
            name: "Plan Medium",
            price: "5,000 CFA/mois",
            description: "Pour les créateurs occasionnels qui veulent plus de liberté.",
            features: ["Générations illimitées", "Accès à des styles avancés", "Téléchargements prioritaires", "Support standard"],
            buttonText: "S'abonner au Plan Medium"
        },
        {
            name: "Plan Pro",
            price: "15,000 CFA/mois",
            description: "La puissance maximale pour les professionnels et les créateurs intensifs.",
            features: ["Générations illimitées (priorité absolue)", "Tous les styles et fonctionnalités premium", "Téléchargements instantanés", "Support premium 24/7"],
            buttonText: "S'abonner au Plan Pro"
        }
    ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark text-white pt-20 md:pt-24 pb-12 px-4">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Passez à un plan supérieur</h2>
            <p className="text-md md:text-lg text-gray-400 mt-2">Débloquez toutes les fonctionnalités et créez sans limites.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
            {plans.map((plan) => (
                <div key={plan.name} className={`bg-gray-900 border ${plan.current ? 'border-brand-blue' : 'border-gray-700'} rounded-xl p-6 md:p-8 flex flex-col`}>
                    <h3 className="text-2xl font-semibold">{plan.name}</h3>
                    <p className="text-gray-400 mt-2 flex-grow">{plan.description}</p>
                    <div className="text-4xl font-bold my-6">{plan.price}</div>
                    <ul className="space-y-3 mb-8">
                        {plan.features.map(feature => (
                            <li key={feature} className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                {feature}
                            </li>
                        ))}
                    </ul>
                    <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${plan.current ? 'bg-gray-700 text-gray-400 cursor-default' : 'bg-brand-blue hover:bg-blue-500'}`}>
                        {plan.buttonText}
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
};

export default SubscriptionPage;