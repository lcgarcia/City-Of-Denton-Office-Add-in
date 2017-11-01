const azure = JSON.parse(process.env.VCAP_SERVICES)['user-provided'][0].credentials;

exports.creds = {
    // Required
    identityMetadata: 'https://login.microsoftonline.com/common/.well-known/openid-configuration', 
    // or equivalently: 'https://login.microsoftonline.com/<tenant_guid>/.well-known/openid-configuration'
    //
    // or you can use the common endpoint
    // 'https://login.microsoftonline.com/common/.well-known/openid-configuration'
    // To use the common endpoint, you have to either set `validateIssuer` to false, or provide the `issuer` value.
  
    // Required, the client ID of your app in AAD  
    clientID: azure.clientId,
  
    // Required, must be 'code', 'code id_token', 'id_token code' or 'id_token' 
    responseType: 'id_token', 
  
    // Required
    responseMode: 'form_post', 
  
    // Required, the reply URL registered in AAD for your app
    redirectUrl: azure.returnUrl, 
  
    // Required if we use http for redirectUrl
    allowHttpForRedirectUrl: true,
    
    // Required if `responseType` is 'code', 'id_token code' or 'code id_token'. 
    // If app key contains '\', replace it with '\\'.
    clientSecret: azure.clientSecret, 
  
    // Required to set to false if you don't want to validate issuer
    validateIssuer: false,
  
    // Required if you want to provide the issuer(s) you want to validate instead of using the issuer from metadata
    issuer: null,
  
    // Required to set to true if the `verify` function has 'req' as the first parameter
    passReqToCallback: true,
  
    // Recommended to set to true. By default we save state in express session, if this option is set to true, then
    // we encrypt state and save it in cookie instead. This option together with { session: false } allows your app
    // to be completely express session free.
    useCookieInsteadOfSession: true,
  
    // Required if `useCookieInsteadOfSession` is set to true. You can provide multiple set of key/iv pairs for key
    // rollover purpose. We always use the first set of key/iv pair to encrypt cookie, but we will try every set of
    // key/iv pair to decrypt cookie. Key can be any string of length 32, and iv can be any string of length 12.
    cookieEncryptionKeys: [ 
      { 'key': '12345678901234567890123456789012', 'iv': '123456789012' },
      { 'key': 'abcdefghijklmnopqrstuvwxyzabcdef', 'iv': 'abcdefghijkl' }
    ],
  
    // Optional. The additional scope you want besides 'openid', for example: ['email', 'profile'].
    scope: null,
  
    // Optional, 'error', 'warn' or 'info'
    loggingLevel: 'error',
  
    // Optional. The lifetime of nonce in session or cookie, the default value is 3600 (seconds).
    nonceLifetime: null,
  
    // Optional. The max amount of nonce saved in session or cookie, the default value is 10.
    nonceMaxAmount: 5,
  
    // Optional. The clock skew allowed in token validation, the default value is 300 seconds.
    clockSkew: null,
  };

  exports.resourceURL = 'https://graph.windows.net';