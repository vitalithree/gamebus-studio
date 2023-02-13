export const environment = {
  production: true,

  hash: '8hDwccSyb2',

  uris: {
    self: 'https://studio.gamebus.eu',
    selfprod: 'https://studio.gamebus.eu',
    assets: 'https://studio.gamebus.eu/assets/static',
    api: 'https://api-new.gamebus.eu/v2',
    airbridge: 'https://airbridge-api.gamebus.eu',
  },

  client: {
    id: 'gamebus_studio_app',
    secret: '',
    dataprovider: 'GameBus Studio',
  },

  languages: ['en', 'nl'], // Default language first

  // Default consent items
  consent: [
    { tk: 'name-visible', required: true },
    { tk: 'terms-conditions', required: true, link: 'https://blog.gamebus.eu/?page_id=1066' }
  ],
};
