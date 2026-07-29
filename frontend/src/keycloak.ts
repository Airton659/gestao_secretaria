import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url:      'https://app.funcesi.br/auth',
  realm:    'funcesi-sso',
  clientId: 'avaliacao',
});

export default keycloak;
