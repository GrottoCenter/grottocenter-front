# Internationalization / Localization Settings

> Also see the official docs on internationalization/localization:
> https://docs.transifex.com/ & https://formatjs.io/

## TODO

Add script command to update translations from transifex

## Locales

All locale files live under `src/lang`. Here is where you can add translations
as JSON key-value pairs. The name of the file should match the language that you are supporting, which allows for automatic language detection based on request headers.

Here is an example locale stringfile for the Spanish language (`lang/es.json`):

```json
{
  "Hello!": "Hola!",
  "Hello %s, how are you today?": "¿Hola %s, como estas?"
}
```

## Usage

See [our dedicated wiki page](https://github.com/GrottoCenter/grottocenter-front/wiki/Translation-workflow) for more information.
