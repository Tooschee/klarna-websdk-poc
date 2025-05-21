/**
 * Import Web SDK
 */
async function loadKlarnaSdk() {
  const { KlarnaSDK } = await import(
    'https://js.klarna.com/web-sdk/v2/klarna.mjs'
  );

  return await KlarnaSDK({
    clientId:
      'klarna_test_client_TjMjOUlseXVvS0N6ZllLI3VteEtzWmQ3MHV0b0I_U0ssMDA3MGRjYmItNmM0Mi00MTQzLWIwYmItYjIzZDA2MDRiZWI0LDEseUtkc084TXZ1SlJtRGxXcXFMdzB2SzJURzBMMENnWUFTQTFXMWdCb3dFMD0',
    locale: 'en-US',
  });
}

/**
 * Creates an order with Aquiring partner and returns back a hosted checkout page url
 */
const createOrder = async (amount, currency, interoperabilityToken) => {
  const returnUrl = window.location.href + '/success.html';
  const resp = await fetch(
    `/order?interoperabilityToken=${interoperabilityToken}&amount=${amount}&currency=${currency}&returnUrl=${returnUrl}`,
  );
  const { redirectUrl } = await resp.json();

  return redirectUrl;
};

loadKlarnaSdk().then(async (Klarna) => {
  // adding to the window for debugging purpose
  window.Klarna = Klarna;

  /**
   * Render on-site messaging
   */
  Klarna.Messaging.placement({
    key: 'credit-promotion-auto-size',
    locale: 'en-US',
    purchaseAmount: '2000',
  }).mount('#messaging');

  /**
   * Create payment with acquirer and redirect to payment flow
   */
  document
    .querySelector('#checkout-btn')
    .addEventListener('click', async () => {
      const interoperabilityToken = await Klarna.Interoperability.token();
      const redirectUrl = await createOrder(2000, 'USD', interoperabilityToken);

      window.location = redirectUrl;
    });

  Klarna.Payment.button({
    locale: 'en-US',
    shape: 'default',
    intents: ['PAY'],
    initiate: async () => {
      try {
        const res = await fetch(
          `/paymentRequest?amount=2000&currency=USD&returnUrl=${window.location.href}`,
        );
        const body = await res.json();

        console.log({ body });

        // call your server to create a payment request backend side
        return { paymentRequestId: body.payment_request_id };
      } catch (error) {
        console.log('Error fetching authorization data:', error);
        throw error;
      }
    },
    initiationMode: 'DEVICE_BEST',
  }).mount('#kec-button');

  /**
   * Client side example
   */
  Klarna.Payment.button({
    initiate: () => ({
      currency: 'USD',
      amount: 2000,
      customerInteractionConfig: {
        returnUrl:
          'https://example.com?id={klarna.paymentRequest.id}&token={klarna.paymentRequest.payment_token}',
      },
    }),
    initiationMode: 'ON_PAGE',
  }).mount('#klarna-payment-btn');

  Klarna.Payment.on('error', async (err) => {
    console.log('Payment error:', err);
  });

  Klarna.Payment.on('complete', async (paymentRequest) => {
    const interoperabilityToken =
      paymentRequest.stateContext.interoperabilityToken;
    const redirectUrl = await createOrder(2000, 'USD', interoperabilityToken);

    window.location = redirectUrl;
    return false;
  });

  document.querySelector('#interoperability-token').innerText =
    await Klarna.Interoperability.token();
});
