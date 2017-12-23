export default kibana => new kibana.Plugin({
  id: 'vega_vis',
  require: ['elasticsearch'],

  uiExports: {
    visTypes: ['plugins/vega_vis/vega_type'],
    injectDefaultVars: server => ({ vegavisConfig: server.config().get('vega_vis') }),
  },

  config: (Joi) => Joi.object({
    enabled: Joi.boolean().default(true),
    enableExternalUrls: Joi.boolean().default(true)
  }).default(),

});
