const i18nConfig = {
  locales: ["en", "ar"],
  extract: {
    input: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
    ],
    output: "public/locales/{{language}}/{{namespace}}.json",
  },
}

export default i18nConfig
