export default function (server) {

  server.route({
    path: '/api/vega_vis/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: (new Date()).toISOString() });
    }
  });

}
