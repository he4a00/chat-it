const i18nConfig = {
  locales: ["en", "ar"],
  extract: {
    input: "src/**/*.{js,jsx,ts,tsx}",
    output: "public/locales/{{language}}/{{namespace}}.json",
  },
}

export default i18nConfig