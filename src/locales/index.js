const modules = import.meta.glob('./*.json', { eager: true }); 

const ALL_TRANSLATIONS = {};
const LANGUAGE_OPTIONS = [];

for (const path in modules) {
    const langCode = path.replace('./', '').replace('.json', '');
    const translations = modules[path].default;
    
    ALL_TRANSLATIONS[langCode] = translations;
    
    if (translations._META && translations._META.language) {
        LANGUAGE_OPTIONS.push({
            code: langCode,
            name: translations._META.language
        });
    }
}

export const getTranslationObject = (langCode) => {
    return ALL_TRANSLATIONS[langCode] || ALL_TRANSLATIONS['en'];
};

export const getLanguageOptions = () => {
    return LANGUAGE_OPTIONS;
};