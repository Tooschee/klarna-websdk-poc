const path = require('path');
const fetch = require('node-fetch').default;

const fastify = require('fastify')({ logger: false });

/**
 *  Serve static
 */
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/',
});

/**
 * Create payment intent with acquirer
 */
fastify.get('/order', async function (request, reply) {
  const { amount, currency, interoperabilityToken, returnUrl } = request.query;
  const resp = await fetch(
    `https://klarna-acquirer-interoperability.glitch.me/intent?amount=${amount}&currency=${currency}&returnUrl=${returnUrl}&interoperabilityToken=${interoperabilityToken}`,
  );

  return await resp.json();
});

fastify.get('/paymentRequest', async function (request, reply) {
  const { amount, currency, returnUrl } = request.query;
  const apiKey = process.env.API_KEY;

  const response = await fetch(
    `https://api-global.test.klarna.com/v2/payment/requests`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + apiKey,
      },
      body: JSON.stringify({
        currency,
        amount,
        customer_interaction_config: {
          method: 'HANDOVER',
          return_url: returnUrl,
        },
      }),
    },
  );

  return await response.json();
});

/**
 *  Run the server and report out to the logs
 */
fastify.listen(
  { port: process.env.PORT, host: '0.0.0.0' },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  },
);
